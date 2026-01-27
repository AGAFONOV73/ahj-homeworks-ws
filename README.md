# Чат с WebSocket и EventSource

[![Build status](https://ci.appveyor.com/api/projects/status/wkpmu8pb8ag14t54?svg=true)](https://ci.appveyor.com/project/AGAFONOV73/ahj-homeworks-ws)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Deployed-brightgreen)](https://agafonov73.github.io/ahj-homeworks-ws/)

**👁️ Демо-клиент (GitHub Pages)**: [https://agafonov73.github.io/ahj-homeworks-ws](https://agafonov73.github.io/ahj-homeworks-ws)

**⚙️ Сервер (Render)**: `wss://ahj-homeworks-ws.onrender.com`

## 🚀 Функционал
- Авторизация с уникальным никнеймом
- Чат в реальном времени через WebSocket
- Обновление списка пользователей через EventSource
- Разное выравнивание сообщений (свои — справа, чужие — слева)
- Автоматическое удаление отключившихся пользователей

## 🛠️ Технологии
- **Клиент**: Vanilla JavaScript, Webpack 5, SCSS
- **Сервер**: Node.js, WebSocket (ws), EventSource (SSE)
- **CI/CD**: AppVeyor (автоматическая сборка и деплой)
- **Хостинг**: Render (сервер), GitHub Pages (клиент)

## 📦 Локальный запуск

### Установка зависимостей
```bash
npm install