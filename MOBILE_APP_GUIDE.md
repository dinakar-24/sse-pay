# Mobile App Development Guide for Sanskrithi PayFlow

This guide will help you convert your Sanskrithi PayFlow web app into a native mobile application for iOS and Android using Capacitor.

## ✅ What's Already Set Up

The following features are already configured and ready to use:

### 1. **Session Management Features**
- ✅ Auto-logout after 30 minutes of inactivity
- ✅ Warning notification 5 minutes before logout
- ✅ Session tracking in database
- ✅ Active sessions management page (`/sessions`)
- ✅ Device information tracking
- ✅ Session expiry management

### 2. **Mobile App Configuration**
- ✅ Capacitor dependencies installed
- ✅ Capacitor configuration file created
- ✅ Push notifications service created
- ✅ Hot-reload enabled for development

## 📱 Setting Up Mobile Development

### Step 1: Transfer to GitHub
1. Click the "Export to Github" button in Lovable
2. Clone your repository to your local machine:
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
   cd YOUR_REPO
   ```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Initialize Capacitor (Already Done!)
The Capacitor configuration is already set up in `capacitor.config.ts`.

### Step 4: Add Mobile Platforms

**For Android:**
```bash
npx cap add android
```

**For iOS (Mac Only):**
```bash
npx cap add ios
```

### Step 5: Build the Web App
```bash
npm run build
```

### Step 6: Sync Native Projects
```bash
npx cap sync
```

This command:
- Copies the built web app to native projects
- Updates native dependencies
- Syncs Capacitor plugins

### Step 7: Run on Device/Emulator

**For Android:**
```bash
npx cap run android
```

Requirements:
- Android Studio installed
- Android SDK configured
- Android device connected or emulator running

**For iOS (Mac Only):**
```bash
npx cap run ios
```

Requirements:
- Xcode installed (Mac only)
- iOS Simulator or physical device
- Apple Developer account for physical devices

## 🔔 Push Notifications Setup

### Firebase Cloud Messaging (FCM) for Android

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing
3. Add an Android app with package name: `app.lovable.00b436bdfb814aee8075784a53f43ccd`
4. Download `google-services.json`
5. Place it in `android/app/` directory

6. Update `android/app/build.gradle`:
```gradle
dependencies {
    // ... other dependencies
    implementation 'com.google.firebase:firebase-messaging:23.0.0'
}

apply plugin: 'com.google.gms.google-services'
```

7. Add to `android/build.gradle`:
```gradle
buildscript {
    dependencies {
        // ... other dependencies
        classpath 'com.google.gms:google-services:4.3.15'
    }
}
```

### Apple Push Notification Service (APNS) for iOS

1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Create an App ID with Push Notifications capability
3. Generate APNs Authentication Key
4. Configure in Xcode:
   - Open `ios/App/App.xcworkspace`
   - Select your project target
   - Go to "Signing & Capabilities"
   - Add "Push Notifications" capability

5. Update your server/backend to send push notifications using the APNs key

## 🔧 Development Workflow

### Making Changes

1. Make code changes in your editor
2. Test in web browser first
3. Build the project:
   ```bash
   npm run build
   ```

4. Sync changes to native projects:
   ```bash
   npx cap sync
   ```

5. Run on device/emulator to test

### Hot Reload During Development

The app is configured to load from the Lovable preview URL during development, enabling hot reload:
- Make changes in Lovable
- Refresh the app on your device
- Changes appear instantly!

**Note:** For production, update `capacitor.config.ts` and remove the `server` section.

## 📦 Building for Production

### Android APK/Bundle

1. Open in Android Studio:
   ```bash
   npx cap open android
   ```

2. Build > Generate Signed Bundle/APK
3. Follow the wizard to create a keystore and sign your app

### iOS App

1. Open in Xcode:
   ```bash
   npx cap open ios
   ```

2. Select your development team
3. Archive the app: Product > Archive
4. Distribute to App Store or TestFlight

## 🎯 Session Management Features

### For Students
- Access "Manage Sessions" from the dashboard
- View all active login sessions
- See device information and last activity
- Terminate sessions from other devices
- Auto-logout after 30 minutes of inactivity

### For Administrators
- Same session management features
- Additional admin role-based access
- Session tracking for audit purposes

### Session Security
- Sessions expire after 7 days automatically
- Inactive sessions (30 days) are cleaned up
- Session data stored securely in Supabase
- Each session tracks device info and IP address

## 🔐 Security Best Practices

1. **Never commit sensitive keys** to version control
   - Add to `.gitignore`:
     ```
     google-services.json
     GoogleService-Info.plist
     ios/App/App/config.json
     ```

2. **Use environment variables** for API keys in production

3. **Enable RLS policies** in Supabase for all tables

4. **Test session management** thoroughly:
   - Try logging in from multiple devices
   - Test auto-logout functionality
   - Verify session termination works

## 📚 Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Push Notifications Guide](https://capacitorjs.com/docs/guides/push-notifications-firebase)
- [iOS Development Guide](https://capacitorjs.com/docs/ios)
- [Android Development Guide](https://capacitorjs.com/docs/android)
- [Lovable Mobile Development Blog](https://lovable.dev/blogs/TODO)

## 🆘 Troubleshooting

### Common Issues

**Build Fails:**
- Clear node_modules: `rm -rf node_modules && npm install`
- Clean build: `npm run build`
- Resync: `npx cap sync`

**Push Notifications Not Working:**
- Check Firebase/APNS configuration
- Verify permissions are granted
- Check device logs in Android Studio/Xcode

**Hot Reload Not Working:**
- Ensure device and computer are on same network
- Check the URL in `capacitor.config.ts`
- Verify CORS settings if needed

**Session Management Issues:**
- Check Supabase RLS policies
- Verify user authentication is working
- Check browser/device console for errors

## 📞 Need Help?

If you encounter any issues:
1. Check the [Troubleshooting Guide](https://docs.lovable.dev/tips-tricks/troubleshooting)
2. Join the [Lovable Discord Community](https://discord.com/channels/1119885301872070706/1280461670979993613)
3. Review [Capacitor Documentation](https://capacitorjs.com/docs)

---

**Happy Mobile Development! 🚀**
