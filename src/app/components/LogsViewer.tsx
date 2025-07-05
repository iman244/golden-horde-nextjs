import { useState, useRef, useEffect } from "react";
import type { LogEntry } from "../hooks/useLogs";

interface LogsViewerProps {
  logs: LogEntry[];
  wsLogs: LogEntry[];
  title?: string;
  maxHeight?: string;
  modal?: boolean;
}

type LogTab = 'all' | 'connection' | 'webrtc' | 'websocket';

export function LogsViewer({ logs, wsLogs, title = "System Logs", maxHeight = "200px", modal = false }: LogsViewerProps) {
  const [activeTab, setActiveTab] = useState<LogTab>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [logLevelFilter, setLogLevelFilter] = useState<string[]>(['info', 'warning', 'error']);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const previousLogsLengthRef = useRef<number>(0);
  const previousFiltersRef = useRef<string>('');
  

  // Filter logs based on active tab
  const getFilteredLogs = () => {
    let filteredLogs: LogEntry[] = [];
    
    switch (activeTab) {
      case 'all':
        filteredLogs = [...logs, ...wsLogs];
        break;
      case 'connection':
        filteredLogs = logs.filter(log => 
          log.message.toLowerCase().includes('connection') || 
          log.message.toLowerCase().includes('tent') ||
          log.message.toLowerCase().includes('join') ||
          log.message.toLowerCase().includes('leave')
        );
        break;
      case 'webrtc':
        filteredLogs = logs.filter(log => 
          log.message.toLowerCase().includes('ice') || 
          log.message.toLowerCase().includes('offer') || 
          log.message.toLowerCase().includes('answer') ||
          log.message.toLowerCase().includes('peer') ||
          log.message.toLowerCase().includes('rtc')
        );
        break;
      case 'websocket':
        filteredLogs = wsLogs;
        break;
    }

    // Apply search filter
    if (searchTerm) {
      filteredLogs = filteredLogs.filter(log =>
        log.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply level filter
    filteredLogs = filteredLogs.filter(log =>
      logLevelFilter.includes(log.level || 'info')
    );

    return filteredLogs;
  };

  const filteredLogs = getFilteredLogs();

  // Check if user is near bottom of logs
  const isUserNearBottom = () => {
    if (!logsContainerRef.current) return true;
    
    const container = logsContainerRef.current;
    const threshold = 100; // pixels from bottom
    
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  };

  // Scroll to bottom function
  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Smart auto-scroll logic
  useEffect(() => {
    const currentFilters = JSON.stringify({ activeTab, searchTerm, logLevelFilter });
    const filtersChanged = previousFiltersRef.current !== currentFilters;
    const logsAdded = filteredLogs.length > previousLogsLengthRef.current;
    
    // Always scroll to bottom when filters change
    if (filtersChanged) {
      scrollToBottom();
    }
    // Only scroll to bottom for new logs if user is already near bottom
    else if (logsAdded && isUserNearBottom()) {
      scrollToBottom();
    }
    
    // Update refs for next comparison
    previousFiltersRef.current = currentFilters;
    previousLogsLengthRef.current = filteredLogs.length;
  }, [filteredLogs, activeTab, searchTerm, logLevelFilter]);

  // Get log level icon and color
  const getLogIcon = (level: string) => {
    switch(level) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📝';
    }
  };

  const getLogColor = (level: string) => {
    switch(level) {
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  // Export logs function
  const exportLogs = () => {
    const logText = filteredLogs.map(log => 
      `[${new Date(log.timestamp || Date.now()).toISOString()}] [${log.level}] ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice-chat-logs-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Clear logs function (you'll need to add this to useLogs hook)
  const clearLogs = () => {
    // This would need to be implemented in the useLogs hook
    console.log('Clear logs functionality needs to be implemented in useLogs hook');
  };

  return (
    <div style={{
      background: modal ? '#1f2937' : '#1f2937',
      border: modal ? 'none' : '1px solid #374151',
      borderRadius: modal ? 8 : '8px',
      overflow: 'hidden',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      width: '100%',
      height: '100%',
      padding: modal ? 0 : undefined,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header (only if not modal) */}
      {!modal && (
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #374151',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, color: '#f9fafb', fontSize: '16px', fontWeight: '600' }}>
            {title}
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={exportLogs}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid #374151',
                background: 'transparent',
                color: '#9ca3af',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Export
            </button>
            <button
              onClick={clearLogs}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid #374151',
                background: 'transparent',
                color: '#9ca3af',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Tabs, Search, Filters - sticky in modal mode */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        position: modal ? 'sticky' : undefined,
        top: 0,
        zIndex: 1,
        background: modal ? '#1f2937' : undefined,
        borderBottom: '1px solid #374151',
      }}>
        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 16px',
        }}>
          {(['all', 'connection', 'webrtc', 'websocket'] as LogTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid #374151',
                background: activeTab === tab ? '#3b82f6' : 'transparent',
                color: activeTab === tab ? 'white' : '#9ca3af',
                cursor: 'pointer',
                fontSize: '12px',
                textTransform: 'capitalize' as const
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        {/* Search and Filters */}
        <div style={{
          padding: '12px 16px',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          background: modal ? '#1f2937' : undefined,
        }}>
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid #374151',
              background: '#111827',
              color: '#f9fafb',
              fontSize: '12px',
              flex: 1
            }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['info', 'warning', 'error'] as const).map(level => (
              <label key={level} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#9ca3af' }}>
                <input
                  type="checkbox"
                  checked={logLevelFilter.includes(level)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setLogLevelFilter([...logLevelFilter, level]);
                    } else {
                      setLogLevelFilter(logLevelFilter.filter(l => l !== level));
                    }
                  }}
                  style={{ margin: 0 }}
                />
                {level}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Logs Content */}
      <div 
        ref={logsContainerRef}
        style={{
          flex: 1,
          maxHeight: modal ? '100%' : maxHeight,
          overflowY: 'auto',
          background: 'none',
          padding: '0 0 8px 0',
        }}
      >
        {filteredLogs.length === 0 ? (
          <div style={{
            padding: '32px 16px',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '14px'
          }}>
            No logs to display
          </div>
        ) : (
          <div>
            {filteredLogs.map((log, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  padding: '8px 16px',
                  borderBottom: '1px solid #1f2937',
                  fontFamily: '"SF Mono", "Monaco", "Inconsolata", monospace',
                  fontSize: '12px',
                  lineHeight: '1.4'
                }}
              >
                {/* Timestamp */}
                <span style={{
                  color: '#9ca3af',
                  minWidth: '80px',
                  fontSize: '11px',
                  flexShrink: 0
                }}>
                  {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}
                </span>

                {/* Level Icon */}
                <span style={{
                  marginRight: '8px',
                  fontSize: '12px',
                  flexShrink: 0
                }}>
                  {getLogIcon(log.level || 'info')}
                </span>

                {/* Level Badge */}
                <span style={{
                  minWidth: '60px',
                  fontWeight: '600',
                  textTransform: 'uppercase' as const,
                  fontSize: '10px',
                  color: getLogColor(log.level || 'info'),
                  flexShrink: 0
                }}>
                  {log.level || 'info'}
                </span>

                {/* Message */}
                <span style={{
                  marginLeft: '12px',
                  color: '#f9fafb',
                  wordBreak: 'break-word' as const,
                  flex: 1
                }}>
                  {log.message}
                </span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>

      {/* Footer with log count */}
      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid #374151',
        fontSize: '11px',
        color: '#6b7280',
        textAlign: 'right',
        background: modal ? '#1f2937' : undefined,
      }}>
        {filteredLogs.length} log{filteredLogs.length !== 1 ? 's' : ''} displayed
      </div>
    </div>
  );
} 