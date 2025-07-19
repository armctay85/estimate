# Forge Viewer Error Analysis - January 19, 2025

## Current Error
```
Document load error - Code: 7, Message: "Error: 0 ()"
Failed to fetch resource: urn:dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6ZXN0aW1hdGUtdXNlci1hbm9ueW1vdXMtMTc1MjkxNjg5NTA5My9yc3RiYXNpY3NhbXBsZXByb2plY3QucnZ0
```

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

## Conclusion
The fix is simple: remove the URN prefix logic and pass the base64 URN directly to Document.load(). The Forge API expects the base64 string as-is, without any "urn:" prefix.