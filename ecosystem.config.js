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
      CONTRACT_ADDRESS: '0x1d0C6aA57c2c4c7764B9FFdd13DFB6319db02A64',
      RPC_URL: 'https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3',
      CONTRACT_OWNER_KEY: process.env.CONTRACT_OWNER_KEY, // Use environment variable instead

      // Platform/config
      PLATFORM_FEE_RECEIVER: process.env.PLATFORM_FEE_RECEIVER || '0x6BA07382CF43E41aBfC80dC43FFc96730194A3c1',
      DATABASE_PATH: './server/flipz.db'
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
