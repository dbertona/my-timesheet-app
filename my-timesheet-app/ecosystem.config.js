module.exports = {
  apps: [
    {
      name: 'my-timesheet-app-dev',
      script: 'npm',
      args: 'run dev',
      cwd: '/Users/marcelodanielbertona/POWER-SOLUTION-PROJECTS/my-timesheet-app',
      env: {
        NODE_ENV: 'development',
        PORT: 5173
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 1000,
      log_file: './logs/dev.log',
      out_file: './logs/dev-out.log',
      error_file: './logs/dev-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
