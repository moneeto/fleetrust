import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl = process.env.CAP_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'com.fleetrust.app',
  appName: 'Fleetrust',
  webDir: 'capacitor-www',
  server: serverUrl
    ? { url: serverUrl, cleartext: serverUrl.startsWith('http://'), androidScheme: 'https' }
    : undefined,
};

export default config;
