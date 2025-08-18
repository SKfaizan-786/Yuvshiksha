import React, { useState, useEffect } from 'react';

const LocalStorageDebugger = () => {
  const [storage, setStorage] = useState({});
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const checkStorage = () => {
      const storageData = {
        currentUser: localStorage.getItem('currentUser'),
        token: localStorage.getItem('token'),
        users: localStorage.getItem('users'),
        timestamp: new Date().toLocaleTimeString()
      };
      
      // Only update if something changed
      const currentKeys = Object.keys(storageData).filter(k => k !== 'timestamp');
      const hasChanged = currentKeys.some(key => storage[key] !== storageData[key]);
      
      if (hasChanged) {
        setStorage(storageData);
        setHistory(prev => [
          ...prev.slice(-4), // Keep last 4 entries
          `${storageData.timestamp}: ${currentKeys.filter(k => storage[k] !== storageData[k]).join(', ')} changed`
        ]);
      }
    };

    checkStorage();
    
    // Check every 500ms
    const interval = setInterval(checkStorage, 500);
    
    return () => clearInterval(interval);
  }, [storage]);

  const clearStorage = () => {
    localStorage.clear();
    setHistory(prev => [...prev, `${new Date().toLocaleTimeString()}: Storage cleared manually`]);
  };

  const setTestData = () => {
    const testUser = {
      _id: 'test123',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@test.com',
      role: 'student',
      profileComplete: true
    };
    localStorage.setItem('currentUser', JSON.stringify(testUser));
    localStorage.setItem('token', 'test-token');
    setHistory(prev => [...prev, `${new Date().toLocaleTimeString()}: Test data set`]);
  };

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-3 rounded-lg text-xs max-w-sm z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">LocalStorage Debug</h3>
        <div className="space-x-1">
          <button onClick={setTestData} className="bg-green-600 px-2 py-1 rounded text-xs">Test</button>
          <button onClick={clearStorage} className="bg-red-600 px-2 py-1 rounded text-xs">Clear</button>
        </div>
      </div>
      
      <div className="space-y-1 mb-2">
        <div>
          <strong>currentUser:</strong> {storage.currentUser ? 'âœ“' : 'âœ—'}
          {storage.currentUser && (
            <div className="text-green-300 ml-2 text-xs">
              {(() => {
                try {
                  const user = JSON.parse(storage.currentUser);
                  return `${user.role} - ${user.firstName} (${user.profileComplete ? 'complete' : 'incomplete'})`;
                } catch (e) {
                  return 'Invalid JSON';
                }
              })()}
            </div>
          )}
        </div>
        <div><strong>token:</strong> {storage.token ? 'âœ“' : 'âœ—'}</div>
        <div><strong>users:</strong> {storage.users ? `${JSON.parse(storage.users || '[]').length} users` : 'âœ—'}</div>
      </div>
      
      {history.length > 0 && (
        <div className="border-t border-gray-600 pt-2">
          <div className="text-xs text-gray-300">Recent changes:</div>
          {history.map((entry, i) => (
            <div key={i} className="text-xs text-gray-400">{entry}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocalStorageDebugger;
