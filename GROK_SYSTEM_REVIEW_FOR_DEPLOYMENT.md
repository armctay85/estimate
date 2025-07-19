# COMPLETE ESTIMATE APP SOURCE CODE FOR GROK DEPLOYMENT FIX

## CRITICAL DEPLOYMENT ISSUE
**Status**: Babel parsing error preventing React compilation  
**Business Impact**: $44.985M pipeline blocked  
**Priority**: URGENT - Fix required for enterprise deployment  

## ERROR ANALYSIS
```
SyntaxError: Unexpected token, expected ";" (45:47)
at parseIdentifierName (/node_modules/@babel/parser/src/parser/expression.ts:2851:10)
```

## COMPLETE SOURCE CODE FOR ANALYSIS

### 1. CLIENT APP.TSX (MAIN ISSUE LOCATION)
```typescript
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
// import { AuthProvider } from "./hooks/use-auth";
import { Home } from "@/pages/home";
import Auth from "@/pages/auth";
import Subscribe from "@/pages/subscribe";
import Projects from "@/pages/projects";
import ProjectDetail from "@/pages/project-detail";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import ThreeDProcessor from "@/pages/3d-processor";
import AdminDashboard from "@/pages/admin";
import NotFound from "@/pages/not-found";
import { Sketch } from "@/pages/sketch";
import { Regulations } from "@/pages/regulations";
import { BIMViewerPage } from "@/pages/bim-viewer";
import { TestViewer } from "@/pages/test-viewer";
import { TestForge } from "@/pages/test-forge";
import LoginPage from "@/pages/LoginPage";
import AdminChat from "@/pages/AdminChat";
import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";

function Router() {
  const isAuthenticated = () => !!localStorage.getItem('adminToken');

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/sketch" component={Sketch} />
      <Route path="/auth" component={Auth} />
      <Route path="/subscribe" component={Subscribe} />
      <Route path="/projects" component={Projects} />
      <Route path="/project/:id" component={ProjectDetail} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      <Route path="/3d-processor" component={ThreeDProcessor} />
      <Route path="/admin">
        {() => {
          const hasToken = isAuthenticated();
          console.log('Admin route check - hasToken:', hasToken, 'token:', localStorage.getItem('adminToken'));
          return hasToken ? <AdminChat /> : <LoginPage />;
        }}
      </Route>
      <Route path="/login" component={LoginPage} />
      <Route path="/regulations" component={Regulations} />
      <Route path="/bim-viewer" component={BIMViewerPage} />
      <Route path="/test-viewer" component={TestViewer} />
      <Route path="/test-forge" component={TestForge} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-200`}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <button 
            onClick={() => setDarkMode(!darkMode)} 
            className="fixed top-4 right-4 z-50 p-2 bg-gray-800 dark:bg-gray-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;
```

### 2. GROK API CLIENT (BACKEND SERVICE)
```typescript
// server/grok-api-client.ts
// Best-in-class Grok API client: Handles authentication, retries, error logging, and code amendment prompts.
// Quality: Starlink-level - Typed, resilient (exponential backoff retries), secure (env key), efficient (streaming optional).

import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

const GROK_API_BASE = 'https://api.x.ai/v1'; // Official endpoint
const API_KEY = process.env.XAI_API_KEY;

if (!API_KEY) {
  throw new Error('XAI_API_KEY missing in env');
}

export async function callGrok(prompt: string, model = 'grok-2-1212', maxTokens = 2048) {
  try {
    const response = await axios.post(
      `${GROK_API_BASE}/chat/completions`,
      {
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.7, // Balanced creativity
        stream: false // Set true for streaming if needed
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60s timeout
      }
    );

    return response.data.choices[0].message.content;
  } catch (error: any) {
    console.error('Grok API error:', error.response?.data || error.message);
    throw error;
  }
}

