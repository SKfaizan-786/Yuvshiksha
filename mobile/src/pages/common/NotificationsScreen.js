import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatDistanceToNow } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import COLORS from '../../constants/colors';
import { useNotifications } from '../../contexts/NotificationContext';

const NotificationsScreen = () => {
  const {
    notifications,
    loading,
    refreshNotifications,
    markAsRead,
    updateFilter
  } = useNotifications();

  const [activeTab, setActiveTab] = React.useState('recent');

  const tabs = [
    { id: 'recent', label: 'Recent', params: { limit: 5 } },
    { id: 'all', label: 'All', params: {} },
    { id: 'unread', label: 'Unread', params: { unreadOnly: true } },
  ];

  useEffect(() => {
    refreshNotifications();
  }, []);

  const handleTabPress = (tab) => {
    setActiveTab(tab.id);
    updateFilter(tab.params);
  };

  const handleNotificationPress = (item) => {
    if (!item.isRead) {
      markAsRead(item._id);
    }
    // Navigate if deep link exists or just toggle expand
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.isRead && styles.unreadItem
      ]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <View style={[
          styles.iconCircle,
          { backgroundColor: !item.isRead ? COLORS.primaryLight : COLORS.gray[100] }
        ]}>
          <Ionicons
            name={item.type === 'booking' ? 'calendar' : 'notifications'}
            size={24}
            color={!item.isRead ? COLORS.primary : COLORS.gray[500]}
          />
        </View>
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, !item.isRead && styles.unreadText]}>
          {typeof item.title === 'object' ? (item.title.text || item.title.title || 'Notification') : item.title}
        </Text>
        <Text style={styles.message} numberOfLines={2}>
          {typeof (item.message || item.body) === 'object'
            ? ((item.message || item.body).text || (item.message || item.body).content || 'New notification')
            : (item.message || item.body)}
        </Text>
        <Text style={styles.time}>
          {item.createdAt ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }) : 'Just now'}
        </Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <Header title="Notifications" showBack />

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && styles.activeTab
            ]}
            onPress={() => handleTabPress(tab)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab.id && styles.activeTabText
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item._id || item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => refreshNotifications()} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color={COLORS.gray[300]} />
            <Text style={styles.emptyText}>No {activeTab === 'unread' ? 'unread' : ''} notifications</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 0,
    gap: 12,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.white,
  },
  listContent: {
    flexGrow: 1,
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  unreadItem: {
    borderLeftColor: COLORS.primary,
    backgroundColor: '#f5f7ff',
  },
  iconContainer: {
    marginRight: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 4,
    fontWeight: '600',
  },
  unreadText: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  message: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 6,
    lineHeight: 20,
  },
  time: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});

export default NotificationsScreen;






