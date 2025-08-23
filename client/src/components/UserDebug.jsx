import React, { useEffect, useState } from 'react';

const UserDebug = () => {
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('currentUser');
    
    let parsedUser = null;
    try {
      parsedUser = userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error parsing user:', error);
    }

    setDebugInfo({
      hasToken: !!token,
      hasUserStr: !!userStr,
      userStr: userStr,
      parsedUser: parsedUser,
      userId: parsedUser?._id || parsedUser?.id,
      userIdField: parsedUser?._id ? '_id' : parsedUser?.id ? 'id' : 'none',
      userRole: parsedUser?.role,
      userName: parsedUser?.firstName,
      availableFields: parsedUser ? Object.keys(parsedUser).join(', ') : 'none'
    });

    console.log('🔍 UserDebug - localStorage check:', {
      token: !!token,
      userStr: userStr,
      parsedUser: parsedUser,
      userId: parsedUser?._id || parsedUser?.id,
      allUserFields: parsedUser ? Object.keys(parsedUser) : []
    });
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: '150px', 
      right: '10px', 
      background: 'rgba(255,0,0,0.8)', 
      color: 'white', 
      padding: '10px', 
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>User Debug</h4>
      <div>Has Token: {debugInfo.hasToken ? '✅ Yes' : '❌ No'}</div>
      <div>Has User: {debugInfo.hasUserStr ? '✅ Yes' : '❌ No'}</div>
      <div>User ID: {debugInfo.userId || 'None'}</div>
      <div>ID Field: {debugInfo.userIdField}</div>
      <div>Role: {debugInfo.userRole || 'None'}</div>
      <div>Name: {debugInfo.userName || 'None'}</div>
      <div style={{ fontSize: '10px', marginTop: '5px' }}>
        Fields: {debugInfo.availableFields}
      </div>
      {debugInfo.userStr && (
        <details>
          <summary>Raw User Data</summary>
          <pre style={{ fontSize: '10px', maxHeight: '100px', overflow: 'auto' }}>
            {debugInfo.userStr}
          </pre>
        </details>
      )}
    </div>
  );
};

export default UserDebug;
