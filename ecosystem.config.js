/**
 * PM2 Ecosystem Configuration
 * Usa: pm2 start ecosystem.config.js
 */

module.exports = {
    apps: [
        {
            name: 'dulce-ruth-bot',
            script: 'src/app.js',
            instances: 1,
            autorestart: true,
            max_memory_restart: '300M',
            env: {
                NODE_ENV: 'development',
            },
            env_production: {
                NODE_ENV: 'production',
            },
            error_file: './logs/error.log',
            out_file: './logs/output.log',
        },
    ],
};
