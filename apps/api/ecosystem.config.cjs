// PM2 ecosystem for the Reparte API.
// Roda o TypeScript direto via Bun, sem build step — mesmo padrão do scraper.
// Uso no EC2:
//   pm2 start ecosystem.config.cjs
//   pm2 save
//   pm2 startup            # siga o comando impresso para auto-start no boot
module.exports = {
  apps: [
    {
      name: 'reparte-api',
      cwd: __dirname,
      script: 'src/index.ts',
      interpreter: `${process.env.HOME}/.bun/bin/bun`,
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '300M',
      autorestart: true,
      watch: false,
      time: true,
    },
  ],
}
