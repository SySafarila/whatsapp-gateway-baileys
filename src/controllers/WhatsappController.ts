import { Request, Response } from 'express';
import Joi from 'joi';
import HttpError from '../utils/HttpError';
import ValidateSendMessage from '../validators/ValidateSendMessage';
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

  public static sendMessage = async (req: Request, res: Response) => {
    const { message, phone_number } = req.body as {
      message: string;
      phone_number: number;
    };

    try {
      await ValidateSendMessage.sendMessage({ message, phone_number });

      if (String(phone_number).startsWith('0')) {
        throw new HttpError({
          message:
            'please use country code for phone_number, example: 62821xxx',
          statusCode: 400,
        });
      }

      if (!whatsApp || !whatsApp.user) {
        throw new HttpError({
          message: 'WhatsApp client unauthenticated',
          statusCode: 401,
        });
      }

      const checkOnWhatsapp = await whatsApp.onWhatsApp(
        String(phone_number + '@s.whatsapp.net'),
      );

      if (!checkOnWhatsapp || checkOnWhatsapp.length === 0) {
        throw new HttpError({
          message: 'Phone number not found on WhatsApp',
          statusCode: 404,
        });
      }

      await whatsApp.sendMessage(String(phone_number + '@s.whatsapp.net'), {
        text: message,
      });

      res.json({
        message: 'success',
        phone_number: phone_number,
      });
    } catch (error) {
      if (error instanceof Joi.ValidationError) {
        res.status(400).json({
          message: error.message,
          errors: error.details,
        });
        return;
      }

      if (error instanceof HttpError) {
        res.status(error.statusCode).json({
          message: error.message,
        });
        return;
      }

      res.status(401).json({
        message: (error as Error).message,
        phone_number: phone_number,
      });
    }
  };
}
