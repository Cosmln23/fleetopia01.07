import winston from 'winston'

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
}

// Tell winston that you want to link the colors
winston.addColors(colors)

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
)

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }),
  // File transport for errors
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }),
  // File transport for all logs
  new winston.transports.File({
    filename: 'logs/combined.log',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  })
]

// Create logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  levels,
  format,
  transports,
})

// API request logging middleware
export const logRequest = (req: any, res: any, next: any) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    const { method, url, headers } = req
    const { statusCode } = res
    
    const logData = {
      method,
      url,
      statusCode,
      duration,
      userAgent: headers['user-agent'],
      ip: headers['x-forwarded-for'] || headers['x-real-ip'] || req.ip,
      timestamp: new Date().toISOString()
    }
    
    if (statusCode >= 400) {
      logger.error(`${method} ${url} - ${statusCode} - ${duration}ms`, logData)
    } else {
      logger.info(`${method} ${url} - ${statusCode} - ${duration}ms`, logData)
    }
  })
  
  next()
}

// Database operation logging
export const logDbOperation = (operation: string, table: string, duration: number, error?: Error) => {
  const logData = {
    operation,
    table,
    duration,
    timestamp: new Date().toISOString()
  }
  
  if (error) {
    logger.error(`DB Error: ${operation} on ${table} - ${error.message}`, {
      ...logData,
      error: error.stack
    })
  } else {
    logger.info(`DB: ${operation} on ${table} - ${duration}ms`, logData)
  }
}

// WebSocket event logging
export const logWebSocketEvent = (event: string, data: any, clientId?: string) => {
  logger.info(`WebSocket: ${event}`, {
    event,
    clientId,
    data: JSON.stringify(data),
    timestamp: new Date().toISOString()
  })
}

// Performance monitoring
export const logPerformance = (operation: string, duration: number, metadata?: any) => {
  const logData = {
    operation,
    duration,
    metadata,
    timestamp: new Date().toISOString()
  }
  
  if (duration > 1000) {
    logger.warn(`Slow operation: ${operation} - ${duration}ms`, logData)
  } else {
    logger.info(`Performance: ${operation} - ${duration}ms`, logData)
  }
}

// Security event logging
export const logSecurityEvent = (event: string, details: any, severity: 'low' | 'medium' | 'high' = 'medium') => {
  const logData = {
    event,
    details,
    severity,
    timestamp: new Date().toISOString()
  }
  
  if (severity === 'high') {
    logger.error(`Security Alert: ${event}`, logData)
  } else if (severity === 'medium') {
    logger.warn(`Security Warning: ${event}`, logData)
  } else {
    logger.info(`Security Info: ${event}`, logData)
  }
}

// Export logger instance
export default logger