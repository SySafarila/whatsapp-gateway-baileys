import { Request, Response } from 'express';
import {
  whatsApp,
  isLoggedIn as whatsAppIsLoggedIn,
  logoutAndRestartWhatsApp as whatsAppLogout,
  whatsAppQr,
} from '../whatsApp';

export default class WhatsappController {
  public static getStatus = (_req: Request, res: Response) => {
    res.json({
      logged_in: whatsAppIsLoggedIn(),
    });
  };

  public static getQR = (_req: Request, res: Response) => {
    res.json({
      qr: whatsAppQr,
    });
  };

  public static logout = (_req: Request, res: Response) => {
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
  };

  public static sendMessage = (req: Request, res: Response) => {
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
      res.status(401).json({
        message: 'whatsapp client not started',
      });
    }
  };
}
