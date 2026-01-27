import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import Koa from 'koa';
import serve from 'koa-static';
import initWS from './ws.js';

const PORT = process.env.PORT || 3000;
const app = new Koa();

// Получаем __dirname для ES-модулей
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Путь к папке с фронтендом
const frontendPath = path.resolve(__dirname, '../../frontend/dist');
app.use(serve(frontendPath));

const server = http.createServer(app.callback());
initWS(server);

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});