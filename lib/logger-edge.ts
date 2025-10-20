export const logError = (message: string, error?: Error, meta?: any) => {
  if (error) console.error(message, { error: error.message, stack: error.stack, ...meta })
  else console.error(message, meta)
}

export const logWarn = (message: string, meta?: any) => {
  console.warn(message, meta)
}

export const logInfo = (message: string, meta?: any) => {
  console.info(message, meta)
}

export const logDebug = (message: string, meta?: any) => {
  console.debug(message, meta)
}

export const logPerformance = (operation: string, duration: number, meta?: any) => {
  console.info(`Performance: ${operation} took ${duration}ms`, meta)
}

export const logAPI = (method: string, url: string, statusCode?: number, duration?: number) => {
  const level = statusCode && statusCode >= 400 ? 'error' : 'log'
  ;(console as any)[level](`API ${method} ${url}`, {
    statusCode,
    duration: duration ? `${duration}ms` : undefined,
  })
}
