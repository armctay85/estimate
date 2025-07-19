# BIM Upload Error - Legacy Endpoint Deprecated

## Error Details
**Date**: January 19, 2025  
**File**: Snowdon Towers Sample Architectural.rvt (94.7MB)  
**Error Code**: 500 Internal Server Error  
**Error Message**: "File upload failed: Legacy endpoint is deprecated"

## Console Output
```javascript
// Client-side console
File selected: Snowdon Towers Sample Architectural.rvt 94691328
Starting upload with XMLHttpRequest...
Upload failed: 500 Internal Server Error {"error":"File upload failed: Legacy endpoint is deprecated"}

// Server-side logs
Processing Snowdon Towers Sample Architectural.rvt (94691328 bytes)
Forge token generated successfully, expires: 2025-07-19T07:55:37.588Z
Bucket estimate-user-anonymous-1752908438466 created successfully
Bucket estimate-user-anonymous-1752908438466 already exists
File upload failed: { reason: 'Legacy endpoint is deprecated' }
Forge upload error: Error: File upload failed: Legacy endpoint is deprecated
    at ForgeAPI.uploadFile (/home/runner/workspace/server/forge-api.ts:134:13)
```

## Current Implementation (server/forge-api.ts)
```typescript
// Line 109-134 in uploadFile method
const uploadUrl = `https://developer.api.autodesk.com/oss/v2/buckets/${bucketKey}/objects/${objectKey}`;
console.log(`Uploading to: ${uploadUrl}`);

const uploadResponse = await fetch(uploadUrl, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/octet-stream',
    'Content-Length': fileBuffer.length.toString()
  },
  body: fileBuffer
});

const responseText = await uploadResponse.text();
console.log(`Upload response status: ${uploadResponse.status}`);
console.log(`Upload response: ${responseText}`);

if (!uploadResponse.ok) {
  let errorData;
  try {
    errorData = JSON.parse(responseText);
  } catch {
    errorData = { message: responseText };
  }
  console.log('File upload failed:', errorData);
  throw new Error(`File upload failed: ${errorData.reason || errorData.message || responseText}`);
}
```

## Issue Summary
The Autodesk Forge API is returning "Legacy endpoint is deprecated" when trying to upload files using the OSS v2 endpoint. This suggests that Autodesk may have deprecated this upload method and requires using a newer API version or different upload approach.

## Potential Solutions
1. Update to use the latest Autodesk Platform Services (APS) API endpoints
2. Switch to the Data Management API v2 for file uploads
3. Use resumable upload endpoints for large files
4. Check if authentication method needs updating for newer API versions

## Note
This error is occurring in the live environment but not showing in testing, possibly due to:
- Different API versions between test and production
- Account-specific API access levels
- Regional API endpoint differences
- Recent Autodesk API changes not reflected in documentation