import express, { Request, Response } from 'express';
import WhatsappController from './controllers/WhatsappController';

const app = express();
const expressPort = process.env.APP_PORT || 3000;

app.use(express.json());

app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Hello world',
  });
});

app.get('/status', WhatsappController.getStatus);
app.get('/qr', WhatsappController.getQR);

app.post('/logout', WhatsappController.logout);
app.post('/send-message', WhatsappController.sendMessage);

export default app;
export { expressPort };
