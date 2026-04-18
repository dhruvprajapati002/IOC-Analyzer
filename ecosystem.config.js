module.exports = {
  apps: [
    {
      name: 'ioc',
      script: 'server.js',
      cwd: '/home/ubuntu/ioc/ioc-analyzer',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 9000,
        HOSTNAME: process.env.HOSTNAME || '0.0.0.0',
        MONGO_URI: process.env.MONGO_URI,
        JWT_SECRET: process.env.JWT_SECRET,
        JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        VT_API_KEYS: process.env.VT_API_KEYS,
        VT_API_KEY: process.env.VT_API_KEY,
        INTERNAL_API_KEY: process.env.INTERNAL_API_KEY,
        VT_RATE_LIMIT_PER_MIN: process.env.VT_RATE_LIMIT_PER_MIN,
        ABUSEIPDB_API_KEY: process.env.ABUSEIPDB_API_KEY,
        HARD_DELETE: process.env.HARD_DELETE,
        AUDIT_TTL_DAYS: process.env.AUDIT_TTL_DAYS,
        IP_GEOLOCATION_API_URL: process.env.IP_GEOLOCATION_API_URL,
        IP_GEOLOCATION_PROVIDER: process.env.IP_GEOLOCATION_PROVIDER
      },
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      error_file: '/home/ubuntu/logs/ioc-error.log',
      out_file: '/home/ubuntu/logs/ioc-out.log',
      log_file: '/home/ubuntu/logs/ioc-combined.log',
      merge_logs: true,
      max_memory_restart: '2G',
      node_args: '--max-old-space-size=2048',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      autorestart: true,
      watch: false
    }
  ]
};
