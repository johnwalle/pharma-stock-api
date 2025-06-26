import { createLogger, format, transports } from 'winston';
import path from 'path';

// Define log directory
const logDir = path.resolve(__dirname, '../../logs');

// Define custom log format
const logFormat = format.printf(({ timestamp, level, message, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = createLogger({
  level: 'info', // Default log level
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }), // Print full stack trace for errors
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'pharma-stock-api' },
  transports: [
    // Write all logs with level `info` and below to file
    new transports.File({ filename: path.join(logDir, 'combined.log') }),
    // Write all logs with level `error` and below to error.log
    new transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
  ],
});

// If not in production, log to the console with colorized output
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    })
  );
}

export default logger;
