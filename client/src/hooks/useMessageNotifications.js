import { useState, useEffect } from 'react';
import axios from 'axios';
import API_CONFIG from '../config/api';

export const useMessageNotifications = () => {
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUnreadMessageCount(0);
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${API_CONFIG.BASE_URL}/api/messages/unread-count`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setUnreadMessageCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching unread message count:', error);
      setUnreadMessageCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    
    // Refresh count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { 
    unreadMessageCount, 
    loading, 
    refreshUnreadCount: fetchUnreadCount 
  };
};

