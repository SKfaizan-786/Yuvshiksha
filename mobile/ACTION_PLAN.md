# 🎯 Action Plan - Your Next Steps

## ⚡ Immediate Action Required (10 Minutes)

### Step 1: Configure Backend URL
**File**: `mobile/src/config/api.js`
**Lines**: 21 and 31
**Action**: Replace `'https://your-vps-domain.com'` with your actual VPS URL

Example:
```javascript
// Line 21 (Development)
return 'https://api.yuvshiksha.com'; // Your actual URL

// Line 31 (Production)
return 'https://api.yuvshiksha.com'; // Your actual URL
```

### Step 2: Test Basic Connectivity
```bash
cd mobile
npm start
# Scan QR code with Expo Go
# Try logging in with existing account
```

Expected console output:
```
✅ API Request: POST /api/auth/login
✅ API Response: POST /api/auth/login Status: 200
✅ Connected to server with socket ID: xyz123
```

---

## 📋 Development Roadmap (Priority Order)

### Week 1: Critical Student Features

#### Day 1-2: Student Dashboard
**File**: `mobile/src/pages/student/StudentDashboardScreen.js`
**What to do**:
1. Import API services
2. Create `fetchDashboardData` function
3. Call `/api/student/dashboard` endpoint
4. Display stats (total, completed, upcoming classes)
5. Show upcoming classes list
6. Add pull-to-refresh

**Key APIs**:
- `GET /api/student/dashboard`
- Returns: `{ stats: {...}, upcomingClasses: [...], recentBookings: [...] }`

#### Day 3-4: Teacher List
**File**: `mobile/src/pages/student/TeacherListScreen.js`
**What to do**:
1. Fetch teachers: `GET /api/teachers/list`
2. Create teacher card component
3. Add search bar (filter by name)
4. Add filter modal (subject, board, price, experience)
5. Add favorites toggle
6. Implement sorting (rating, price)
7. Navigate to teacher details on tap

**Key APIs**:
- `GET /api/teachers/list?search=&subject=&board=&minPrice=&maxPrice=`
- `GET /api/profile/favourites`
- `POST /api/profile/favourites/:teacherId`

#### Day 5-6: Booking System
**File**: `mobile/src/pages/student/BookClassScreen.js`
**What to do**:
1. Install calendar: `npm install react-native-calendars`
2. Fetch teacher availability
3. Display calendar
4. Show available time slots
5. Booking form (date, time, duration, message)
6. Create booking API call
7. Navigate to payment

**Key APIs**:
- `GET /api/teachers/:teacherId/availability?date=`
- `POST /api/bookings`

### Week 2: Teacher Features & Messaging

#### Day 7-8: Teacher Dashboard
**File**: `mobile/src/pages/teacher/TeacherDashboardScreen.js`
**What to do**:
1. Fetch dashboard data: `GET /api/teacher/dashboard`
2. Display stats (earnings, classes, rating)
3. Show upcoming classes
4. Show pending bookings (accept/reject buttons)
5. Add quick actions

#### Day 9-10: Messaging System
**Files**: 
- `mobile/src/pages/student/MessagesScreen.js`
- `mobile/src/pages/teacher/MessagesScreen.js`

**What to do**:
1. Create conversation list
2. Create chat UI component
3. Fetch conversations: `GET /api/messages/conversations`
4. Fetch messages: `GET /api/messages/:conversationId`
5. Send message: `POST /api/messages/send`
6. Socket.io real-time updates
7. Add typing indicator
8. Mark messages as read

**Socket Events**:
```javascript
socket.on('new_message', (message) => {
  // Add to messages list
});

socket.emit('typing', { conversationId, isTyping: true });
```

### Week 3: Profile & Bookings

#### Day 11-12: Profile Management
**Files**:
- `mobile/src/pages/student/StudentProfileScreen.js`
- `mobile/src/pages/teacher/TeacherProfileScreen.js`

**What to do**:
1. Fetch profile: `GET /api/profile`
2. Display profile data
3. Edit profile form
4. Image picker integration
5. Upload image: `POST /api/profile/upload-image`
6. Update profile: `PUT /api/profile`

**Image Picker Code**:
```javascript
import * as ImagePicker from 'expo-image-picker';

const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });
  
  if (!result.canceled) {
    await uploadImage(result.assets[0].uri);
  }
};
```

#### Day 13-14: Bookings Management
**File**: `mobile/src/pages/teacher/BookingsScreen.js`
**What to do**:
1. Fetch bookings: `GET /api/bookings/teacher`
2. Display with filters (pending, approved, completed)
3. Accept booking: `PATCH /api/bookings/:id/status {status: 'approved'}`
4. Reject booking: `PATCH /api/bookings/:id/status {status: 'rejected'}`
5. Reschedule: `PATCH /api/bookings/:id/reschedule`
6. Booking details modal

