// server/src/utils/logger.js - NEW FILE
/**
 * Simple production-ready logger
 */

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const COLORS = {
  error: '\x1b[31m', // Red
  warn: '\x1b[33m',  // Yellow
  info: '\x1b[36m',  // Cyan
  debug: '\x1b[35m', // Magenta
  reset: '\x1b[0m'
};

class Logger {
  constructor() {
    this.level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  shouldLog(level) {
    return LOG_LEVELS[level] <= LOG_LEVELS[this.level];
  }

  format(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    
    if (this.isProduction) {
      // JSON format for production
      return JSON.stringify({
        timestamp,
        level,
        message,
        ...meta
      });
    } else {
      // Colored format for development
      const color = COLORS[level] || COLORS.info;
      const metaStr = Object.keys(meta).length > 0 ? '\n' + JSON.stringify(meta, null, 2) : '';
      return `${color}[${timestamp}] [${level.toUpperCase()}]${COLORS.reset} ${message}${metaStr}`;
    }
  }

  error(message, meta = {}) {
    if (this.shouldLog('error')) {
      console.error(this.format('error', message, meta));
    }
  }

  warn(message, meta = {}) {
    if (this.shouldLog('warn')) {
      console.warn(this.format('warn', message, meta));
    }
  }

  info(message, meta = {}) {
    if (this.shouldLog('info')) {
      console.log(this.format('info', message, meta));
    }
  }

  debug(message, meta = {}) {
    if (this.shouldLog('debug')) {
      console.log(this.format('debug', message, meta));
    }
  }
}

const logger = new Logger();
export default logger;