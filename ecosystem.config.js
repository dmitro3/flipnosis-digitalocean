module.exports = {
  apps: [{
    name: 'flipnosis-app',
    script: 'server/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000,
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HTTPS_PORT: 3001,

      // Blockchain configuration (server-side)
      CONTRACT_ADDRESS: '0x1800C075E5a939B8184A50A7efdeC5E1fFF8dd29',
      RPC_URL: 'https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3',
      CONTRACT_OWNER_KEY: process.env.CONTRACT_OWNER_KEY || process.env.PRIVATE_KEY, // Use environment variable

      // Platform/config
      PLATFORM_FEE_RECEIVER: process.env.PLATFORM_FEE_RECEIVER || '0x3618cf0af757f3f2b9824202e7f4a79f41d66297',
      DATABASE_PATH: '/opt/flipnosis/app/server/database.sqlite'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    merge_logs: true,
    // Kill timeout
    kill_timeout: 3000,
    // Listen timeout for reload
    listen_timeout: 10000,
    // Exponential backoff restart delay
    exp_backoff_restart_delay: 100
  }]
}
