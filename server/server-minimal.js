// Minimal server test to isolate 500 error
const express = require('express')
const http = require('http')
const path = require('path')
const fs = require('fs')

console.log('🚀 Starting Minimal Server Test...')

const app = express()
const server = http.createServer(app)

const PORT = process.env.PORT || 3000

// Basic middleware
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// CORS
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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Static files
const distPath = path.join(__dirname, '..', 'dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  console.log('✅ Serving static files from:', distPath)
} else {
  console.log('⚠️ No dist directory found')
}

// Catch-all for SPA
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html')
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    res.status(404).json({ error: 'Frontend not built' })
  }
})

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎮 Minimal Server Running on port ${PORT}`)
  console.log(`📡 HTTP: http://localhost:${PORT}`)
  console.log('✅ Server started successfully')
})
