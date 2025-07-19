# Grok's Final Analysis and Fix Recommendations

## Current Situation
- URN prefix issue identified but error persists
- Error Code 7 continues regardless of URN format
- Translation completes successfully but viewer fails to load document

## Grok's Complete Fix Implementation

### 1. Remove URN Prefix (Already Confirmed)
The base64 URN should be passed directly without "urn:" prefix:

```javascript
// CORRECT - Pass URN directly
window.Autodesk.Viewing.Document.load(urn, ...);
```

### 2. Fix Access Token Implementation
Grok identified that the `getAccessToken` callback needs proper format:

```javascript
getAccessToken: async (callback) => {
  try {
    const res = await fetch('/api/forge/token');
    const { access_token } = await res.json();
    // Must use callback function, not return
    callback(access_token, 3600);
  } catch (error) {
    console.error('Token fetch error:', error);
    callback('', 0); // Signal error
  }
}
```

### 3. Verify Token Scope
Check that the server token includes proper scope:

```javascript
// In server/forge-api.ts
const response = await fetch('https://developer.api.autodesk.com/authentication/v2/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'client_credentials',
    scope: 'data:read data:write bucket:create bucket:delete viewables:read', // Must include viewables:read
  })
});
```

### 4. Complete Viewer Implementation per Grok

```javascript
// client/src/components/forge-viewer.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function ForgeViewer({ urn, fileName, onClose }) {
  const viewerRef = useRef(null);
  const [loadStatus, setLoadStatus] = useState('Initializing viewer...');
  const [error, setError] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!urn) {
      setError('No URN provided');
      return;
    }

    let viewer = null;

    const loadViewer = async () => {
      try {
        // Load Viewer script
        if (!window.Autodesk) {
          const script = document.createElement('script');
          script.src = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js';
          script.async = false;
          
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.type = 'text/css';
          link.href = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css';
          
          document.head.appendChild(link);
          document.head.appendChild(script);
          
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
          });
        }

        const options = {
          env: 'AutodeskProduction',
          api: 'derivativeV2', // Use derivativeV2 for SVF
          getAccessToken: async (callback) => {
            try {
              const res = await fetch('/api/forge/token');
              const { access_token } = await res.json();
              callback(access_token, 3600);
            } catch (error) {
              console.error('Token error:', error);
              callback('', 0);
            }
          }
        };

        // Initialize viewer
        window.Autodesk.Viewing.Initializer(options, () => {
          const container = viewerRef.current;
          viewer = new window.Autodesk.Viewing.GuiViewer3D(container);
          
          // Start viewer
          const startResult = viewer.start();
          if (startResult > 0) {
            throw new Error(`Viewer failed to start: ${startResult}`);
          }

          // Add progress listener
          viewer.addEventListener(window.Autodesk.Viewing.PROGRESS_UPDATE_EVENT, (e) => {
            setLoadStatus(`Loading model: ${Math.round(e.percent)}%`);
          });

          // Add error listener
          viewer.addEventListener(window.Autodesk.Viewing.VIEWER_ERROR_EVENT, (e) => {
            console.error('Viewer error:', e);
            toast({
              title: "Viewer Error",
              description: e.message || "Unknown viewer error",
              variant: "destructive"
            });
          });

          // Load document - NO URN PREFIX
          setLoadStatus('Loading document...');
          window.Autodesk.Viewing.Document.load(
            urn, // Pass URN directly without prefix
            (doc) => {
              // Success
              const viewables = doc.getRoot().getDefaultGeometry();
              if (!viewables) {
                throw new Error('No viewable geometry found');
              }
              
              viewer.loadDocumentNode(doc, viewables).then(() => {
                setLoadStatus('');
                toast({
                  title: "Model Loaded",
                  description: `${fileName} loaded successfully`,
                });
              }).catch((err) => {
                throw new Error(`Failed to load model: ${err.message}`);
              });
            },
            (errorCode, errorMsg) => {
              // Failure
              const errors = {
                1: 'Network error',
                4: 'Invalid URN',
                7: 'File type not supported or translation incomplete',
                10: 'Token error',
                12: 'Unauthorized'
              };
              const message = errors[errorCode] || errorMsg;
              throw new Error(`Document load failed (${errorCode}): ${message}`);
            }
          );
        });
      } catch (err) {
        console.error('Viewer setup error:', err);
        setError(err.message);
        toast({
          title: "Failed to load viewer",
          description: err.message,
          variant: "destructive"
        });
      }
    };

    loadViewer();

    // Cleanup
    return () => {
      if (viewer) {
        viewer.tearDown();
        viewer.finish();
      }
    };
  }, [urn]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">
          <p className="font-semibold">Error loading model</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {loadStatus && (
        <div className="absolute top-4 left-4 bg-black/75 text-white px-4 py-2 rounded">
          {loadStatus}
        </div>
      )}
      <div ref={viewerRef} className="w-full h-full" />
    </div>
  );
}
```

### 5. Additional Debugging Steps

If error persists after implementing above:

1. **Check Network Tab**:
   - Look for failed requests to Autodesk CDN
   - Check for 401/403 errors indicating token issues
   - Look for CORS errors

2. **Verify Translation Format**:
   ```javascript
   // Check translation status endpoint response
   // Ensure output.formats contains SVF not SVF2
   ```

3. **Test Token Directly**:
   ```javascript
   // In browser console
   fetch('/api/forge/token').then(r => r.json()).then(console.log)
   // Verify token has correct format
   ```

4. **Check Bucket Permissions**:
   - Ensure bucket has public-read access if needed
   - Verify object was uploaded with correct permissions

## Summary

The key fixes are:
1. ✅ Remove URN prefix (pass base64 directly)
2. ✅ Fix getAccessToken to use callback properly
3. ✅ Ensure token has viewables:read scope
4. ✅ Add proper error handling and progress tracking
5. ✅ Use correct env/api settings for SVF format

This implementation follows Grok's exact specifications and should resolve the Code 7 error.