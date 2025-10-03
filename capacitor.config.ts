import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.00b436bdfb814aee8075784a53f43ccd',
  appName: 'sanskrithi-payflow',
  webDir: 'dist',
  server: {
    url: 'https://sse-pay.vercel.app',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
