# Forge Viewer Runtime Error - Script Error After Proxy Implementation

## Context
We implemented your comprehensive proxy solution to bypass CORS restrictions in the Forge Viewer. The implementation included:

1. **Backend Proxy Route** (`/proxy/forge/*`) that forwards all requests to Autodesk API
2. **Frontend Update** using `setEndpointAndApi('/proxy/forge', 'derivativeV2')`
3. **Global CORS headers** allowing all origins and methods

## Current Status
- ✅ Authentication works: Token generated successfully
- ✅ File upload works: 413MB RVT file uploaded in 2.8s
- ✅ Translation works: 100% complete, SVF generated
- ✅ Manifest loads: Successfully retrieved via proxy
- ✅ Viewer initializes: GuiViewer3D created successfully
- ❌ **Script Error**: Occurs immediately after manifest loads

## Error Details

### Console Output
```
Manifest check response: {
  "type": "manifest",
  "hasThumbnail": "true", 
  "status": "success",
  "progress": "complete",
  "region": "US",
  "urn": "dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6ZXN0aW1hdGUtdXNlci1hbm9ueW1vdXMtMTc1MjkyMDIzODE2Ni9yc3RiYXNpY3NhbXBsZXByb2plY3QucnZ0",
  "derivatives": [{
    "outputType": "svf",
    "status": "success",
    "progress": "complete"
  }]
}

getCdnRedirectUrl is deprecated and will be removed soon
Container has zero dimensions, setting minimum size

ERROR: Script error.
```

### Implementation Code

#### Backend Proxy Route
```typescript
// server/forge-api.ts
app.all('/proxy/forge/*', async (req, res) => {
  const targetPath = req.params[0];
  const targetUrl = `https://developer.api.autodesk.com/${targetPath}`;
  
  try {
    const token = await getAccessToken();
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': req.headers['content-type'] || 'application/json',
      'Accept': req.headers['accept'] || '*/*',
      'Accept-Encoding': 'gzip, deflate, br'
    };

    const axiosConfig: AxiosRequestConfig = {
      method: req.method as any,
      url: targetUrl,
      headers,
      params: req.query,
      data: req.body,
      responseType: targetPath.includes('.svf') || targetPath.includes('/meshes/') 
        ? 'arraybuffer' 
        : 'json',
      maxRedirects: 5,
      validateStatus: () => true
    };

    const response = await axios(axiosConfig);
    
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
      'Content-Type': response.headers['content-type'] || 'application/json'
    });
    
    res.status(response.status).send(response.data);
  } catch (error) {
    console.error('Forge proxy error:', error);
    res.status(500).json({ error: 'Proxy request failed' });
  }
});
```

#### Frontend Viewer Configuration
```typescript
// client/src/components/forge-viewer.tsx
// Set proxy endpoint to route through our server and bypass CORS
window.Autodesk.Viewing.endpoint.setEndpointAndApi('/proxy/forge', 'derivativeV2');
console.log('Set proxy endpoint to bypass CORS issues');

const options = {
  env: 'AutodeskProduction',
  api: 'derivativeV2',
  getAccessToken: (callback: (token: string, expires: number) => void) => {
    console.log('Providing access token to Forge viewer');
    callback(accessToken, 3600);
  },
  language: 'en',
  useADP: false,
  useConsolidation: true
};
```

## Questions for Grok

1. **Script Error After Manifest Load**: The viewer successfully loads the manifest through the proxy, but immediately throws a "Script error". This suggests the viewer is trying to load additional resources (SVF files, textures, etc.) but encountering issues. What could be causing this?

2. **Deprecated getCdnRedirectUrl Warning**: We see "getCdnRedirectUrl is deprecated" warning. Is this related to the proxy implementation? Should we handle CDN redirects differently?

3. **Proxy Path Handling**: Are we correctly handling all the different resource types the viewer needs? The manifest loads fine, but subsequent resources might be failing.

4. **Authentication Flow**: The viewer is getting the token correctly, but could there be an issue with how the proxy passes authentication for subsequent resource requests?

5. **Missing Headers**: Are there any specific headers the Forge Viewer expects that we might not be forwarding through the proxy?

## Test Environment
- Platform: Replit
- URN: `dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6ZXN0aW1hdGUtdXNlci1hbm9ueW1vdXMtMTc1MjkyMDIzODE2Ni9yc3RiYXNpY3NhbXBsZXByb2plY3QucnZ0`
- File: rstbasicsampleproject.rvt (413MB)
- Translation: Complete (SVF format)
- Browser: Chrome/Edge (tested on both)

## What We Need
Please help us understand why the viewer throws a "Script error" after successfully loading the manifest through the proxy. The proxy seems to work for the initial manifest request, but something fails when the viewer tries to load the actual model resources.

## Update: Enhanced Proxy Implementation
We've enhanced the proxy implementation with the following improvements:

1. **All HTTP Methods**: Changed from `app.get` to `app.all` to handle all request types
2. **Better Header Forwarding**: Including cache headers, ETags, and custom headers
3. **Redirect Handling**: Properly forwards Location headers for redirects
4. **Binary Detection**: Checks for SVF, meshes, materials, textures, and images paths
5. **Timeout and Error Handling**: 60-second timeout with detailed error responses

The enhanced proxy should now handle all Forge Viewer resource requests properly, including CDN redirects and binary assets.

## Testing
After implementing the enhanced proxy, we need to test if the Script error is resolved. The viewer should now be able to:
- Load the manifest ✓
- Load SVF geometry files through the proxy
- Load materials and textures
- Handle any CDN redirects automatically

Please review our implementation and let us know if there are any additional considerations for the Forge Viewer proxy setup in a Replit environment.

## Latest Implementation Update

We've now implemented the production-grade proxy solution with:

### Backend Proxy Enhancements
- **Stream-based responses** to handle large SVF files without memory issues
- **Dynamic domain detection** for developer API, CDN, and OTG services
- **Custom User-Agent** to avoid blocks
- **10 redirect support** for CDN handling
- **Header preservation** while removing problematic host/origin headers

### Global CORS Configuration
- Enhanced headers including Range, If-None-Match, If-Modified-Since
- Exposed headers for Content-Length, Content-Range, ETag, Last-Modified
- Support for HEAD method in addition to GET/POST/PUT/DELETE/OPTIONS

The proxy now handles all Autodesk domains:
- `https://developer.api.autodesk.com` for API calls
- `https://cdn.derivative.autodesk.com` for CDN resources
- `https://otg.autodesk.com` for OTG services

This implementation should resolve the Script error by properly handling all resource types including SVF geometry, materials, textures, and WASM files through streaming responses.