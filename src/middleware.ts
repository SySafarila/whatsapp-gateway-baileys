import { NextFunction, Request, Response } from 'express';

export const APIKEY = (req: Request, res: Response, next: NextFunction) => {
  const API_KEY = process.env.API_KEY;
  const token = req.get('X-Api-Key');

  if (!API_KEY) {
    console.warn('YOUR SYSTEM IS NOT SECURE, PLEASE DEFINE API_KEY ON .env');
    next();
    return;
  } else {
    if (!token) {
      res.status(401).json({
        message: 'Invalid API Key',
      });
      return;
    }

    if (API_KEY != token) {
      res.status(401).json({
        message: 'Invalid API Key',
      });
      return;
    }
    next();
    return;
  }
};
