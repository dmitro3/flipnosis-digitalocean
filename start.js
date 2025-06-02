const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

console.log('🚀 Starting FLIPNOSIS server...')
console.log('📁 Current directory:', __dirname)
console.log('📁 Process CWD:', process.cwd())

// List contents to debug
console.log('📂 Listing contents of directory:', __dirname)
const contents = fs.readdirSync(__dirname)
contents.forEach(item => {
  const fullPath = path.join(__dirname, item)
  const stats = fs.statSync(fullPath)
  console.log(stats.isDirectory() ? `📁 ${item}` : `📄 ${item}`)
})

// Check if dist folder exists and list its contents
const distPath = path.join(__dirname, 'dist')
if (fs.existsSync(distPath)) {
  console.log('✅ Found dist folder')
  console.log('📄 Dist contents:', fs.readdirSync(distPath))
} else {
  console.log('❌ No dist folder found')
}

// Check if server folder exists
const serverPath = path.join(__dirname, 'server')
if (fs.existsSync(serverPath)) {
  console.log('✅ Found server folder')
  console.log('📄 Server contents:', fs.readdirSync(serverPath))
} else {
  console.log('❌ No server folder found')
}

// Start the server - the server file is in the same directory level
const serverFile = path.join(__dirname, 'server', 'server.js')
console.log('🚀 Starting server from:', serverFile)

// Verify the server file exists
if (!fs.existsSync(serverFile)) {
  console.error('❌ Server file not found at:', serverFile)
  process.exit(1)
}

const server = spawn('node', [serverFile], {
  stdio: 'inherit',
  env: { 
    ...process.env, 
    NODE_ENV: 'production',
    DATABASE_PATH: process.env.DATABASE_PATH || '/app/games.db'
  },
  cwd: __dirname
})

server.on('error', (err) => {
  console.error('❌ Failed to start server:', err)
  process.exit(1)
})

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`)
  process.exit(code)
}) 