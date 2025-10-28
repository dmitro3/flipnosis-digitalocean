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
      CONTRACT_ADDRESS: '0xd76B12D50192492ebB56bD226127eE799658fF0a',
      RPC_URL: 'https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3',
      CONTRACT_OWNER_KEY: '1d3eb837118de4273c1b93e6f77c50b83e0f83f224188402b32e9ac306535790',

      // Platform/config
      PLATFORM_FEE_RECEIVER: '0xDd6377919ef1Ad4baBBEAd667eFE3F6607558628',
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
