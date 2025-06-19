import express, { Request, Response, NextFunction } from 'express';

const app = express();

interface LogData {
    timestamp: string;
    method: string;
    url: string;
    ip?: string;
    userAgent?: string;
    body?: any;
  }
  
  app.use((req: Request, res: Response, next: NextFunction) => {
    const logData: LogData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      body: req.body,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };
    
    console.log(logData);
    next();
  });

  export default app;