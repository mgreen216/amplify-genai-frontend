/**
 * Error logging and debugging utilities
 */

export interface ErrorLog {
  timestamp: string;
  type: string;
  message: string;
  details?: any;
  stack?: string;
  requestId?: string;
  duration?: number;
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private logs: ErrorLog[] = [];
  private maxLogs = 100;
  
  private constructor() {
    // Load existing logs from localStorage if available
    if (typeof window !== 'undefined') {
      const savedLogs = localStorage.getItem('errorLogs');
      if (savedLogs) {
        try {
          this.logs = JSON.parse(savedLogs);
        } catch (e) {
          console.error('Failed to parse saved error logs:', e);
        }
      }
    }
  }
  
  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }
  
  logError(type: string, message: string, details?: any): void {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      type,
      message,
      details
    };
    
    if (details?.stack) {
      errorLog.stack = details.stack;
    }
    
    if (details?.requestId) {
      errorLog.requestId = details.requestId;
    }
    
    if (details?.duration) {
      errorLog.duration = details.duration;
    }
    
    this.logs.unshift(errorLog);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('errorLogs', JSON.stringify(this.logs));
      } catch (e) {
        console.error('Failed to save error logs:', e);
      }
    }
    
    // Also log to console for immediate visibility
    console.error(`[${type}] ${message}`, details);
  }
  
  getLogs(type?: string): ErrorLog[] {
    if (type) {
      return this.logs.filter(log => log.type === type);
    }
    return this.logs;
  }
  
  clearLogs(): void {
    this.logs = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('errorLogs');
    }
  }
  
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
  
  getDebugInfo(): { [key: string]: any } {
    const recentErrors = this.logs.slice(0, 10);
    const errorCounts = this.logs.reduce((acc, log) => {
      acc[log.type] = (acc[log.type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    
    return {
      totalErrors: this.logs.length,
      errorTypes: errorCounts,
      recentErrors: recentErrors,
      systemInfo: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
        timestamp: new Date().toISOString(),
        localStorage: typeof window !== 'undefined' ? !!window.localStorage : false,
        online: typeof navigator !== 'undefined' ? navigator.onLine : true
      }
    };
  }
}

export const errorLogger = ErrorLogger.getInstance();

// Helper functions for common error scenarios
export const logModelError = (message: string, details?: any) => {
  errorLogger.logError('MODEL_ERROR', message, details);
};

export const logNetworkError = (message: string, details?: any) => {
  errorLogger.logError('NETWORK_ERROR', message, details);
};

export const logAPIError = (message: string, details?: any) => {
  errorLogger.logError('API_ERROR', message, details);
};

export const logAuthError = (message: string, details?: any) => {
  errorLogger.logError('AUTH_ERROR', message, details);
};

// Debug helper for development
export const debugLog = (category: string, message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEBUG/${category}] ${message}`, data);
  }
};