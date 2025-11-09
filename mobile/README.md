# Yuvshiksha Mobile App

React Native mobile application for Yuvshiksha - an education platform connecting students with teachers.

## 📱 About

This is the mobile version of Yuvshiksha, built with React Native using Expo. It provides a native mobile experience for both iOS and Android platforms.

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- For iOS development: macOS with Xcode
- For Android development: Android Studio

### Installation

1. **Clone the repository** (if not already done)

2. **Navigate to the mobile directory**
   ```bash
   cd mobile
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Update the environment variables with your backend URL and API keys

### Running the App

#### Development Mode

**Start the Expo development server:**
```bash
npm start
```

**Run on Android:**
```bash
npm run android
```

**Run on iOS (macOS only):**
```bash
npm run ios
```

**Run on Web:**
```bash
npm run web
```

#### Using Expo Go App

1. Install Expo Go on your physical device:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Run `npm start` and scan the QR code with:
   - **iOS**: Camera app
   - **Android**: Expo Go app

## 📂 Project Structure

```
mobile/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── Header.js
│   │   ├── Button.js
│   │   ├── Input.js
│   │   ├── Card.js
│   │   └── ...
│   ├── contexts/          # React Context providers
│   │   ├── AuthContext.js
│   │   ├── SocketContext.js
│   │   └── NotificationContext.js
│   ├── hooks/             # Custom React hooks
│   ├── navigation/        # Navigation configuration
│   │   ├── AuthStack.js
│   │   ├── StudentStack.js
│   │   ├── TeacherStack.js
│   │   └── RootNavigator.js
│   ├── pages/             # Screen components
│   │   ├── auth/          # Authentication screens
│   │   ├── student/       # Student screens
│   │   ├── teacher/       # Teacher screens
│   │   └── common/        # Shared screens
│   ├── services/          # API service layer
│   │   ├── api.js
│   │   ├── authAPI.js
│   │   ├── profileAPI.js
│   │   └── ...
│   ├── utils/             # Utility functions
│   │   ├── storage.js
│   │   ├── validation.js
│   │   └── formatters.js
│   ├── config/            # Configuration files
│   │   └── api.js
│   └── constants/         # Constants and theme
│       ├── colors.js
│       └── roles.js
├── assets/                # Images, fonts, etc.
├── App.js                 # Main app component
├── app.json              # Expo configuration
├── package.json          # Dependencies
└── README.md             # This file
```

## 🔧 Key Features

### Implemented
- ✅ Authentication (Login, Signup, Forgot Password)
- ✅ Role-based navigation (Student/Teacher)
- ✅ API integration with backend
- ✅ Socket.io real-time communication
- ✅ Push notifications setup
- ✅ Async storage for data persistence
- ✅ Navigation guards and protected routes
- ✅ Reusable UI components

### To Be Completed
- 🔄 Student Dashboard (complete implementation)
- 🔄 Teacher Dashboard (complete implementation)
- 🔄 Teacher listing and search
- 🔄 Class booking system
- 🔄 Real-time messaging
- 🔄 Payment integration (Cashfree SDK)
- 🔄 Profile management
- 🔄 Schedule management
- 🔄 Image upload functionality

## 🛠️ Technologies Used

- **React Native** - Mobile framework
- **Expo** - Development platform
- **React Navigation** - Navigation library
- **Axios** - HTTP client
- **Socket.io Client** - Real-time communication
- **AsyncStorage** - Local data storage
- **Expo Notifications** - Push notifications
- **Expo Image Picker** - Image selection

## 📝 Configuration

### Backend URL

Update the backend URL in `src/config/api.js`:

```javascript
// For development with physical device
const backendUrl = 'http://YOUR_LOCAL_IP:5000';

// For Android emulator
const backendUrl = 'http://10.0.2.2:5000';

// For production
const backendUrl = 'https://your-backend.com';
```

### Environment Variables

Create a `.env` file with the following variables:

```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:5000
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
EXPO_PUBLIC_CASHFREE_APP_ID=your-cashfree-app-id
```

## 🔐 Authentication

The app uses JWT-based authentication with the following flow:

1. User logs in/signs up
2. Backend returns user data (JWT in HttpOnly cookie)
3. User data stored in AsyncStorage
4. Protected routes check authentication status
5. API requests automatically include auth headers

## 📱 Building for Production

### Android APK

```bash
expo build:android
```

### iOS IPA

```bash
expo build:ios
```

### Using EAS Build (Recommended)

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Configure EAS:
   ```bash
   eas build:configure
   ```

3. Build for Android:
   ```bash
   eas build --platform android
   ```

4. Build for iOS:
   ```bash
   eas build --platform ios
   ```

## 🐛 Debugging

### Viewing Logs

- **Expo DevTools**: Press `d` in terminal after running `npm start`
- **React Native Debugger**: Use standalone debugger application
- **Console logs**: Check terminal output

### Common Issues

1. **Metro bundler cache issues**
   ```bash
   expo start -c
   ```

2. **Node modules issues**
   ```bash
   rm -rf node_modules
   npm install
   ```

3. **Android build issues**
   - Clean Android build: `cd android && ./gradlew clean`

## 📄 API Documentation

Refer to the backend API documentation for available endpoints and request/response formats.

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly on both iOS and Android
4. Submit a pull request

## 📞 Support

For issues and questions, please contact the development team or create an issue in the repository.

## 📜 License

This project is part of Yuvshiksha platform.

---

**Note**: This is a React Native conversion of the original React web application. Some features are still being migrated. Refer to the TODO comments in the code for pending implementations.






