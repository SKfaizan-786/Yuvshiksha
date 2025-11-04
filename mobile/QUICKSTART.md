# 🚀 Quick Start Guide

Get the Yuvshiksha mobile app running in 5 minutes!

## Prerequisites Check

- ✅ Node.js installed (v16+)
- ✅ npm installed
- ✅ Smartphone with Expo Go app OR Android/iOS emulator

## Step 1: Install Dependencies (2 minutes)

```bash
cd mobile
npm install
```

## Step 2: Configure Backend URL (30 seconds)

Open `src/config/api.js` and update the backend URL:

```javascript
// For testing on physical device
const getBackendUrl = () => {
  if (__DEV__) {
    return 'http://YOUR_COMPUTER_IP:5000'; // e.g., 'http://192.168.1.5:5000'
  }
  return 'https://your-production-backend.com';
};
```

**Finding your IP:**
- **Windows**: `ipconfig` (look for IPv4 Address)
- **Mac/Linux**: `ifconfig` (look for inet)

## Step 3: Start Development Server (10 seconds)

```bash
npm start
```

## Step 4: Run on Device (1 minute)

### Option A: Physical Device (Recommended)

1. Install **Expo Go** app:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Android Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Scan QR code:
   - **iOS**: Use Camera app
   - **Android**: Use Expo Go app

### Option B: Android Emulator

```bash
npm run android
```

### Option C: iOS Simulator (Mac only)

```bash
npm run ios
```

## Step 5: Test the App

1. **See the Landing Screen** ✅
2. **Try Signup**: Create a student account
3. **Try Login**: Use your credentials
4. **Explore Dashboard**: View the student dashboard

## 🎯 What You Can Do Now

### Working Features:
- ✅ Landing page
- ✅ User registration (Student/Teacher)
- ✅ Login with email/password
- ✅ Password reset flow
- ✅ Navigation between screens
- ✅ Tab navigation for dashboards

### Placeholder Screens (Need Implementation):
- 🔄 Student Dashboard (displays sample data)
- 🔄 Teacher List
- 🔄 Booking System
- 🔄 Real-time Messaging
- 🔄 Profile Management

## 📝 Quick Test Account

Create a test account:
```
Email: test@student.com
Password: test12345
Role: Student
```

Or if your backend has seed data, use those credentials.

## 🔧 Common Issues & Solutions

### Issue: "Cannot connect to backend"

**Solution**: Check if:
1. Backend server is running (`http://localhost:5000`)
2. You're using correct IP address
3. Firewall isn't blocking connections
4. You're on the same WiFi network (for physical devices)

### Issue: "Metro bundler error"

**Solution**:
```bash
# Clear cache and restart
npm start -- --reset-cache
```

### Issue: "Module not found"

**Solution**:
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### Issue: Android emulator not connecting

**Solution**: Use `10.0.2.2` instead of `localhost`:
```javascript
return 'http://10.0.2.2:5000';
```

## 📱 Development Tips

1. **Hot Reload**: Save files to see changes instantly
2. **Developer Menu**: Shake device or press `d` in terminal
3. **Console Logs**: Check terminal for `console.log()` output
4. **Reload App**: Press `r` in terminal or shake device → Reload

## 🎨 Customize the App

### Change Colors

Edit `src/constants/colors.js`:

```javascript
export const COLORS = {
  primary: '#6366f1', // Change this!
  // ... more colors
};
```

### Add a New Screen

1. Create file: `src/pages/YourScreen.js`
2. Add to navigator: `src/navigation/StudentStack.js` or `TeacherStack.js`
3. Navigate: `navigation.navigate('YourScreen')`

## 📚 Next Steps

1. ✅ App is running!
2. 📖 Read `README.md` for full documentation
3. 🗺️ Read `MIGRATION_GUIDE.md` for web-to-mobile conversion details
4. 📋 Read `PROJECT_SUMMARY.md` for what's completed and what's pending
5. 💰 Read `PAYMENT_INTEGRATION.md` for payment setup
6. 🛠️ Start implementing pending features!

## 🎓 Learning Resources

- [React Native Basics](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/docs/getting-started)

## 🆘 Need Help?

1. Check error messages in terminal
2. Review documentation files
3. Google the error (usually someone else had it!)
4. Check Expo and React Native docs
5. Ask the development team

## 🎉 You're Ready!

The app is now running. Start exploring the code and implementing features!

**Current Status**: ✅ Foundation Complete, Ready for Feature Development

**Your First Task**: Complete the Student Dashboard by:
1. Opening `src/pages/student/StudentDashboardScreen.js`
2. Replacing placeholder data with API calls
3. Displaying real booking data

Good luck and happy coding! 🚀

---

**Pro Tip**: Keep this guide handy for quick reference when setting up on a new machine or helping teammates get started.