### Week 4: Polish & Advanced Features

#### Day 15-16: Notifications
**File**: `mobile/src/pages/common/NotificationsScreen.js`
**What to do**:
1. Fetch notifications: `GET /api/notifications`
2. Display list with icons
3. Mark as read: `PUT /api/notifications/:id/read`
4. Delete: `DELETE /api/notifications/:id`
5. Click to navigate to relevant screen
6. Badge count on tab

#### Day 17-18: Advanced Features
- Favorites system
- Schedule management (teacher)
- Advanced filters
- Search functionality
- Sort options

#### Day 19-20: Payment Integration
See `PAYMENT_INTEGRATION.md` for detailed steps

#### Day 21-22: Testing & Polish
- Error handling
- Loading states
- Success messages
- Animations
- Performance optimization

---

## 🛠️ Development Tips

### Use These Patterns

#### API Call Pattern
```javascript
const fetchData = async () => {
  try {
    setLoading(true);
    const response = await apiService.getData();
    if (response.success) {
      setData(response.data);
    }
  } catch (error) {
    Alert.alert('Error', error.message);
  } finally {
    setLoading(false);
  }
};
```

#### Socket.io Pattern
```javascript
useEffect(() => {
  if (socket && isConnected) {
    socket.on('event', handleEvent);
    return () => socket.off('event');
  }
}, [socket, isConnected]);
```

#### Navigation Pattern
```javascript
// Navigate to screen
navigation.navigate('ScreenName', { param: value });

// Go back
navigation.goBack();

// Replace screen
navigation.replace('ScreenName');
```

### Debugging Tips

1. **Console Logs**: Show in terminal
   ```javascript
   console.log('📱 Data:', data);
   ```

2. **Network Inspection**: Use Expo DevTools
   ```bash
   # Press 'd' in terminal
   ```

3. **React DevTools**: Use standalone app

4. **API Testing**: Test with curl first
   ```bash
   curl https://your-vps-url.com/api/endpoint
   ```

---

## 📊 Progress Tracking

Create a checklist as you implement:

**Week 1:**
- [ ] Backend URL configured
- [ ] Login tested
- [ ] Student Dashboard implemented
- [ ] Teacher List implemented
- [ ] Booking System implemented

**Week 2:**
- [ ] Teacher Dashboard implemented
- [ ] Messaging implemented
- [ ] Real-time updates working

**Week 3:**
- [ ] Profile management implemented
- [ ] Bookings management implemented
- [ ] Image upload working

**Week 4:**
- [ ] Notifications implemented
- [ ] Payment integration complete
- [ ] All features tested
- [ ] Ready for deployment

---

## 🚨 Common Issues & Solutions

### Issue: API calls failing
**Check**:
1. Backend URL correct?
2. Backend running?
3. CORS configured?
4. `withCredentials: true` set?

### Issue: Navigation not working
**Check**:
1. Screen registered in navigator?
2. Correct screen name?
3. Navigator hierarchy correct?

### Issue: Socket not connecting
**Check**:
1. Backend socket.io running?
2. Correct URL (ws:// or wss://)?
3. User ID passed correctly?
4. CORS for socket.io?

### Issue: Images not loading
**Check**:
1. Correct path?
2. Use `require()` or `uri`?
3. File exists?
4. Permissions granted?

---

## 📞 Getting Help

1. **Check Documentation**: All guides in `mobile/` directory
2. **Check Console**: Error messages are helpful
3. **Check Backend Logs**: On your VPS
4. **Google the Error**: Usually someone else had it
5. **Expo Documentation**: https://docs.expo.dev/
6. **React Native Docs**: https://reactnative.dev/

---

## 🎯 Success Criteria

You'll know you're done when:
- ✅ All screens have real data
- ✅ Can book a class end-to-end
- ✅ Can send/receive messages
- ✅ Can complete payment
- ✅ Push notifications working
- ✅ App works offline (basic features)
- ✅ No crashes
- ✅ Fast performance
- ✅ iOS build successful
- ✅ Android build successful

---

## 🚀 Ready to Start?

1. ✅ Configure backend URL (10 minutes)
2. 🚀 Start with Student Dashboard
3. 📋 Follow this action plan
4. 💪 Build amazing features!

**Current Status**: Ready for Implementation
**Time to Complete**: 3-4 weeks
**Let's Build Something Great!** 🎉






