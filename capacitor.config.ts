import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fantasticdice.app',
  appName: 'Fantastic Dice 3D',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  }
};

export default config;
