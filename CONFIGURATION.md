# 🎯 Configuration Reference - Happy Backend

## Environment Variables

### Required Variables
```env
# MongoDB Connection
DATABASE_URL="mongodb+srv://user:password@cluster.mongodb.net/happy-backend?retryWrites=true&w=majority"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRATION="7d"

# Server Configuration
PORT=3000
NODE_ENV="development|production"
```

### Optional Variables (Defaults Provided)
```env
# Argon2 Password Hashing
ARGON2_MEMORY=65540         # Default
ARGON2_TIME=3              # Default
ARGON2_PARALLELISM=4       # Default

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes (default)
RATE_LIMIT_MAX_REQUESTS=100    # Requests per window (default)

# CORS & WebSocket
CORS_ORIGIN="http://localhost:*"
WS_PORT=3001 (optional, uses same as PORT)
```

## Database Configuration

### MongoDB Connection String Format
```
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

### Connection Parameters
- **retryWrites**: true - Automatic retry for transient failures
- **w**: majority - Write acknowledgment from majority of replicas
- **authSource**: admin (usually default)

### MongoDB Atlas Setup
1. Create cluster at mongodb.com
2. Create database user with password
3. Whitelist IP addresses
4. Get connection string
5. Add to .env as DATABASE_URL

### Local MongoDB (Development)
```bash
# Using docker-compose (recommended)
docker-compose up mongodb

# Or local MongoDB instance
mongod --dbpath /path/to/data
```

Connection string: `mongodb://localhost:27017/happy-backend`

## Prisma Configuration

### Schema Location
- File: `prisma/schema.prisma`
- Contains 7 models for complete game backend

### Client Generation
```bash
npm run prisma:generate
```

Creates: `node_modules/@prisma/client`

### Database Migrations
```bash
# Create migration
npm run prisma:migrate -- --name description

# Inspect migration status
npx prisma migrate status

# Seed initial data
npm run prisma:seed
```

## JWT Configuration

### Token Payload
```json
{
  "sub": "userId",
  "email": "user@example.com",
  "role": "ADULT|CHILD",
  "iat": 1234567890,
  "exp": 1234654290
}
```

### Token Expiration
- Default: 7 days
- Configurable via JWT_EXPIRATION
- Session tracked in database with expiration

### Token Validation
```
1. Extract token from Authorization header
2. Verify JWT signature with JWT_SECRET
3. Check token in UserSession table
4. Verify session is active and not expired
5. Return payload if valid, null if invalid
```

## Argon2 Configuration

### Hashing Parameters
```typescript
{
  memoryCost: 65540,    // Memory usage (KiB)
  timeCost: 3,         // Time cost (iterations)
  parallelism: 4       // Parallel threads
}
```

### Security Levels
```
Current: Balanced (65540 memory, 3 time, 4 parallelism)
Higher Security: Increase memory & time (slower hash)
Faster: Decrease memory & time (less secure)
```

### Password Storage
- Stored as Argon2 hash (not plaintext)
- Hash includes salt (random per password)
- Verified using argon2.verify()

## Rate Limiting Configuration

### Current Settings
- **Window**: 15 minutes (900,000 ms)
- **Max Requests**: 100 per window
- **Applied To**: All routes globally

### Customization
```env
# Stricter (50 requests per hour)
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_MAX_REQUESTS=50

# Lenient (200 requests per hour)
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_MAX_REQUESTS=200
```

### Response When Limited
```json
{
  "statusCode": 429,
  "message": "Too many requests, please try again later.",
  "error": "TooManyRequests"
}
```

## CORS Configuration

### Default Configuration
```
Origin: http://localhost:*
Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Headers: Content-Type, Authorization
```

### Production Configuration
```env
CORS_ORIGIN="https://yourdomain.com"
```

### Multiple Origins (Advanced)
Modify in `src/main.ts`:
```typescript
app.enableCors({
  origin: [
    'https://domain1.com',
    'https://domain2.com',
    'https://domain3.com'
  ]
});
```

## Security Configuration

### Helmet (HTTP Headers)
```
- Content Security Policy (CSP)
- X-Frame-Options (Clickjacking protection)
- X-Content-Type-Options (MIME sniffing)
- Strict-Transport-Security (HTTPS enforcement)
- X-XSS-Protection (XSS protection)
- Referrer-Policy (Referrer control)
```