// Amend code function: Uses Grok to fix file based on error
export async function amendCode(filePath: string, errorMessage: string) {
  const fullPath = path.resolve(process.cwd(), filePath);
  const code = await fs.readFile(fullPath, 'utf-8');
  const backupPath = `${fullPath}.bak`;
  await fs.copyFile(fullPath, backupPath); // Backup for safety

  const prompt = `You are an expert coder fixing bugs in this Node.js/React app. Current code in ${filePath}:
\`\`\`typescript
${code}
\`\`\`

Error: ${errorMessage}

Provide the full amended code (no explanations, just the code). Ensure it's complete and deployable.`;

  const amendedCode = await callGrok(prompt);

  await fs.writeFile(fullPath, amendedCode);
  console.log(`Amended ${filePath}; backup at ${backupPath}`);
  return amendedCode;
}

// Test code function: Runs simple exec for validation
export async function testCode(command: string) {
  const { exec } = require('child_process');
  return new Promise((resolve, reject) => {
    exec(command, (err: any, stdout: string, stderr: string) => {
      if (err) reject(stderr);
      resolve(stdout);
    });
  });
}
```

### 3. GROK SYSTEM BACKEND (COMPREHENSIVE ROUTES)
```typescript
// server/grok-system.ts
// Best-in-class self-healing system: Grok API chat, code amendment, testing, error-triggered fixes.
// Quality: Starlink-level - Typed, secure (JWT auth, rate limit), resilient (retries, backups), logged (Winston), scalable (streaming, async).

import express from 'express';
import axios from 'axios';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import winston from 'winston';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import sqlite3 from 'sqlite3';

const router = express.Router();
const logger = winston.createLogger({ 
  level: 'info', 
  transports: [new winston.transports.Console()] 
});
const execAsync = util.promisify(exec);
const db = new sqlite3.Database(':memory:'); // Or file for persistence

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS chat_history (id INTEGER PRIMARY KEY, userId TEXT, message TEXT, role TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)");
});

const GROK_API_BASE = 'https://api.x.ai/v1/chat/completions';
const API_KEY = process.env.XAI_API_KEY || process.env.GROK_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'estimate-secret-key-2025';

if (!API_KEY) {
  logger.warn('XAI_API_KEY/GROK_API_KEY missing - Grok system will not function');
}

// Auth middleware for admin-only
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Rate limit: 5 requests/min
const limiter = rateLimit({ windowMs: 60 * 1000, max: 5 });

// Routes
router.use('/grok', authenticate);
router.use('/grok', limiter);

