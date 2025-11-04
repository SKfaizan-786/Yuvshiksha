# React to React Native Migration Guide

This document outlines the conversion process from the React web app to React Native mobile app for Yuvshiksha.

## 📋 Migration Checklist

### ✅ Phase 1: Setup & Infrastructure (Completed)
- [x] Initialize Expo React Native project
- [x] Install core dependencies (React Navigation, AsyncStorage, Socket.io)
- [x] Set up project structure
- [x] Configure app.json with app metadata
- [x] Set up environment configuration

### ✅ Phase 2: Core Services & Contexts (Completed)
- [x] Create AsyncStorage utility (replaces localStorage)
- [x] Convert AuthContext with AsyncStorage
- [x] Convert SocketContext for React Native
- [x] Create NotificationContext with Expo Notifications
- [x] Set up API client with Axios
- [x] Create all API service modules

### ✅ Phase 3: Navigation (Completed)
- [x] Create AuthStack (Landing, Login, Signup, ForgotPassword, ResetPassword)
- [x] Create StudentStack with bottom tabs
- [x] Create TeacherStack with bottom tabs
- [x] Create RootNavigator with authentication routing
- [x] Implement navigation guards (replaces ProtectedRoute)

### ✅ Phase 4: Shared Components (Completed)
- [x] Create Header component (replaces Navbar)
- [x] Create Button component
- [x] Create Input component
- [x] Create Card component
- [x] Create LoadingScreen component
- [x] Create EmptyState component

### ✅ Phase 5: Authentication Pages (Completed)
- [x] Landing screen
- [x] Login screen with validation
- [x] Signup screen with role selection
- [x] Forgot password screen
- [x] Reset password screen

### 🔄 Phase 6: Student Pages (Partially Completed)
- [x] Student Dashboard (placeholder)
- [ ] Complete Student Dashboard with API integration
- [ ] Student Profile screen
- [ ] Student Profile Setup/Edit screen
- [ ] Teacher List screen with search and filters
- [ ] Book Class screen with calendar
- [ ] Messages screen with real-time chat

### 🔄 Phase 7: Teacher Pages (Partially Completed)
- [x] Teacher Dashboard (placeholder)
- [ ] Complete Teacher Dashboard with API integration
- [ ] Teacher Profile screen
- [ ] Teacher Profile Setup/Edit screen
- [ ] Teacher Schedule screen with calendar
- [ ] Bookings management screen
- [ ] Messages screen with real-time chat

### ⏳ Phase 8: Advanced Features (Pending)
- [ ] Payment integration (Cashfree SDK for React Native)
- [ ] Image upload with expo-image-picker
- [ ] Push notifications implementation
- [ ] Real-time messaging UI
- [ ] Calendar/date picker for scheduling
- [ ] Search and filter functionality
- [ ] Profile image upload and display

### ⏳ Phase 9: Polish & Testing (Pending)
- [ ] Error handling and user feedback
- [ ] Loading states and animations
- [ ] Offline support with AsyncStorage
- [ ] Deep linking configuration
- [ ] App icons and splash screen
- [ ] iOS testing
- [ ] Android testing
- [ ] Performance optimization

## 🔄 Key Differences: Web vs Mobile

### Storage
- **Web**: `localStorage`
- **Mobile**: `AsyncStorage` (async API)
  ```javascript
  // Web
  localStorage.setItem('key', 'value');
  const value = localStorage.getItem('key');
  
  // Mobile
  await AsyncStorage.setItem('key', 'value');
  const value = await AsyncStorage.getItem('key');
  ```

### Navigation
- **Web**: `react-router-dom` with `<Route>`, `<Link>`, `useNavigate()`
- **Mobile**: `@react-navigation/native` with navigators and `navigation` prop
  ```javascript
  // Web
  <Route path="/login" element={<Login />} />
  navigate('/dashboard');
  
  // Mobile
  <Stack.Screen name="Login" component={Login} />
  navigation.navigate('Dashboard');
  ```

