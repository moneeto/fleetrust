import { createApp } from './app.js';
import { config } from './config.js';

const app = createApp();

app.listen(config.port, () => {
  console.log(`[fleetrust-backoffice/api] escuchando en http://localhost:${config.port}`);
});
