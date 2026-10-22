import { createApp } from './app';
import { config } from './config';

const app = createApp();

app.listen(config.port, '0.0.0.0', () => {
  console.log(`[Mani-Annan API] Server running on http://0.0.0.0:${config.port} (PORT=${config.port}, NODE_ENV=${config.nodeEnv})`);
});
