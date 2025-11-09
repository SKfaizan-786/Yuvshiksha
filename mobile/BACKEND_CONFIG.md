# Backend Configuration Guide

## 🌐 VPS Backend Setup

Your backend is currently hosted on a VPS and serving the web application. The mobile app will connect to the same backend.

## 🔧 Configuration Steps

### 1. Update API Base URL

Edit `mobile/src/config/api.js`:

```javascript
const getBackendUrl = () => {
  // For development
  if (__DEV__) {
    // Option A: Use VPS URL directly (recommended for testing)
    return 'https://your-vps-domain.com'; // Replace with your VPS URL
    
    // Option B: Use local backend for development
    // return 'http://192.168.1.x:5000'; // Your computer's local IP
  }

  // For production - always use VPS
  return 'https://your-vps-domain.com'; // Replace with your VPS URL
};
```

### 2. Backend Requirements

Your backend **MUST** support:

1. **CORS Configuration** for mobile origin
2. **HttpOnly Cookies** (already configured ✅)
3. **credentials: 'include'** support (already configured ✅)

### 3. CORS Configuration on Backend

Ensure your backend (`server/src/index.ts` or similar) has:

```typescript
app.use(cors({
  origin: [
    'http://localhost:3000',           // Web dev
    'https://your-web-domain.com',     // Web production
    'http://localhost:8081',           // Expo dev
    'http://192.168.1.x:8081',        // Local network testing
    'exp://192.168.1.x:8081',         // Expo Go
  ],
  credentials: true,                   // CRITICAL for cookies
}));
```

### 4. Testing Connectivity

#### Test 1: Basic Connection
```bash
# From your mobile device's network
curl https://your-vps-domain.com/api/health

# Should return: { "status": "ok" }
```

#### Test 2: Authentication
```javascript
// In mobile app
const testAuth = async () => {
  try {
    const response = await axios.get(
      `${API_CONFIG.BASE_URL}/api/profile`,
      { withCredentials: true }
    );
    console.log('✅ Auth working:', response.data);
  } catch (error) {
    console.log('❌ Auth failed:', error.message);
  }
};
```

## 📱 Device-Specific Configuration

### Physical Device on Same WiFi
```javascript
// mobile/src/config/api.js
return 'https://your-vps-domain.com';
```

### Android Emulator
```javascript
// Android emulator can access host machine via 10.0.2.2
// But for VPS, always use the domain:
return 'https://your-vps-domain.com';
```

### iOS Simulator
```javascript
// iOS simulator can access localhost directly
// But for VPS, always use the domain:
return 'https://your-vps-domain.com';
```

### Expo Go App
```javascript
// Expo Go needs the VPS URL:
return 'https://your-vps-domain.com';
```

## 🔐 SSL/HTTPS Requirements

### Development
- If using HTTP locally, ensure both backend and mobile are on same network
- Consider using ngrok for HTTPS tunnel:
  ```bash
  ngrok http 5000
  # Use the https URL in mobile config
  ```

### Production
- **MUST** use HTTPS
- VPS should have valid SSL certificate (Let's Encrypt, etc.)
- Mobile apps require HTTPS for API calls

## 🚨 Common Issues & Solutions

### Issue 1: "Network Error"
**Cause**: Backend URL incorrect or backend not running
**Solution**:
1. Verify backend is running: `curl https://your-vps-domain.com/api/health`
2. Check URL in `mobile/src/config/api.js`
3. Ensure no typos in domain name

### Issue 2: "401 Unauthorized"
**Cause**: Cookies not being sent/received
**Solution**:
1. Verify `withCredentials: true` in API client ✅
2. Check CORS configuration on backend
3. Ensure `credentials: true` in CORS config

### Issue 3: "CORS Error"
**Cause**: Backend not allowing mobile origin
**Solution**:
1. Add Expo origins to CORS whitelist
2. Use `origin: true` temporarily to allow all (dev only)
3. Add specific mobile origins

### Issue 4: "Connection Refused"
**Cause**: Firewall blocking connections
**Solution**:
1. Check VPS firewall rules (allow ports 80, 443)
2. Check if backend is listening on 0.0.0.0, not 127.0.0.1
3. Verify DNS resolution

## 📊 Environment Variables

### Create `.env` file:
```env
# Backend Configuration
EXPO_PUBLIC_BACKEND_URL=https://your-vps-domain.com
EXPO_PUBLIC_BACKEND_WS_URL=wss://your-vps-domain.com
EXPO_PUBLIC_ENV=production

# Optional: For development
EXPO_PUBLIC_DEV_BACKEND_URL=http://192.168.1.x:5000
```

### Usage in code:
```javascript
import Constants from 'expo-constants';

const backendUrl = __DEV__ 
  ? Constants.expoConfig.extra.devBackendUrl 
  : Constants.expoConfig.extra.backendUrl;
```

## 🧪 Testing Checklist

- [ ] Backend is accessible from mobile device
- [ ] Authentication works (login/signup)
- [ ] Cookies are being sent/received
- [ ] API endpoints return expected data
- [ ] Socket.io connection works
- [ ] Image uploads work
- [ ] Payment gateway accessible

## 🔄 Backend Endpoints Used

### Authentication
- POST `/api/auth/login`
- POST `/api/auth/signup`
- POST `/api/auth/logout`
- POST `/api/auth/forgot-password`
- POST `/api/auth/reset-password`

### Profile
- GET `/api/profile`
- PUT `/api/profile`
- POST `/api/profile/upload-image`
- GET `/api/profile/favourites`
- POST `/api/profile/favourites/:teacherId`

### Teachers
- GET `/api/teachers/list`
- GET `/api/teachers/:teacherId`
- GET `/api/teachers/:teacherId/availability`

### Bookings
- GET `/api/bookings/student`
- GET `/api/bookings/teacher`
- POST `/api/bookings`
- PATCH `/api/bookings/:id/status`
- PATCH `/api/bookings/:id/reschedule`

### Messages
- GET `/api/messages/conversations`
- GET `/api/messages/:conversationId`
- POST `/api/messages/send`
- GET `/api/messages/unread-count`

### Notifications
- GET `/api/notifications`
- PUT `/api/notifications/:id/read`
- DELETE `/api/notifications/:id`

### Payments
- POST `/api/payments/create-order`
- POST `/api/payments/verify`
- GET `/api/payments/status/:orderId`

## 🎯 Quick Setup

1. **Get your VPS URL**
   - Example: `https://api.yuvshiksha.com` or `https://yuvshiksha.com`

2. **Update mobile config**
   ```bash
   cd mobile/src/config
   # Edit api.js and replace the URL
   ```

3. **Test connection**
   ```bash
   npm start
   # Open app and try logging in
   ```

4. **Verify in logs**
   ```
   ✅ API Request: GET /api/profile
   ✅ API Response: GET /api/profile Status: 200
   ```

## 📞 Support

If you encounter issues:
1. Check backend logs on VPS
2. Check mobile app console logs
3. Verify network connectivity
4. Test with curl/Postman first
5. Check CORS and cookie configuration

---

**Next Step**: Update `mobile/src/config/api.js` with your VPS URL and test!






