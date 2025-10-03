import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.00b436bdfb814aee8075784a53f43ccd',
  appName: 'sanskrithi-payflow',
  webDir: 'dist',
  server: {
    url: 'https://00b436bd-fb81-4aee-8075-784a53f43ccd.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
