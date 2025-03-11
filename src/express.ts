import express, { Request, Response } from 'express';
import {
  isLoggedIn,
  whatsApp,
  logoutAndRestartWhatsApp as whatsAppLogout,
} from './whatsApp';

const app = express();
const expressPort = process.env.APP_PORT || 3000;

app.use(express.json());

app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Hello world',
  });
});

app.get('/status', (_req: Request, res: Response) => {
  res.json({
    logged_in: isLoggedIn(),
  });
});

app.post('/logout', (_req: Request, res: Response) => {
  if (!whatsApp?.user) {
    res.status(401).json({
      message: 'WhatsApp not logged in',
    });
  } else {
    whatsAppLogout(whatsApp);
    res.json({
      message: 'Logout success',
    });
  }
});

app.post('/send-message', (req: Request, res: Response) => {
  const { message, phone_number } = req.body as {
    message: string;
    phone_number: number;
  };

  if (!message || !phone_number) {
    res.status(400).json({
      message: 'message or number are required',
    });
  }

  if (whatsApp && whatsApp.user) {
    whatsApp
      .sendMessage(String(phone_number + '@s.whatsapp.net'), {
        text: message,
      })
      .then(() => {
        res.json({
          message: 'success',
        });
      })
      .catch(() => {
        res.status(500).json({
          message: 'failed',
        });
      });
  } else {
    res.status(500).json({
      message: 'whatsapp client not started',
    });
  }
});

export default app;
export { expressPort };
