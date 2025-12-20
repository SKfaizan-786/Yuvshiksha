# Yuvsiksha Mobile App

## First Time Setup

### What You Need
1. **Expo Go App** - Download from Google Play Store on your Android phone
2. **Same WiFi** - Your phone and laptop must be on the same WiFi network

### Installation
```bash
cd mobile
npm install
npx expo start
```

### Running the App
1. Run `npx expo start` in terminal
2. Open **Expo Go** app on your phone
3. Scan the QR code that appears in terminal
4. Wait for app to load

## Troubleshooting

**App not loading?**
```bash
# Clear cache and restart
npx expo start --clear
```

**Bundling errors?**
```powershell
# Clean reinstall (Windows PowerShell)
Remove-Item -Recurse -Force node_modules
npm install
npx expo start --clear
```

**Can't scan QR?**
- Use Expo Go app (not camera)
- Check both devices on same WiFi
- Try typing the URL manually in Expo Go

## Project Info
- **Backend**: https://api.yuvsiksha.in
- **Framework**: React Native + Expo
- **Navigation**: React Navigation
- **Real-time**: Socket.io

## Development
Files are in `src/` folder. App auto-reloads when you save changes.
