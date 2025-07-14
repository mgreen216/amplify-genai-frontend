import { FC, useState, useEffect } from 'react';
import { IconBug, IconX, IconDownload, IconTrash } from '@tabler/icons-react';
import { errorLogger } from '@/utils/app/errorLogging';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DebugPanel: FC<Props> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState(errorLogger.getLogs());
  const [debugInfo, setDebugInfo] = useState(errorLogger.getDebugInfo());
  const [filter, setFilter] = useState('ALL');
  
  useEffect(() => {
    if (isOpen) {
      setLogs(errorLogger.getLogs());
      setDebugInfo(errorLogger.getDebugInfo());
    }
  }, [isOpen]);
  
  const handleExport = () => {
    const data = errorLogger.exportLogs();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleClear = () => {
    if (confirm('Are you sure you want to clear all error logs?')) {
      errorLogger.clearLogs();
      setLogs([]);
      setDebugInfo(errorLogger.getDebugInfo());
    }
  };
  
  const filteredLogs = filter === 'ALL' ? logs : logs.filter(log => log.type === filter);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-2">
            <IconBug size={24} />
            <h2 className="text-xl font-semibold">Debug Panel</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Export logs"
            >
              <IconDownload size={20} />
            </button>
            <button
              onClick={handleClear}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Clear logs"
            >
              <IconTrash size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <IconX size={20} />
            </button>
          </div>
        </div>
        
        <div className="p-4 border-b dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-500 dark:text-gray-400">Total Errors</div>
              <div className="text-2xl font-semibold">{debugInfo.totalErrors}</div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">Error Types</div>
              <div className="text-2xl font-semibold">{Object.keys(debugInfo.errorTypes).length}</div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">Connection</div>
              <div className="text-2xl font-semibold">{debugInfo.systemInfo.online ? 'Online' : 'Offline'}</div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">Time</div>
              <div className="text-sm">{new Date(debugInfo.systemInfo.timestamp).toLocaleTimeString()}</div>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-b dark:border-gray-700">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="ALL">All Errors</option>
            {Object.keys(debugInfo.errorTypes).map(type => (
              <option key={type} value={type}>
                {type} ({debugInfo.errorTypes[type]})
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {filteredLogs.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              No errors logged
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log, index) => (
                <div
                  key={index}
                  className="border dark:border-gray-700 rounded p-3 text-sm"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      {log.type}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="mb-2">{log.message}</div>
                  {log.details && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-600 dark:text-gray-400">
                        Details
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  )}
                  {log.requestId && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Request ID: {log.requestId}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};