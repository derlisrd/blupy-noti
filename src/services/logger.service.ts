import winston from 'winston';

// Definir tipos personalizados para metadata
interface LogMetadata {
  userId?: string;
  requestId?: string;
  operation?: string;
  [key: string]: any;
}

class Logger {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { 
        service: 'mi-aplicacion',
        version: process.env.npm_package_version 
      },
      transports: [
        new winston.transports.File({ 
          filename: 'logs/error.log', 
          level: 'error' 
        }),
        new winston.transports.File({ 
          filename: 'logs/combined.log' 
        }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });
  }

  info(message: string, metadata?: LogMetadata): void {
    this.logger.info(message, metadata);
  }

  warn(message: string, metadata?: LogMetadata): void {
    this.logger.warn(message, metadata);
  }

  error(message: string, error?: Error, metadata?: LogMetadata): void {
    this.logger.error(message, { 
      error: error?.message,
      stack: error?.stack,
      ...metadata 
    });
  }

  debug(message: string, metadata?: LogMetadata): void {
    this.logger.debug(message, metadata);
  }
}

// Singleton para usar en toda la aplicación
export const logger = new Logger();