### Styling
- **Web**: CSS, Tailwind CSS classes
- **Mobile**: StyleSheet API, inline styles
  ```javascript
  // Web
  <div className="bg-blue-500 p-4 rounded">
  
  // Mobile
  <View style={styles.container}>
  const styles = StyleSheet.create({
    container: {
      backgroundColor: '#3b82f6',
      padding: 16,
      borderRadius: 8,
    }
  });
  ```

### Components
- **Web**: HTML elements (`<div>`, `<button>`, `<input>`)
- **Mobile**: React Native components (`<View>`, `<TouchableOpacity>`, `<TextInput>`)

### HTTP Requests
- Both use Axios, but mobile needs to handle network status

### Real-time Communication
- Both use Socket.io, but mobile needs to handle app state (background/foreground)

### Images
- **Web**: `<img src="..." />`
- **Mobile**: `<Image source={require('...')} />` or `<Image source={{ uri: '...' }} />`

### Forms
- **Web**: Standard HTML forms
- **Mobile**: React Native TextInput with custom validation

## 🎨 Styling Migration

### Colors
All colors are defined in `src/constants/colors.js`. Use these instead of Tailwind classes:

```javascript
// Web
className="bg-primary text-white"

// Mobile
style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
```

### Layouts
- **Flexbox**: Works similarly but is default in React Native
- **Box Model**: Slightly different (no margin collapse)
- **Positioning**: `absolute`, `relative` work similarly
- **Units**: No `px`, `rem` - just numbers (automatic dp/pt)

## 📱 Mobile-Specific Features

### Push Notifications
```javascript
import * as Notifications from 'expo-notifications';

// Request permissions
const { status } = await Notifications.requestPermissionsAsync();

// Get push token
const token = await Notifications.getExpoPushTokenAsync();

// Show notification
await Notifications.scheduleNotificationAsync({
  content: {
    title: "New Message",
    body: "You have a new message from teacher",
  },
  trigger: null,
});
```

### Image Picker
```javascript
import * as ImagePicker from 'expo-image-picker';

const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8,
});

if (!result.canceled) {
  const imageUri = result.assets[0].uri;
  // Upload image
}
```

### App State
```javascript
import { AppState } from 'react-native';

AppState.addEventListener('change', (nextAppState) => {
  if (nextAppState === 'active') {
    // App came to foreground
  } else if (nextAppState === 'background') {
    // App went to background
  }
});
```

## 🔧 Configuration Files

### app.json
Contains app metadata, permissions, splash screen, icons, etc.

### .env
Environment variables (use `EXPO_PUBLIC_` prefix for client-side access)

### package.json
Dependencies and scripts

## 🚀 Development Workflow

1. **Start Development Server**
   ```bash
   npm start
   ```

2. **Test on Device/Emulator**
   - Use Expo Go app for quick testing
   - Use emulators for full feature testing

3. **Make Changes**
   - Hot reload works automatically
   - Shake device for developer menu

4. **Debug**
   - Use console.log (shows in terminal)
   - Use React Native Debugger
   - Use Expo DevTools

## 📝 TODO Comments

Throughout the codebase, you'll find `// TODO:` comments marking:
- Incomplete features
- API integrations needed
- UI improvements needed
- Performance optimizations

Search for `TODO` to find these items.

## 🐛 Known Issues

1. **Google Sign-In**: Not yet implemented (needs @react-native-google-signin/google-signin)
2. **Payment Gateway**: Cashfree SDK integration pending
3. **Real-time Messaging UI**: Socket.io connected but UI incomplete
4. **Calendar/Schedule**: Needs date picker library
5. **Image Upload**: expo-image-picker installed but not integrated

## 📚 Resources

- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)

## 🤝 Getting Help

If you encounter issues during migration:
1. Check this guide
2. Review React Native documentation
3. Check Expo documentation
4. Search for similar issues on GitHub
5. Ask the development team

---

**Next Steps**: Complete the student and teacher screens by referencing the original web components and adapting them to React Native.






