import { buildApp } from '@/app';

const PORT = Number(process.env.PORT || 3333);

async function run() {
  const app = buildApp();
  await app.ready();

  await app
    .listen({
      port: PORT,
      host: process.env.HOST || '0.0.0.0',
    })
    .then(() => {
      console.log(`HTTP Server is running on http://localhost:${PORT}`);
      console.log(`Docs available at http://localhost:${PORT}/docs`);
    });
}

if (process.env.NODE_ENV !== 'test') {
  run();
}