### HTTPS/WSS (Production)
All connections should use:
- HTTPS for HTTP/REST APIs
- WSS for WebSocket connections

## Parental Control Configuration

### Child Account Rules
- Age must be < 16
- Parent contact required
- Requires email verification
- Play token needed for unlocking features

### Content Restrictions
```typescript
enum ContentRestriction {
  NONE       // No restrictions (adults)
  MILD       // Mild filtering (default for children)
  MODERATE   // Stricter filtering
  STRICT     // Maximum filtering
}
```

## Logging Configuration

### Log Types
1. **Activity Logs**: User actions (login, items collected, etc.)
2. **Error Logs**: HTTP errors, exceptions
3. **Console Logs**: Development output

### Activity Log Actions
```
- REGISTRATION: New account created
- LOGIN: User authenticated
- ITEM_COLLECTED: Item picked up in game
- LEVEL_COMPLETED: Level finished
- GAME_STATE_SYNCED: Offline changes synced
- ACCOUNT_DEACTIVATED: Account disabled
```

## WebSocket Configuration

### Namespace
```
/game
```

### Connection Authentication
```javascript
const socket = io('ws://localhost:3000/game', {
  auth: {
    token: 'JWT_TOKEN_HERE'
  }
});
```

### Heartbeat Configuration
- Interval: Client-driven (on-demand)
- Response: Server responds immediately
- Purpose: Keep connection alive, detect stale connections

## Development Configuration

### Environment
```env
NODE_ENV=development
```

### Hot Reload
```bash
npm run start:dev
# Automatically rebuilds and restarts on file changes
```

### Debug Mode
```bash
npm run start:debug
# Starts debugger on port 9229
# Connect with chrome://inspect
```

### Source Maps
- Enabled by default in development
- Maps compiled .js back to .ts for debugging

## Production Configuration

### Environment
```env
NODE_ENV=production
JWT_SECRET="use-strong-random-string-from-secrets-manager"
DATABASE_URL="use-managed-mongodb-atlas"
```

### Build
```bash
npm run build
npm run start:prod
```

### Optimization
- No source maps in production
- Tree-shaking enabled
- Minification enabled
- Smaller bundle size

## Docker Configuration

### Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
COPY prisma ./prisma
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### Docker Compose
```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: ${DATABASE_URL}
  
  mongodb:
    image: mongo:7.0
    ports:
      - "27017:27017"
```

### Building & Running
```bash
# Build image
docker build -t happy-backend .

# Run container
docker run -e DATABASE_URL="..." -p 3000:3000 happy-backend

# Or with Docker Compose
docker-compose up
```

## Database Backup Configuration

### Automated Backups (MongoDB Atlas)
- Enable automated backups (default: daily)
- 35-day backup retention
- Point-in-time recovery

### Manual Backup
```bash
# Export database
mongodump --uri "mongodb+srv://..." --out ./backup

# Restore database
mongorestore --uri "mongodb+srv://..." ./backup
```

## Monitoring Configuration

### Health Check
```
GET /health
Response: { "status": "ok" }
```

### Metrics to Monitor
1. Database connection pool
2. WebSocket connections
3. Request latency
4. Error rate
5. User registration rate
6. Game state sync success rate

### Alert Thresholds
- Error rate > 5%
- Response time > 1s
- Database connection failures
- WebSocket disconnection spikes

## Troubleshooting Configuration Issues

### "MongoDB connection timeout"
- Check DATABASE_URL
- Verify IP whitelist in MongoDB Atlas
- Test network connectivity

### "JWT token invalid"
- Check JWT_SECRET matches between registration and login
- Verify token not expired
- Check session exists in database

### "CORS error"
- Update CORS_ORIGIN in .env
- Include protocol (http:// or https://)
- Check WebSocket namespace

### "Rate limit exceeded"
- Increase RATE_LIMIT_MAX_REQUESTS
- Increase RATE_LIMIT_WINDOW_MS
- Or wait for window to reset

## Configuration Files Summary

| File | Purpose |
|------|---------|
| .env | Runtime configuration (secrets) |
| .env.example | Configuration template |
| prisma.config.ts | Prisma settings |
| nest-cli.json | NestJS compiler |
| tsconfig.json | TypeScript settings |
| src/config/config.ts | App configuration |
| docker-compose.yml | Container setup |
| Dockerfile | Container image |

---

For detailed setup instructions, see IMPLEMENTATION.md
For quick start, see QUICKSTART.md
