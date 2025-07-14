import { FC, useEffect, useState } from 'react';
import { IconWifi, IconWifiOff } from '@tabler/icons-react';

export const ConnectionStatus: FC = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [showStatus, setShowStatus] = useState(false);
  
  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      
      // Show status for 3 seconds when connection changes
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 3000);
      
      console.log(`[ConnectionStatus] Network status changed: ${online ? 'Online' : 'Offline'}`);
    };
    
    // Check initial status
    setIsOnline(navigator.onLine);
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);
  
  if (!showStatus && isOnline) return null;
  
  return (
    <div 
      className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-all ${
        isOnline 
          ? 'bg-green-500 text-white' 
          : 'bg-red-500 text-white'
      }`}
    >
      {isOnline ? (
        <>
          <IconWifi size={20} />
          <span>Connection restored</span>
        </>
      ) : (
        <>
          <IconWifiOff size={20} />
          <span>No internet connection</span>
        </>
      )}
    </div>
  );
};