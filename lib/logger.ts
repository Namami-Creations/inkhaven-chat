// Logger service using Winston
import winston from 'winston'
type LogInfo = { timestamp?: string; level: string; message: string }

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
}

winston.addColors(colors)

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info: LogInfo) => `${(info.timestamp ?? '') as string} ${info.level}: ${info.message}`,
  ),
)

const transports = process.env.VERCEL
  ? [new winston.transports.Console()]
  : [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
      new winston.transports.File({ filename: 'logs/all.log' }),
    ]

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports,
})

export default logger

// Helper functions for different log levels
export const logError = (message: string, error?: Error, meta?: any) => {
  logger.error(message, {
    error: error?.message,
    stack: error?.stack,
    ...meta,
  })
}

export const logWarn = (message: string, meta?: any) => {
  logger.warn(message, meta)
}

export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta)
}

export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta)
}

// Performance logging
export const logPerformance = (operation: string, duration: number, meta?: any) => {
  logger.info(`Performance: ${operation} took ${duration}ms`, meta)
}

// API logging
export const logAPI = (method: string, url: string, statusCode?: number, duration?: number) => {
  const level = statusCode && statusCode >= 400 ? 'error' : 'http'
  logger.log(level, `API ${method} ${url}`, {
    statusCode,
    duration: duration ? `${duration}ms` : undefined,
  })
}
