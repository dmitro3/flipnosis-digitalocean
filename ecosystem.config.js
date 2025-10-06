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
      HTTPS_PORT: 3001
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
