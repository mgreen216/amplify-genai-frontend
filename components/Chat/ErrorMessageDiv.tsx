import { IconCircleX, IconRefresh, IconWifi, IconSettings } from '@tabler/icons-react';
import { FC, useState } from 'react';

import { ErrorMessage } from '@/types/error';

interface Props {
  error: ErrorMessage;
}

export const ErrorMessageDiv: FC<Props> = ({ error }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const getIcon = () => {
    switch (error.code) {
      case 'OFFLINE_MODE':
      case 'CONNECTION_ERROR':
      case 'NETWORK_ERROR':
        return <IconWifi className="text-orange-500" size={36} />;
      case 'MODELS_CACHED':
        return <IconRefresh className="text-yellow-500" size={36} />;
      case 'NO_MODELS_CONFIGURED':
        return <IconSettings className="text-blue-500" size={36} />;
      default:
        return <IconCircleX className="text-red-500" size={36} />;
    }
  };
  
  const getErrorColor = () => {
    switch (error.code) {
      case 'OFFLINE_MODE':
      case 'MODELS_CACHED':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'CONNECTION_ERROR':
      case 'NETWORK_ERROR':
        return 'text-orange-600 dark:text-orange-400';
      case 'NO_MODELS_CONFIGURED':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-red-500 dark:text-red-400';
    }
  };
  
  const handleRetry = () => {
    window.location.reload();
  };
  
  const handleViewDetails = () => {
    setShowDetails(!showDetails);
  };
  
  return (
    <div className={`mx-6 flex h-full flex-col items-center justify-center ${getErrorColor()}`}>
      <div className="mb-5">
        {getIcon()}
      </div>
      <div className="mb-3 text-2xl font-medium">{error.title}</div>
      <div className="max-w-xl">
        {error.messageLines.map((line, index) => (
          <div key={index} className="text-center mb-2">
            {line}
          </div>
        ))}
      </div>
      
      <div className="mt-6 flex gap-4">
        <button
          onClick={handleRetry}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
        >
          <IconRefresh size={16} className="inline mr-2" />
          Retry
        </button>
        
        {error.code && (
          <button
            onClick={handleViewDetails}
            className="px-4 py-2 border border-current rounded hover:bg-opacity-10 hover:bg-current transition-colors"
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
        )}
      </div>
      
      {showDetails && error.code && (
        <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded max-w-xl">
          <div className="text-xs opacity-75">
            <div><strong>Error Code:</strong> {error.code}</div>
            <div className="mt-2">
              <strong>Troubleshooting Steps:</strong>
              <ul className="list-disc list-inside mt-1">
                {error.code === 'CONNECTION_ERROR' && (
                  <>
                    <li>Check your internet connection</li>
                    <li>Try disabling VPN if you&apos;re using one</li>
                    <li>Check if your firewall is blocking the connection</li>
                  </>
                )}
                {error.code === 'OFFLINE_MODE' && (
                  <>
                    <li>You&apos;re working in offline mode</li>
                    <li>Changes will sync when connection is restored</li>
                    <li>Limited functionality is available</li>
                  </>
                )}
                {error.code === 'NO_MODELS_CONFIGURED' && (
                  <>
                    <li>Contact your administrator to configure models</li>
                    <li>If you have admin access, go to Settings → Admin Interface</li>
                  </>
                )}
                {error.code === 'HTTP_ERROR' && (
                  <>
                    <li>The server returned an error</li>
                    <li>Try refreshing the page</li>
                    <li>If the problem persists, contact support</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
