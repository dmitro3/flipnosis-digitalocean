// Fallback server - guaranteed to work
const express = require('express')
const http = require('http')
const path = require('path')
const fs = require('fs')

console.log('🚀 Starting Fallback Server...')

const app = express()
const server = http.createServer(app)
const PORT = process.env.PORT || 3000

// Basic CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
  } else {
    next()
  }
})

// JSON parsing
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Fallback server running'
  })
})

// Static files
const distPath = path.join(__dirname, '..', 'dist')
console.log('📁 Checking dist path:', distPath)
console.log('📁 Dist exists:', fs.existsSync(distPath))

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  console.log('✅ Serving static files from:', distPath)
} else {
  console.log('⚠️ No dist directory found - creating placeholder')
  
  // Create a simple index.html if dist doesn't exist
  const simpleHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Flipnosis - Server Running</title>
  <style>
    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
    .status { color: green; font-size: 24px; }
  </style>
</head>
<body>
  <h1 class="status">✅ Server is Running!</h1>
  <p>Fallback server is working correctly.</p>
  <p>Static files will be served once the build is deployed.</p>
</body>
</html>`
  
  app.get('/', (req, res) => {
    res.send(simpleHtml)
  })
}

// Catch-all for SPA (only if dist exists)
if (fs.existsSync(distPath)) {
  app.get('*', (req, res) => {
    const indexPath = path.join(distPath, 'index.html')
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath)
    } else {
      res.status(404).json({ error: 'index.html not found' })
    }
  })
}

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Fallback server error:', err)
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  })
})

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log('═══════════════════════════════════════════')
  console.log(`🎮 Fallback Server Running`)
  console.log(`📡 HTTP: http://localhost:${PORT}`)
  console.log(`📁 Dist path: ${distPath}`)
  console.log(`📁 Dist exists: ${fs.existsSync(distPath)}`)
  console.log('═══════════════════════════════════════════')
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📛 SIGTERM received, shutting down gracefully...')
  server.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('📛 SIGINT received, shutting down gracefully...')
  server.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
})
