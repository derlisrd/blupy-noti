import { Response, Request, NextFunction } from "express";

export async function apikeymiddleware(req: Request, res: Response, next: NextFunction) {
  const apikey = req.headers['x-api-key'];
  if (!apikey) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized api key',
    });
  }
  const apikey_config = process.env.API_KEY;
  if (apikey !== apikey_config) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized api key',
    });
  }
  next();
}