# Forge Viewer Error Analysis - January 19, 2025

## Current Error (PERSISTING)
```
Document load error - Code: 7, Message: "Error: 0 ()"
Failed to fetch resource: urn:dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6ZXN0aW1hdGUtdXNlci1hbm9ueW1vdXMtMTc1MjkxNzY5MTkyOS9yc3RiYXNpY3NhbXBsZXByb2plY3QucnZ0
```

## Latest Test Results (9:38 AM)
- File uploaded successfully
- Translation completed successfully  
- Viewer initialized properly
- **ERROR PERSISTS**: Same Code 7 error when loading document with "urn:" prefix

## Error Code 7 Meaning
According to the Forge Viewer documentation, error code 7 means "File type not supported". However, this is misleading because we're uploading a valid .rvt file.

## Root Cause Analysis
The actual issue is with the URN format being passed to `Autodesk.Viewing.Document.load()`. Currently, we're passing:
```
urn:dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6ZXN0aW1hdGUtdXNlci1hbm9ueW1vdXMtMTc1MjkxNjg5NTA5My9yc3RiYXNpY3NhbXBsZXByb2plY3QucnZ0
```

This is incorrect. The base64 URN should NOT have "urn:" prefix when passed to Document.load().

## The Confusion
1. The server returns a base64-encoded URN: `dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6ZXN0aW1hdGUtdXNlci1hbm9ueW1vdXMtMTc1MjkxNjg5NTA5My9yc3RiYXNpY3NhbXBsZXByb2plY3QucnZ0`
2. We added "urn:" prefix thinking it was required
3. But Autodesk.Viewing.Document.load() expects JUST the base64 string without any prefix

## Recommended Fix
In `client/src/components/forge-viewer.tsx`, we need to REMOVE the URN prefix logic:

```javascript
// CURRENT (INCORRECT):
const formattedUrn = urn.startsWith('urn:') ? urn : `urn:${urn}`;
window.Autodesk.Viewing.Document.load(formattedUrn, ...);

// SHOULD BE:
// Just use the base64 URN directly without any prefix
window.Autodesk.Viewing.Document.load(urn, ...);
```

## Evidence from Logs
1. Server correctly returns base64 URN without prefix
2. Translation completes successfully
3. Document load fails when we add "urn:" prefix
4. The error "Failed to fetch resource" shows it's trying to fetch with the wrong URN format

## Additional Observations
- The viewer initializes correctly
- The access token is valid
- The translation is complete
- Only the document loading step fails due to URN format

## Updated Analysis After Testing

### Test Results Show Error Persists
Even with the "urn:" prefix added (which was our attempted fix), the error continues:
- Same error code 7
- Same "Failed to fetch resource" message
- Document.load() is still failing

### This Indicates a Different Root Cause
Since the error persists regardless of URN format, the issue is likely:

1. **Access Token Scope Issue**: The viewer token might not have the correct scope for viewing translated models
2. **Translation Format Mismatch**: The viewer might be trying to load SVF2 format when translation created SVF (or vice versa)
3. **CORS/Network Issue**: The Forge CDN might be blocking requests from Replit's domain
4. **Bucket Permissions**: The bucket might not have the correct permissions for viewer access

### Evidence from Latest Logs
```
1752917886044.0 - ["Formatted URN for document load:","urn:dXJu..."]
1752917931079.0 - ["Failed to fetch resource: urn:dXJu..."]
1752917931079.0 - ["Document load error - Code:",7,"Message:","Error: 0 ()"]
```

### Next Debugging Steps Needed
1. Check network tab for actual HTTP response codes (401, 403, 404?)
2. Verify access token has "viewables:read" scope
3. Test with both URN formats (with and without "urn:" prefix)
4. Check if translation output format matches viewer configuration
5. Verify the viewer token endpoint returns proper scope

## Conclusion
The URN prefix is likely NOT the root cause. The error persists with both formats, suggesting an authentication, permission, or format mismatch issue that needs deeper investigation.