export default function Message(from, text, isOwn) {
    const container = document.createElement('div');
    container.className = `chat__message${isOwn ? ' chat__message--own' : ''}`;
  
    const header = document.createElement('div');
    header.className = 'chat__message-header';
    const now = new Date();
    const time = now.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit'
    }).replace(/\s/g, '');
    const date = now.toLocaleDateString('ru-RU');
    
    header.textContent = `${from}, ${time} ${date}`;
    
    if (isOwn) {
      header.style.color = '#ff6b6b';
    }
  
    const textEl = document.createElement('div');
    textEl.className = 'chat__message-text';
    textEl.textContent = text;
  
    container.append(header, textEl);
    return container;
  }