const winston = require('winston');

// Create a logger instance
const logger = winston.createLogger({
  level: 'info', // Set log level to 'info' or 'error' as needed
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple())
    }),
    new winston.transports.File({ filename: 'debug-log.log' })  // Log errors to a file
  ],
});

module.exports = logger;
