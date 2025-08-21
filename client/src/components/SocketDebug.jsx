import React from 'react';
import { useSocket } from '../contexts/SocketContext';

const SocketDebug = ({ userId }) => {
  const { socket, isConnected, onlineUsers } = useSocket();

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px', 
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>Socket Debug</h4>
      <div>User ID: {userId || 'None'}</div>
      <div>Socket: {socket ? '✅ Created' : '❌ Null'}</div>
      <div>Connected: {isConnected ? '✅ Yes' : '❌ No'}</div>
      <div>Socket ID: {socket?.id || 'None'}</div>
      <div>Online Users: {onlineUsers.size}</div>
      <div>Socket Connected: {socket?.connected ? '✅ Yes' : '❌ No'}</div>
      <div>Socket URL: {socket?.io?.uri || 'Unknown'}</div>
    </div>
  );
};

export default SocketDebug;
