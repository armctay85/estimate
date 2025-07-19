// client/src/pages/AdminChat.tsx
// Grok Agent - Replit-style development assistant for live coding within admin panel
// Autonomous AI developer that can modify code, fix bugs, and add features in real-time

import React, { useState, useEffect, useRef, useReducer } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faRobot, faHistory, faWrench, faSpinner } from '@fortawesome/free-solid-svg-icons';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

const initialState: Message[] = [];

const reducer = (state: Message[], action: { type: 'add' | 'update' | 'load'; messages?: Message[]; content?: string }) => {
  switch (action.type) {
    case 'add':
      return [...state, action.messages![0]];
    case 'update':
      const last = {...state[state.length - 1]};
      last.content += action.content!;
      return [...state.slice(0, -1), last];
    case 'load':
      return action.messages!;
    default:
      return state;
  }
};

const AdminChat: React.FC = () => {
  const [messages, dispatch] = useReducer(reducer, initialState);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchHistory();
    fetchPreviewUrl();
  }, []);

  const fetchPreviewUrl = async () => {
    try {
      const res = await fetch('/api/grok/preview', { 
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } 
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewUrl(data.previewUrl);
      }
    } catch (err) {
      console.error('Failed to fetch preview URL:', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/grok/history', { 
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } 
      });
      if (res.ok) {
        const data = await res.json();
        const formattedMessages = data.map((item: any) => ({
          role: item.role,
          content: item.message,
          timestamp: item.timestamp
        }));
        dispatch({ type: 'load', messages: formattedMessages });
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user' as const, content: input };
    dispatch({ type: 'add', messages: [userMessage] });
    setInput('');
    setLoading(true);
    setError(null);

    const assistantMessage = { role: 'assistant' as const, content: '' };
    dispatch({ type: 'add', messages: [assistantMessage] });

    try {
      const response = await fetch('/api/grok/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}` 
        },
        body: JSON.stringify({ 
          messages: [...messages, userMessage] 
        })
      });

      if (!response.ok) throw new Error('Chat request failed');

      // Handle non-streaming JSON response
      const data = await response.json();
      if (data.content) {
        dispatch({ type: 'update', content: data.content });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const amendCode = async (file: string, issue: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/grok/amend', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}` 
        },
        body: JSON.stringify({ filePath: file, errorMessage: issue })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Code amended successfully!\nBackup saved at: ${data.backup}\nTest result: ${data.testResult}`);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setError('Amend failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className={`flex ${showPreview ? '' : 'flex-col'} h-screen bg-gray-900 text-white`}>
      {/* Main Chat Section */}
      <div className={`flex flex-col ${showPreview ? 'w-1/2' : 'w-full'}`}>
        <header className="p-4 bg-gradient-to-r from-blue-900 to-purple-900 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Grok Admin Console</h1>
            <p className="text-sm text-gray-300">Self-Healing & Development System</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowPreview(!showPreview)} 
              className={`px-3 py-1 rounded transition-colors ${
                showPreview ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700 hover:bg-gray-600'
              }`}
              title="Toggle preview"
            >
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
            <button 
              onClick={fetchHistory} 
              className="p-2 hover:bg-white/10 rounded transition-colors"
              title="Refresh history"
            >
              <FontAwesomeIcon icon={faHistory} />
            </button>
          </div>
        </header>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-3xl p-4 rounded-lg ${
              msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-700'
            }`}>
              <div className="flex items-start">
                {msg.role === 'assistant' && (
                  <FontAwesomeIcon icon={faRobot} className="mr-2 mt-1 text-purple-400" />
                )}
                <div className="flex-1">
                  <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                  {msg.timestamp && (
                    <span className="text-xs text-gray-400 mt-2 block">
                      {new Date(msg.timestamp).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {error && (
        <div className="p-4 bg-red-900/50 text-red-200 text-center">
          {error}
        </div>
      )}
      
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <div className="flex gap-2 mb-2">
          <button 
            onClick={() => amendCode('client/src/components/forge-viewer.tsx', 'Viewer Script error')} 
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded flex items-center gap-2 transition-colors"
            disabled={loading}
          >
            <FontAwesomeIcon icon={faWrench} />
            Auto-Fix Forge Viewer
          </button>
          <button 
            onClick={() => amendCode('server/forge-api.ts', 'Translation error')} 
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded flex items-center gap-2 transition-colors"
            disabled={loading}
          >
            <FontAwesomeIcon icon={faWrench} />
            Fix Translation API
          </button>
        </div>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-l-lg focus:outline-none focus:border-blue-500"
            placeholder="Ask Grok to fix errors, add features, or explain code..."
            disabled={loading}
          />
          <button 
            onClick={sendMessage} 
            className="px-6 bg-blue-600 hover:bg-blue-700 rounded-r-lg transition-colors flex items-center gap-2" 
            disabled={loading}
          >
            {loading ? (
              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            ) : (
              <FontAwesomeIcon icon={faPaperPlane} />
            )}
          </button>
        </div>
        </div>
      </div>
      
      {/* Preview Section */}
      {showPreview && (
        <div className="w-1/2 border-l border-gray-700">
          <div className="h-full flex flex-col">
            <div className="p-4 bg-gray-800 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Live Preview</h2>
              <p className="text-sm text-gray-400">Shows current development state</p>
            </div>
            <div className="flex-1">
              {previewUrl ? (
                <iframe 
                  src={previewUrl}
                  className="w-full h-full bg-white"
                  title="App Preview"
                  sandbox="allow-same-origin allow-scripts allow-forms"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Loading preview...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminChat;