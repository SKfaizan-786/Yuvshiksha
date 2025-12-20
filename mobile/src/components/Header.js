import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import COLORS from '../constants/colors';

/**
 * Header Component
 * Replaces the web Navbar with a mobile-friendly header
 */
const Header = ({
  title,
  showBack = false,
  showNotification = false,
  showMenu = false,
  onBackPress,
  onNotificationPress,
  onMenuPress,
  rightComponent,
  backgroundColor = COLORS.primary,
  textColor = COLORS.white,
}) => {
  const navigation = useNavigation();
  // Safe optional chain in case context is not provided (e.g. usage outside provider in tests)
  const { totalUnreadCount } = useNotificationsSafe();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      navigation.navigate('Notifications');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={[styles.container, { backgroundColor }]}>
        {/* Left side - Back button or Menu */}
        <View style={styles.leftContainer}>
          {showBack && (
            <TouchableOpacity onPress={handleBackPress} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={24} color={textColor} />
            </TouchableOpacity>
          )}
          {showMenu && (
            <TouchableOpacity onPress={onMenuPress} style={styles.iconButton}>
              <Ionicons name="menu" size={24} color={textColor} />
            </TouchableOpacity>
          )}
        </View>

        {/* Center - Title */}
        <View style={styles.centerContainer}>
          <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
            {title}
          </Text>
        </View>

        {/* Right side - Notification or custom component */}
        <View style={styles.rightContainer}>
          {rightComponent ? (
            rightComponent
          ) : showNotification ? (
            <TouchableOpacity onPress={handleNotificationPress} style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={24} color={textColor} />
              {totalUnreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <View style={[styles.iconButton, { backgroundColor: 'transparent' }]} />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

// Helper hook to avoid crash if Context is missing
import { useNotifications } from '../contexts/NotificationContext';
const useNotificationsSafe = () => {
  try {
    return useNotifications();
  } catch (e) {
    return { totalUnreadCount: 0 };
  }
};
const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: COLORS.primary,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.primary,
    borderBottomWidth: 0,
    elevation: 0, // Flat look
    shadowOpacity: 0, // Remove shadow
  },
  leftContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerContainer: {
    flex: 4,
    alignItems: 'center',
  },
  rightContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  iconButton: {
    padding: 10,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.15)', // Light glass effect
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default Header;