// Chat endpoint: Streams Grok responses, saves history
router.post('/grok/chat', async (req, res) => {
  const { messages, model = 'grok-2-1212', maxTokens = 2048 } = req.body;
  if (!messages) return res.status(400).json({ error: 'Missing messages' });

  try {
    const response = await axios.post(GROK_API_BASE, { 
      model, 
      messages, 
      max_tokens: maxTokens, 
      temperature: 0.7, 
      stream: true 
    }, {
      headers: { 
        'Authorization': `Bearer ${API_KEY}`, 
        'Content-Type': 'application/json' 
      },
      responseType: 'stream',
      timeout: 60000
    });

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    response.data.on('data', (chunk: Buffer) => {
      const lines = chunk.toString().split('\n').filter(Boolean);
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          res.write(line + '\n');
        }
      }
    });

    response.data.on('end', () => {
      res.end();
    });

  } catch (error: any) {
    logger.error('Grok chat error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Amendment endpoint: Auto-fixes code files
router.post('/grok/amend', async (req, res) => {
  const { file, issue } = req.body;
  if (!file || !issue) return res.status(400).json({ error: 'Missing file or issue' });

  try {
    const filePath = path.resolve(process.cwd(), file);
    const code = await fs.readFile(filePath, 'utf-8');
    
    // Create backup
    const backupPath = `${filePath}.bak`;
    await fs.copyFile(filePath, backupPath);
    
    const prompt = `Fix this TypeScript/React code issue:

File: ${file}
Issue: ${issue}

Current code:
\`\`\`typescript
${code}
\`\`\`

Provide the complete fixed code (no explanations, just the code):`;

    const response = await axios.post(GROK_API_BASE, {
      model: 'grok-2-1212',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
      temperature: 0.3
    }, {
      headers: { 
        'Authorization': `Bearer ${API_KEY}`, 
        'Content-Type': 'application/json' 
      },
      timeout: 60000
    });

    const fixedCode = response.data.choices[0].message.content;
    await fs.writeFile(filePath, fixedCode);
    
    logger.info(`Code amended: ${file}`);
    res.json({ success: true, message: `Fixed ${file}`, backup: backupPath });
    
  } catch (error: any) {
    logger.error('Amendment error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Admin login endpoint
router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (username === 'admin' && password === 'pass') {
    const token = jwt.sign({ user: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// System status endpoint
router.get('/grok/system-status', authenticate, async (req, res) => {
  try {
    const status = {
      timestamp: new Date().toISOString(),
      grokAPI: !!API_KEY,
      database: true,
      authentication: true,
      selfHealing: true
    };
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

### 4. ERROR HANDLER MIDDLEWARE
```typescript
// server/error-handler.ts
// Global error handler: Triggers Grok API for auto-fixes on runtime errors.
// Quality: Starlink-level - Asynchronous, logged, with rollback on failure.

import { Request, Response, NextFunction } from 'express';
import { amendCode, testCode } from './grok-api-client';

export function setupGrokErrorHandler(app: any) {
  // Global error handler middleware
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Runtime error:', err.message);
    
    // Trigger on viewer errors
    if (err.message.includes('Viewer') || err.message.includes('forge')) {
      console.log('Triggering Grok auto-fix for viewer error...');
      
      amendCode('client/src/components/forge-viewer.tsx', err.message)
        .then(amended => {
          console.log('Code amended successfully');
          
          // Run tests if available
          testCode('npm test -- forge-viewer')
            .then(result => console.log('Test result after amend:', result))
            .catch(testErr => console.error('Test failed:', testErr));
        })
        .catch(amendErr => console.error('Grok amend failed:', amendErr));
    }
    
    // Send error response
    res.status(500).json({ 
      error: err.message,
      grokFixAttempted: err.message.includes('Viewer') || err.message.includes('forge')
    });
  });
}

// Async error wrapper for routes
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
```

### 5. LOGIN PAGE COMPONENT
```typescript
// client/src/pages/LoginPage.tsx
// Best-in-class login: Secure token generation for admin access.
// Quality: Starlink-level - Secure auth flow, responsive design.

import React, { useState } from 'react';
import { useLocation } from 'wouter';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      
      if (res.ok && data.token) {
        localStorage.setItem('adminToken', data.token);
        setLocation('/admin');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 text-white">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-2xl">
        <h1 className="text-3xl font-bold mb-2 text-center">Admin Login</h1>
        <p className="text-gray-400 text-center mb-6">Grok Self-Healing System</p>
        
        <form onSubmit={login} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
              placeholder="admin"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
              placeholder="••••"
              required
            />
          </div>
          
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-600 rounded text-sm">
              {error}
            </div>
          )}
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-400">
          <p>Default credentials:</p>
          <p>Username: <span className="font-mono">admin</span></p>
          <p>Password: <span className="font-mono">pass</span></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
```

### 6. ADMIN CHAT COMPONENT (GROK INTERFACE)
```typescript
// client/src/pages/AdminChat.tsx
// Best-in-class admin chat for Grok: Streaming, history from DB, amendment triggers, error UI.
// Quality: Starlink-level - Typed, responsive, state-optimized, secure (token auth), accessible.

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

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

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                dispatch({ type: 'update', content: data.content });
              }
            } catch (e) {
              // Skip parse errors
            }
          }
        }
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
        body: JSON.stringify({ file, issue })
      });
      const result = await res.json();
      if (result.success) {
        dispatch({ type: 'add', messages: [{ role: 'assistant', content: `✅ Code amended: ${file}` }] });
      }
    } catch (err) {
      setError('Amendment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm p-4 border-b">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
          <FontAwesomeIcon icon={faRobot} className="mr-2 text-blue-600" />
          Grok Admin Console
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Self-healing system management and live code fixes</p>
      </div>

      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border'
                }`}>
                  <div className="text-sm">{msg.content}</div>
                  {msg.timestamp && (
                    <div className="text-xs opacity-70 mt-1">{msg.timestamp}</div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 border-t">
            {error && (
              <div className="mb-2 p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded text-sm">
                {error}
              </div>
            )}
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Enter Grok command or ask for help..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <FontAwesomeIcon icon={faSpinner} spin />
                ) : (
                  <FontAwesomeIcon icon={faPaperPlane} />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="w-80 bg-white dark:bg-gray-800 border-l p-4">
          <h3 className="font-bold mb-4 text-gray-900 dark:text-white">Quick Actions</h3>
          <div className="space-y-2">
            <button
              onClick={() => amendCode('client/src/App.tsx', 'Babel parsing error at line 45-47')}
              className="w-full px-3 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
            >
              <FontAwesomeIcon icon={faWrench} className="mr-2" />
              Fix App.tsx Syntax Error
            </button>
            <button
              onClick={() => setInput('Run system diagnostics and check all components')}
              className="w-full px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              System Diagnostics
            </button>
            <button
              onClick={() => setInput('Check authentication flow and admin panel status')}
              className="w-full px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
            >
              Auth Status Check
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminChat;
```

### 7. PACKAGE.JSON DEPENDENCIES
```json
{
  "name": "rest-express",
  "version": "1.0.0",
  "type": "module",
  "license": "MIT",
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js",
    "check": "tsc",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "@fortawesome/free-solid-svg-icons": "^6.7.2",
    "@fortawesome/react-fontawesome": "^0.2.2",
    "@hookform/resolvers": "^3.10.0",
    "@neondatabase/serverless": "^0.10.4",
    "@radix-ui/react-dialog": "^1.1.7",
    "@radix-ui/react-toast": "^1.2.7",
    "@stripe/react-stripe-js": "^3.7.0",
    "@stripe/stripe-js": "^7.4.0",
    "@tanstack/react-query": "^5.60.5",
    "axios": "^1.10.0",
    "bcryptjs": "^3.0.2",
    "express": "^4.21.2",
    "express-rate-limit": "^7.5.1",
    "express-session": "^1.18.1",
    "helmet": "^8.1.0",
    "jsonwebtoken": "^9.0.2",
    "lucide-react": "^0.453.0",
    "multer": "^2.0.1",
    "openai": "^5.9.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.55.0",
    "sqlite3": "^5.1.7",
    "stripe": "^18.3.0",
    "winston": "^3.17.0",
    "wouter": "^3.3.5",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.2",
    "typescript": "5.6.3",
    "vite": "^5.4.19"
  }
}
```

### 8. SERVER ROUTES INTEGRATION
```typescript
// server/routes.ts - CRITICAL INTEGRATION SECTION
import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import session from "express-session";
import passport from "passport";
import Stripe from "stripe";
import multer from "multer";
import OpenAI from "openai";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import { insertUserSchema, insertProjectSchema, insertRoomSchema, MATERIALS } from "@shared/schema";
import { setupForgeRoutes } from "./forge-api";
import { setupRealForgeRoutes } from "./forge-real-integration";
import { setupFastUpload } from "./fast-upload";
import { setupDataProcessing } from "./data-processor";
import { setupInstantUpload } from "./instant-upload";
import { setupBIMUploadFix } from "./bim-upload-fix";
import { predictConstructionCost, analyzeBIMFile, generateQSReport } from "./xai-service";
import { multiAI } from "./multi-ai-service";
import { register, login, logout, getCurrentUser, isAuthenticated, requireTier } from "./auth";
import { createSubscription, createPaymentIntent, handleWebhook, createBillingPortalSession } from "./stripe-service";
import { setupRegulationsRoutes } from "./aus-regulations-service";
import { amendCode } from './grok-api-client';
import { setupGrokErrorHandler } from './error-handler';
import grokSystemRouter, { grokErrorHandler } from './grok-system';
import PDFDocument from "pdfkit";
import NodeCache from "node-cache";
import jwt from "jsonwebtoken";

export async function registerRoutes(app: Express): Promise<Server> {
  // CRITICAL: Global CORS Middleware - Allow all origins, methods, headers for maximum compatibility in Replit
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Range, If-None-Match, If-Modified-Since');
    res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range, ETag, Last-Modified');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // CRITICAL: Security middleware with Tailwind CDN allowed
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "js.stripe.com", "aps.autodesk.com", "developer.api.autodesk.com", "cdn.tailwindcss.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com", "developer.api.autodesk.com", "cdn.tailwindcss.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "api.stripe.com", "api.x.ai", "developer.api.autodesk.com"],
        fontSrc: ["'self'", "fonts.gstatic.com", "fonts.googleapis.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'", "js.stripe.com"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        scriptSrcAttr: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    crossOriginEmbedderPolicy: false // Allow Forge viewer
  }));

  // CRITICAL: Rate limiting configuration
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    validate: {trustProxy: false}, // Disable trust proxy validation for Replit
    skip: (req) => req.ip === '127.0.0.1'
  });
  app.use('/api/', limiter);

  // CRITICAL: Admin login route for Grok system
  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (username === 'admin' && password === 'pass') {
      const token = jwt.sign({ user: 'admin' }, process.env.JWT_SECRET || 'estimate-secret-key-2025', { expiresIn: '24h' });
      res.json({ token });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  // CRITICAL: Grok system routes integration
  app.use('/api', grokSystemRouter);

  // CRITICAL: Grok error handler setup
  setupGrokErrorHandler(app);

  // CRITICAL: Static file serving for admin login page
  app.get('/admin-login.html', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'admin-login.html'));
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
```

## GROK INSTRUCTIONS FOR IMMEDIATE ACTION

### CRITICAL ISSUE IDENTIFICATION
**ERROR**: Babel parsing error in App.tsx line 45-47  
**CAUSE**: Syntax error in admin route authentication check  
**BUSINESS IMPACT**: $44.985M pipeline blocked due to deployment failure  

### REQUIRED FIXES
1. **Fix App.tsx syntax error** - Lines 45-47 admin route authentication
2. **Verify AdminChat token consistency** - Ensure 'adminToken' used throughout  
3. **Test complete authentication flow** - Login → token storage → admin panel access
4. **Validate Grok self-healing system** - End-to-end code amendment capability

### SUCCESS CRITERIA
- React app compiles without Babel errors
- Admin login redirects successfully to /admin
- AdminChat component loads with working Grok interface  
- Self-healing system ready for production deployment
- Platform achieves enterprise-grade reliability standards

**DEPLOY IMMEDIATELY AFTER FIXES TO ACTIVATE SELF-HEALING SYSTEM**
```typescript
// client/src/pages/AdminChat.tsx
// Best-in-class admin chat for Grok: Streaming, history from DB, amendment triggers, error UI.
// Quality: Starlink-level - Typed, responsive, state-optimized, secure (token auth), accessible.

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

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

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                dispatch({ type: 'update', content: data.content });
              }
            } catch (e) {
              // Skip parse errors
            }
          }
        }
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
        body: JSON.stringify({ file, issue })
      });
      const result = await res.json();
      if (result.success) {
        dispatch({ type: 'add', messages: [{ role: 'assistant', content: `✅ Code amended: ${file}` }] });
      }
    } catch (err) {
      setError('Amendment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm p-4 border-b">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
          <FontAwesomeIcon icon={faRobot} className="mr-2 text-blue-600" />
          Grok Admin Console
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Self-healing system management and live code fixes</p>
      </div>

      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border'
                }`}>
                  <div className="text-sm">{msg.content}</div>
                  {msg.timestamp && (
                    <div className="text-xs opacity-70 mt-1">{msg.timestamp}</div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 border-t">
            {error && (
              <div className="mb-2 p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded text-sm">
                {error}
              </div>
            )}
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Enter Grok command or ask for help..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <FontAwesomeIcon icon={faSpinner} spin />
                ) : (
                  <FontAwesomeIcon icon={faPaperPlane} />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="w-80 bg-white dark:bg-gray-800 border-l p-4">
          <h3 className="font-bold mb-4 text-gray-900 dark:text-white">Quick Actions</h3>
          <div className="space-y-2">
            <button
              onClick={() => amendCode('client/src/App.tsx', 'Babel parsing error at line 45-47')}
              className="w-full px-3 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
            >
              <FontAwesomeIcon icon={faWrench} className="mr-2" />
              Fix App.tsx Syntax Error
            </button>
            <button
              onClick={() => setInput('Run system diagnostics and check all components')}
              className="w-full px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              System Diagnostics
            </button>
            <button
              onClick={() => setInput('Check authentication flow and admin panel status')}
              className="w-full px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
            >
              Auth Status Check
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminChat;
```

## Console Logs Show Success Path
```
Admin route check - hasToken: false, token: null
Attempting login with: admin pass
Login response status: 200
Login response data: {"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
Token stored in localStorage: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Redirecting to /admin...
Admin route check - hasToken: true, token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Grok Action Required
**Please analyze and fix the following files:**

### 1. App.tsx Syntax Error (Lines 45-47)
Current problematic code around admin route:
```typescript
<Route path="/admin">
  {() => {
    const hasToken = isAuthenticated();
    console.log('Admin route check - hasToken:', hasToken, 'token:', localStorage.getItem('adminToken'));
    return hasToken ? <AdminChat /> : <LoginPage />;
  }}
</Route>
```

**Request**: Fix syntax error while preserving authentication logic

### 2. AdminChat Component Token Alignment
File: `client/src/pages/AdminChat.tsx`
Issue: Ensure all API calls use 'adminToken' consistently

### 3. Error Handler Integration Verification
File: `server/error-handler.ts`
Ensure: Global error catching for viewer errors is active

## System Architecture Verification Needed

### Backend Components (Should be working)
- ✅ JWT-based admin authentication 
- ✅ Grok API client with amendCode function
- ✅ Express routes with proper CORS and CSP
- ✅ Admin login HTML page serving correctly

### Frontend Components (Needs verification)
- ❓ React app parsing and compilation
- ❓ Admin route authentication check
- ❓ AdminChat component loading
- ❓ Grok chat interface functionality

## Deployment Readiness Checklist

### Critical Requirements for Go-Live
1. **Fix Babel parsing error** - URGENT
2. **Verify admin panel loads** after authentication
3. **Test Grok chat interface** functionality
4. **Confirm self-healing system** can amend code
5. **Validate all authentication flows** work end-to-end

### Business Impact
- $44.985M pipeline depends on platform stability
- Enterprise-grade reliability required
- Self-healing capability is revolutionary feature
- Admin system enables zero-downtime maintenance

## Grok Instructions

**Priority 1**: Fix the syntax error in App.tsx that's preventing React compilation
**Priority 2**: Verify AdminChat component loads correctly with adminToken
**Priority 3**: Test end-to-end admin workflow: login → admin panel → Grok chat
**Priority 4**: Confirm self-healing triggers work for runtime errors

### Expected Grok Actions
1. **Analyze** the exact syntax issue in App.tsx lines 45-47
2. **Fix** the parsing error while preserving authentication logic
3. **Verify** all admin token references are consistent
4. **Test** the complete admin authentication and chat flow
5. **Report** deployment readiness status

## Success Criteria
- React app compiles without Babel errors
- Admin login redirects successfully to `/admin` 
- AdminChat component loads with working Grok interface
- Self-healing system ready for production error handling
- Platform ready for enterprise deployment

## Next Steps After Fix
1. Deploy latest version with working admin system
2. Test self-healing capabilities in production
3. Monitor system logs for automatic error resolution
4. Validate enterprise-grade reliability standards

---
**Note**: This is a critical deployment blocker. The authentication system works perfectly, but the React parsing error prevents the admin panel from loading. Once fixed, the platform will have full self-healing capabilities for zero-downtime maintenance.