import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext({
  socket: null,
  isConnected: false,
  onlineUsers: new Set()
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children, userId }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    // Only connect if we have a userId (user is logged in)
    if (userId) {
      console.log('ðŸ”Œ Initializing socket connection for user:', userId);
      const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      console.log('ðŸŒ Connecting to:', socketUrl);
      
      const newSocket = io(socketUrl, {
        withCredentials: true,
        transports: ['websocket', 'polling'] // Try websocket first, fallback to polling
      });

      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('âœ… Connected to server');
        setIsConnected(true);
        // Authenticate the user with the server
        newSocket.emit('authenticate', userId);
        console.log('ðŸ” Sent authentication for user:', userId);
      });

      newSocket.on('disconnect', () => {
        console.log('âŒ Disconnected from server');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('ðŸš¨ Connection error:', error);
        setIsConnected(false);
      });

      // Handle online users updates
      newSocket.on('online_users', (users) => {
        setOnlineUsers(new Set(users));
      });

      return () => {
        newSocket.disconnect();
      };
    } else {
      // Disconnect if no userId
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [userId]);

  const value = {
    socket,
    isConnected,
    onlineUsers
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
