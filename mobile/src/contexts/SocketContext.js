import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AppState } from 'react-native';
import API_CONFIG from '../config/api';

const SocketContext = createContext({
  socket: null,
  isConnected: false,
  onlineUsers: new Set(),
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children, userId }) => {
  console.log('🔍 SocketProvider - Component rendered with userId:', userId);
  
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  // Debug userId changes
  useEffect(() => {
    console.log('🔍 SocketProvider - userId changed to:', userId, 'Type:', typeof userId);
  }, [userId]);

  // Handle app state changes (foreground/background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && socket && !socket.connected && userId) {
        console.log('📱 App became active, reconnecting socket...');
        socket.connect();
      } else if (nextAppState === 'background' && socket && socket.connected) {
        console.log('📱 App went to background, keeping socket alive...');
        // Keep socket alive in background for notifications
        // Optionally disconnect here if you want to save battery
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [socket, userId]);

  useEffect(() => {
    console.log('🔍 SocketProvider - useEffect triggered with userId:', userId);
    
    // Only connect if we have a userId (user is logged in)
    if (userId) {
      console.log('🔌 Initializing socket connection for user:', userId);
      
      const socketUrl = API_CONFIG.BASE_URL;
      console.log('🌐 Selected socket URL:', socketUrl);
      
      const newSocket = io(socketUrl, {
        withCredentials: true,
        transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
        timeout: 10000, // 10 second timeout
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        forceNew: true, // Force a new connection
      });

      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('✅ Connected to server with socket ID:', newSocket.id);
        setIsConnected(true);
        // Authenticate the user with the server
        newSocket.emit('authenticate', userId);
        console.log('🔐 Sent authentication for user:', userId);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ Disconnected from server. Reason:', reason);
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('🚨 Connection error:', error.message);
        console.error('🚨 Error details:', error);
        setIsConnected(false);
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('🔄 Reconnected after', attemptNumber, 'attempts');
        setIsConnected(true);
      });

      newSocket.on('reconnect_attempt', (attemptNumber) => {
        console.log('🔄 Reconnection attempt', attemptNumber);
      });

      newSocket.on('reconnect_error', (error) => {
        console.error('🚨 Reconnection error:', error);
      });

      // Handle online users updates
      newSocket.on('online_users', (users) => {
        setOnlineUsers(new Set(users));
      });

      // Handle test pong response
      newSocket.on('test_pong', (data) => {
        console.log('🏓 Received test pong from server:', data);
      });

      // Test connection by sending a ping
      setTimeout(() => {
        console.log('🔍 Socket connection test after 2 seconds:', {
          connected: newSocket.connected,
          id: newSocket.id,
          transport: newSocket.io?.engine?.transport?.name,
          readyState: newSocket.io?.engine?.readyState,
        });
        
        if (newSocket.connected) {
          console.log('✅ Socket connection test: Connected');
          newSocket.emit('test_ping', { message: 'Hello from React Native', userId });
        } else {
          console.error('❌ Socket connection test: Failed to connect');
          console.error('❌ Socket connection details:', {
            url: socketUrl,
            options: {
              withCredentials: true,
              transports: ['websocket', 'polling'],
              timeout: 10000,
              reconnection: true,
              reconnectionAttempts: 5,
              reconnectionDelay: 1000,
              forceNew: true,
            },
          });
        }
      }, 2000);

      return () => {
        console.log('🔌 Cleaning up socket connection');
        newSocket.disconnect();
      };
    } else {
      // Disconnect if no userId
      if (socket) {
        console.log('🔌 Disconnecting socket (no user ID)');
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [userId]);

  const value = {
    socket,
    isConnected,
    onlineUsers,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;


