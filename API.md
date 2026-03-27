# EstiMate API Documentation

## Base URL
```
Production: https://api.estimate-app.com
Staging: https://api-staging.estimate-app.com
```

## Authentication
All API endpoints (except health checks) require authentication via JWT token.

```http
Authorization: Bearer <jwt_token>
```

## Health Endpoints

### GET /api/health
Returns system health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-28T05:15:00.000Z",
  "version": "1.0.0",
  "database": "connected",
  "uptime": 3600
}
```

### GET /api/health/ready
Readiness probe for Kubernetes.

### GET /api/health/live
Liveness probe for Kubernetes.

## Projects

### GET /api/projects
List all projects for authenticated user.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)

**Response:**
```json
{
  "projects": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### POST /api/projects
Create a new project.

**Body:**
```json
{
  "name": "Kmart Gladstone Refit",
  "location": "Gladstone, QLD",
  "buildingType": "retail_fitout"
}
```

## Cost Database

### GET /api/elements
Search construction elements.

**Query Parameters:**
- `search` (string): Search term
- `category` (string): Filter by category
- `region` (string): Region code (e.g., 'sydney_nsw')

### GET /api/elements/:id/rates
Get cost rates for an element.

**Query Parameters:**
- `region` (string): Region code
- `buildingType` (string): Building type
- `quality` (string): Quality level

**Response:**
```json
{
  "elementId": 1,
  "elementCode": "EL201",
  "elementName": "LED downlight 12W dimmable",
  "rates": {
    "low": 72.25,
    "median": 85.00,
    "high": 97.75
  },
  "region": "sydney_nsw",
  "confidence": 0.85
}
```

### POST /api/costs/estimate
Calculate cost estimate.

**Body:**
```json
{
  "elementId": 1,
  "quantity": 50,
  "region": "sydney_nsw",
  "buildingType": "retail_fitout",
  "quality": "standard"
}
```

**Response:**
```json
{
  "element": {...},
  "quantity": 50,
  "rate": 97.75,
  "total": 4887.50,
  "region": "sydney_nsw",
  "confidence": "high"
}
```

## PDF Takeoff

### POST /api/projects/:id/takeoffs
Upload PDF for takeoff.

**Body:** Multipart form data
- `file`: PDF file (max 50MB)

### GET /api/takeoffs/:id
Get takeoff with measurements.

### POST /api/takeoffs/:id/measurements
Add measurement to takeoff.

**Body:**
```json
{
  "type": "area",
  "points": [{"x": 100, "y": 100}, {"x": 200, "y": 100}, ...],
  "elementType": "floor",
  "pageNumber": 1
}
```

## Quote Validation

### POST /api/quotes/validate
Upload and validate a quote.

**Body:** Multipart form data
- `file`: PDF/Excel quote file
- `projectType` (string): Type of project

**Response:**
```json
{
  "trustScore": 78,
  "lineItems": [...],
  "flags": [...],
  "totalVariance": 0.12
}
```

## Tender Analysis

### POST /api/tenders/analyze
Analyze tender against benchmarks.

**Body:**
```json
{
  "tenderData": [...],
  "region": "sydney_nsw",
  "buildingType": "retail_fitout"
}
```

**Response:**
```json
{
  "trustScore": 82,
  "variance": 0.08,
  "lineItems": [...],
  "recommendations": [...]
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Invalid input data",
  "details": {...}
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### 429 Rate Limited
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded",
  "retryAfter": 60
}
```

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| /api/auth/* | 10 | 15 minutes |
| /api/* | 100 | 15 minutes |
| /api/upload | 5 | 1 hour |

## Webhooks

### Stripe Webhooks
Endpoint: `POST /api/webhooks/stripe`

Events:
- `invoice.paid`: Subscription payment received
- `invoice.payment_failed`: Payment failed
- `customer.subscription.deleted`: Subscription cancelled
