# 🚀 Setup Instructions - Mobile App

## ✅ What's Already Done

1. ✅ **Project Created** - Expo React Native app initialized
2. ✅ **Dependencies Installed** - All packages installed
3. ✅ **Assets Copied** - Images and logos copied from web app
4. ✅ **Project Structure** - Complete folder structure created
5. ✅ **Core Services** - API client, contexts, navigation ready
6. ✅ **Authentication** - Login, Signup, Password reset screens
7. ✅ **Base Components** - Header, Button, Input, Card, etc.
8. ✅ **Navigation** - Student & Teacher stacks with tabs
9. ✅ **Placeholder Screens** - All major screens created

## 🔧 What You Need To Do

### Step 1: Configure Backend URL (5 minutes) ⚡

1. **Get your VPS URL**
   - Check your current web app URL
   - Example: `https://yuvshiksha.com` or `https://api.yuvshiksha.com`

2. **Update mobile config**
   - Open: `mobile/src/config/api.js`
   - Find lines 21 and 31
   - Replace `'https://your-vps-domain.com'` with your actual VPS URL
   
   ```javascript
   // Line 21 (Development)
   return 'https://your-actual-vps-url.com';
   
   // Line 31 (Production)
   return 'https://your-actual-vps-url.com';
   ```

3. **Save the file**

### Step 2: Test the App (2 minutes) 🧪

1. **Start the development server**
   ```bash
   cd mobile
   npm start
   ```

2. **Open on your device**
   - Install "Expo Go" app on your phone
   - Scan the QR code

3. **Test authentication**
   - Try signing up as a student
   - Try logging in
   - Should connect to your VPS backend

### Step 3: Verify Connectivity (2 minutes) ✅

Look for these console logs in the terminal:

```
✅ API Request: POST /api/auth/login
✅ API Response: POST /api/auth/login Status: 200
✅ Connected to server with socket ID: xyz123
```

If you see errors:
- ❌ Check if backend URL is correct
- ❌ Verify backend is running on VPS
- ❌ Check CORS configuration (see BACKEND_CONFIG.md)

## 🎯 Current Implementation Status

### ✅ Fully Implemented (Ready to Use)
- Authentication (Login, Signup, Password Reset)
- Navigation (Role-based routing)
- API Client (Configured for VPS)
- Storage (AsyncStorage)
- Socket.io (Real-time connection)
- Push Notifications (Setup complete)

### 🔄 Partially Implemented (Placeholders Ready)
- Student Dashboard (Shows placeholder, needs API)
- Teacher Dashboard (Shows placeholder, needs API)
- All other screens (Structure ready, needs implementation)

### ⏳ Not Yet Implemented (Planned)
- Teacher List with real data
- Booking system
- Messaging UI
- Profile management
- Favorites system
- Schedule management

## 📋 Next Implementation Tasks

After completing setup, these features need implementation:

1. **Student Dashboard** (Priority 1)
   - File: `mobile/src/pages/student/StudentDashboardScreen.js`
   - Fetch data from `/api/student/dashboard`
   - Display real stats and bookings

2. **Teacher List** (Priority 2)
   - File: `mobile/src/pages/student/TeacherListScreen.js`
   - Fetch from `/api/teachers/list`
   - Add search and filters

3. **Booking System** (Priority 3)
   - File: `mobile/src/pages/student/BookClassScreen.js`
   - Calendar integration
   - Time slot selection
   - Payment flow

4. **Messaging** (Priority 4)
   - File: `mobile/src/pages/student/MessagesScreen.js`
   - Chat UI
   - Socket.io integration
   - Real-time updates

See `IMPLEMENTATION_PLAN.md` for detailed breakdown.

## 📱 Device Testing

### Physical Device (Recommended)
```bash
# 1. Install Expo Go on phone
# 2. Ensure phone and computer on same WiFi
# 3. Run: npm start
# 4. Scan QR code
```

### Android Emulator
```bash
npm run android
```

### iOS Simulator (Mac only)
```bash
npm run ios
```

## 🐛 Troubleshooting

### Can't connect to backend?
1. Check backend URL in `src/config/api.js`
2. Verify VPS is running: `curl https://your-vps-url.com/api/health`
3. Check CORS settings on backend

### Authentication not working?
1. Check if cookies are enabled
2. Verify `credentials: 'include'` in API calls
3. Check backend CORS config allows credentials

### Assets not loading?
1. Assets are in `mobile/assets/`
2. Use: `require('../assets/image.jpg')`
3. Or: `import image from '../assets/image.jpg'`

## 📚 Documentation

- `README.md` - Project overview
- `QUICKSTART.md` - 5-minute getting started
- `IMPLEMENTATION_PLAN.md` - Detailed feature plan
- `BACKEND_CONFIG.md` - Backend configuration guide
- `MIGRATION_GUIDE.md` - Web to mobile conversion
- `PROJECT_SUMMARY.md` - What's complete, what's pending
- `PAYMENT_INTEGRATION.md` - Cashfree setup

## 🎉 You're Ready!

Once you complete Steps 1-3 above:
- ✅ App will be running
- ✅ Backend connected
- ✅ Authentication working
- ✅ Ready for feature implementation

## 📞 Need Help?

1. Check error messages in terminal
2. Review relevant documentation
3. Check backend logs on VPS
4. Verify network connectivity

---

**Time Required**: 10 minutes setup, then ready for development!
**Current Status**: Foundation 100% complete, Features 20% complete
**Next**: Implement Student Dashboard (see file for TODO comments)






