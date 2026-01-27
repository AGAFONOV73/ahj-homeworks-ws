import { WebSocketServer } from 'ws';

export default function initWS(server) {
  const wss = new WebSocketServer({ server });
  const clients = new Map();

  const broadcast = (data) => {
    const payload = JSON.stringify(data);
    [...wss.clients]
      .filter(client => client.readyState === client.OPEN)
      .forEach(client => client.send(payload));
  };

  const usersList = () => [...clients.values()];

  wss.on('connection', (ws) => {
    ws.on('message', (raw) => {
      const message = JSON.parse(raw);

      if (message.type === 'join') {
        if (usersList().includes(message.nickname)) {
          ws.send(JSON.stringify({ type: 'error', message: 'nickname_taken' }));
          return;
        }

        clients.set(ws, message.nickname);
        ws.send(JSON.stringify({ type: 'init', users: usersList() }));
        broadcast({ type: 'users', users: usersList() });
      }

      if (message.type === 'message') {
        const nickname = clients.get(ws);
        broadcast({
          type: 'message',
          from: nickname,
          text: message.text,
        });
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      broadcast({ type: 'users', users: usersList() });
    });
  });
}