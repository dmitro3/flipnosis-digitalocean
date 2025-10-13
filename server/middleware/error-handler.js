/**
 * Error handler middleware for the server
 * Prevents 500 errors from breaking the deployment
 */

function errorHandler(err, req, res, next) {
  console.error('🚨 Server Error:', err)
  
  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  const errorResponse = {
    error: isDevelopment ? err.message : 'Internal Server Error',
    status: 500,
    timestamp: new Date().toISOString()
  }
  
  if (isDevelopment) {
    errorResponse.stack = err.stack
  }
  
  res.status(500).json(errorResponse)
}

function notFoundHandler(req, res, next) {
  // Handle favicon.ico requests gracefully
  if (req.url === '/favicon.ico') {
    return res.status(204).end() // No content
  }
  
  res.status(404).json({
    error: 'Not Found',
    path: req.url,
    timestamp: new Date().toISOString()
  })
}

module.exports = {
  errorHandler,
  notFoundHandler
}
