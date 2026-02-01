export default class WSClient {
  constructor(url, options = {}) {
      this.url = url;
      this.ws = null;
      this.listeners = {};
      this.errorListeners = {};
      this.messageQueue = [];
      this.reconnectAttempts = 0;
      this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
      this.reconnectDelay = options.reconnectDelay || 3000;
      this.autoReconnect = options.autoReconnect !== false;
      
      this.connect();
      
      // Автоматический пинг для поддержания соединения
      if (options.enablePing !== false) {
          this.startPing(options.pingInterval || 30000);
      }
  }
  
  connect() {
      try {
          this.ws = new WebSocket(this.url);
          this.setupEventListeners();
      } catch (error) {
          console.error('Ошибка создания WebSocket:', error);
          this.emitError('connect_error', error);
      }
  }
  
  setupEventListeners() {
      this.ws.addEventListener('open', (event) => {
          console.log('✅ WebSocket соединение установлено');
          this.reconnectAttempts = 0;
          this.emit('open', event);
          this.flushMessageQueue();
      });
      
      this.ws.addEventListener('message', (event) => {
          try {
              // Проверяем, не пинг ли это
              if (event.data === '__ping__') {
                  this.ws.send('__pong__');
                  return;
              }
              
              const data = JSON.parse(event.data);
              
              // Валидация данных
              if (!data || typeof data !== 'object') {
                  throw new Error('Некорректный формат данных');
              }
              
              if (!data.type || typeof data.type !== 'string') {
                  throw new Error('Отсутствует поле type в сообщении');
              }
              
              // Вызываем обработчик
              if (this.listeners[data.type]) {
                  this.listeners[data.type](data);
              } else if (this.listeners['*']) {
                  this.listeners['*'](data);
              } else {
                  console.warn(`⚠️ Необработанный тип сообщения: ${data.type}`, data);
                  this.emit('unhandled', { type: data.type, data });
              }
              
          } catch (error) {
              console.error('❌ Ошибка обработки сообщения:', error);
              console.error('Исходные данные:', event.data);
              this.emitError('parse_error', {
                  error: error.message,
                  rawData: event.data,
                  originalError: error
              });
          }
      });
      
      this.ws.addEventListener('error', (error) => {
          console.error('❌ WebSocket ошибка:', error);
          this.emitError('ws_error', error);
      });
      
      this.ws.addEventListener('close', (event) => {
          const reason = event.reason || 'Unknown reason';
          console.log(`🔌 WebSocket закрыт. Код: ${event.code}, Причина: ${reason}`);
          
          this.emit('close', { code: event.code, reason: reason });
          this.emitError('ws_close', { code: event.code, reason: reason });
          
          // Автопереподключение
          if (this.autoReconnect && this.shouldReconnect(event)) {
              this.scheduleReconnect();
          }
      });
  }
  
  on(type, callback) {
      if (typeof callback !== 'function') {
          throw new Error('Callback должен быть функцией');
      }
      this.listeners[type] = callback;
      return this; // для чейнинга
  }
  
  onAny(callback) {
      if (typeof callback !== 'function') {
          throw new Error('Callback должен быть функцией');
      }
      this.listeners['*'] = callback;
      return this;
  }
  
  onError(type, callback) {
      if (typeof callback !== 'function') {
          throw new Error('Callback должен быть функцией');
      }
      if (!this.errorListeners[type]) {
          this.errorListeners[type] = [];
      }
      this.errorListeners[type].push(callback);
      return this;
  }
  
  emit(eventType, data) {
      if (this.listeners[eventType]) {
          try {
              this.listeners[eventType](data);
          } catch (error) {
              console.error(`Ошибка в обработчике ${eventType}:`, error);
          }
      }
  }
  
  emitError(errorType, errorData) {
      const listeners = this.errorListeners[errorType] || [];
      const globalListeners = this.errorListeners['*'] || [];
      
      const errorWithType = { type: errorType, ...errorData };
      
      [...listeners, ...globalListeners].forEach(callback => {
          try {
              callback(errorWithType);
          } catch (err) {
              console.error('Ошибка в обработчике ошибок:', err);
          }
      });
  }
  
  send(data) {
      // Если соединение открыто - отправляем сразу
      if (this.isConnected()) {
          return this.sendImmediately(data);
      }
      
      // Иначе добавляем в очередь
      console.log('⏳ WebSocket не подключен. Добавляю в очередь:', data?.type || 'unknown');
      
      const messageId = Date.now();
      const queuedMessage = {
          id: messageId,
          data,
          timestamp: Date.now(),
          attempts: 0
      };
      
      this.messageQueue.push(queuedMessage);
      
      // Возвращаем промис для отслеживания
      return new Promise((resolve, reject) => {
          queuedMessage.resolve = resolve;
          queuedMessage.reject = reject;
      });
  }
  
  sendImmediately(data) {
      if (!this.isConnected()) {
          return false;
      }
      
      try {
          const jsonData = JSON.stringify(data);
          this.ws.send(jsonData);
          return true;
      } catch (error) {
          console.error('❌ Ошибка отправки сообщения:', error);
          this.emitError('send_error', { 
              error: error.message, 
              data: data 
          });
          return false;
      }
  }
  
  sendSafe(type, payload = {}) {
      return this.send({
          type,
          ...payload,
          timestamp: new Date().toISOString(),
          messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });
  }
  
  flushMessageQueue() {
      if (this.messageQueue.length === 0) return;
      
      console.log(`📤 Отправляю ${this.messageQueue.length} сообщений из очереди`);
      
      const remaining = [];
      
      this.messageQueue.forEach(queuedMessage => {
          if (this.sendImmediately(queuedMessage.data)) {
              if (queuedMessage.resolve) {
                  queuedMessage.resolve({
                      success: true,
                      message: 'Сообщение отправлено',
                      data: queuedMessage.data,
                      queued: true
                  });
              }
          } else {
              queuedMessage.attempts++;
              if (queuedMessage.attempts < 3) {
                  remaining.push(queuedMessage);
              } else {
                  if (queuedMessage.reject) {
                      queuedMessage.reject({
                          success: false,
                          error: 'Превышено количество попыток отправки',
                          data: queuedMessage.data
                      });
                  }
              }
          }
      });
      
      this.messageQueue = remaining;
  }
  
  startPing(interval) {
      this.pingInterval = setInterval(() => {
          if (this.isConnected()) {
              try {
                  this.ws.send('__ping__');
              } catch (error) {
                  console.error('Ошибка отправки ping:', error);
              }
          }
      }, interval);
  }
  
  stopPing() {
      if (this.pingInterval) {
          clearInterval(this.pingInterval);
          this.pingInterval = null;
      }
  }
  
  scheduleReconnect() {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error(`🚫 Достигнут максимум попыток переподключения (${this.maxReconnectAttempts})`);
          this.emitError('max_reconnect_attempts', {
              attempts: this.reconnectAttempts,
              maxAttempts: this.maxReconnectAttempts
          });
          return;
      }
      
      this.reconnectAttempts++;
      const delay = Math.min(
          this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1),
          30000 // Максимум 30 секунд
      );
      
      console.log(`🔄 Попытка переподключения ${this.reconnectAttempts}/${this.maxReconnectAttempts} через ${delay}мс`);
      
      setTimeout(() => {
          if (!this.isConnected() && !this.ws || this.ws.readyState === WebSocket.CLOSED) {
              console.log('🔄 Переподключаюсь...');
              this.connect();
          }
      }, delay);
  }
  
  shouldReconnect(closeEvent) {
      // Не переподключаемся при нормальном закрытии (1000) или уходе со страницы (1001)
      const dontReconnectCodes = [1000, 1001];
      return !dontReconnectCodes.includes(closeEvent.code);
  }
  
  isConnected() {
      return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
  
  getState() {
      if (!this.ws) {
          return { 
              code: -1, 
              text: 'NOT_INITIALIZED',
              queueSize: this.messageQueue.length,
              reconnectAttempts: this.reconnectAttempts
          };
      }
      
      const states = {
          [WebSocket.CONNECTING]: 'CONNECTING',
          [WebSocket.OPEN]: 'OPEN',
          [WebSocket.CLOSING]: 'CLOSING',
          [WebSocket.CLOSED]: 'CLOSED'
      };
      
      return {
          code: this.ws.readyState,
          text: states[this.ws.readyState] || 'UNKNOWN',
          queueSize: this.messageQueue.length,
          reconnectAttempts: this.reconnectAttempts,
          url: this.url
      };
  }
  
  close(code = 1000, reason = '') {
      this.autoReconnect = false;
      this.stopPing();
      
      if (this.ws) {
          this.ws.close(code, reason);
      }
      
      // Очищаем очередь
      this.messageQueue.forEach(msg => {
          if (msg.reject) {
              msg.reject({
                  success: false,
                  error: 'Соединение закрыто',
                  code,
                  reason
              });
          }
      });
      this.messageQueue = [];
  }
  
  reconnect(url = this.url) {
      console.log('🔄 Запуск переподключения...');
      this.close(1000, 'Reconnecting');
      this.url = url || this.url;
      this.reconnectAttempts = 0;
      this.connect();
  }
  
  // Вспомогательные методы
  getQueueSize() {
      return this.messageQueue.length;
  }
  
  clearQueue() {
      const cleared = this.messageQueue.length;
      this.messageQueue = [];
      return cleared;
  }
  
  // Деструктор
  destroy() {
      this.close();
      this.listeners = {};
      this.errorListeners = {};
  }
}