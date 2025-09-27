import { useState, useEffect } from 'react';
import axios from 'axios';
import API_CONFIG from '../config/api';
import { getFromLocalStorage } from '../utils/storage';

export const useMessageNotifications = () => {
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = async () => {
    try {
      const user = getFromLocalStorage('currentUser');
      if (!user) {
        setUnreadMessageCount(0);
        setLoading(false);
        return;
      }
      
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}/api/messages/unread-count`,
        {
          withCredentials: true // CRITICAL FIX: This is what sends the HttpOnly cookie
        }
      );

      setUnreadMessageCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching unread message count:', error.response?.status, error.response?.data);
      setUnreadMessageCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    unreadMessageCount,
    loading,
    refreshUnreadCount: fetchUnreadCount
  };
};