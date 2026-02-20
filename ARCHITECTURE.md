# Architecture Documentation - Happy Backend

## System Overview

Happy Backend is a secure, scalable WebSocket-based game server for Godot games, with a focus on child safety and parental controls.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Godot Game Clients                           │
│        (Connect via WebSocket with JWT authentication)          │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NestJS Application                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ HTTP REST API + WebSocket Gateway                        │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ Authentication         Game Logic         User Management│   │
│  │  • JWT Strategy        • State Sync       • Profiles     │   │
│  │  • Argon2 Hashing      • Level Tracking  • Parent Link   │   │
│  │  • Play Tokens         • Item Collection • Verification  │   │
│  │  • Parental Controls   • Score Tracking  • Activity Logs │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Prisma ORM Layer                                   │
│  • User Management                                              │
│  • Game State Persistence                                       │
│  • Session Tracking                                             │
│  • Activity Logging                                             │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│              MongoDB Database                                   │
│  • User Collection (Adults & Children)                          │
│  • GameProfile Collection (State & Progression)                 │
│  • LevelData Collection (Configuration)                         │
│  • ParentContact Collection (Verification Data)                 │
│  • UserSession Collection (Token Management)                    │
│  • ActivityLog Collection (Monitoring)                          │
│  • WebSocketConnection Collection (Live Tracking)               │
└─────────────────────────────────────────────────────────────────┘
```

## Module Structure

### `AuthModule` - Authentication & Authorization

**Responsibilities:**

- User registration (Adult/Child)
- Login & token generation
- JWT validation
- Argon2 password hashing
- Play token generation for parents
- WebSocket JWT authentication

**Key Classes:**

- `AuthService`: Core authentication logic
- `AuthController`: REST endpoints
- `JwtStrategy`: Passport JWT strategy
- `JwtAuthGuard`: HTTP JWT guard
- `WsJwtGuard`: WebSocket JWT guard

**Key Methods:**

```typescript
registerAdult(dto); // Register adult account
registerChild(dto); // Register child account with parent link
login(dto); // Authenticate user
hashPassword(password); // Argon2 hashing
verifyPassword(pwd, hash); // Password verification
generateToken(user); // JWT token generation
validateToken(token); // Token validation & session check
```

### `UsersModule` - User Management & Profiles

**Responsibilities:**

- User profile retrieval & management
- Game profile updates
- Parental contact creation & verification
- Play token generation & verification
- Account deactivation
- Activity log tracking

**Key Classes:**

- `UsersService`: User data management
- `UsersController`: REST endpoints

**Key Methods:**

```typescript
getUserProfile(userId); // Get profile with game progress
updateGameProfile(userId, data); // Update game settings
createParentContact(data); // Create parent verification record
verifyParentContact(id, code); // Verify parent identity
generatePlayToken(userId); // Generate child play token
verifyChildWithToken(childId, token); // Activate child account
getUserActivityLogs(userId, limit); // Get user activity history
```

### `GameModule` - Game Logic & WebSocket

**Responsibilities:**

- Real-time state synchronization
- Item collection validation against level constraints
- Level completion tracking
- Game state offline-to-online sync
- WebSocket connection management
- Heartbeat monitoring

**Key Classes:**

- `GameService`: Game logic engine
- `GameController`: REST endpoints
- `GameGateway`: WebSocket gateway
- `GameModule`: Module definition

**Key Methods:**

```typescript
getLevelData(levelId); // Retrieve level configuration
validateItemCollection(userId, payload); // Validate item collection
handleItemCollection(userId, payload); // Process item collection
handleLevelComplete(userId, payload); // Handle level completion
syncGameState(userId, syncData); // Sync offline changes
```

### `PrismaModule` - Database Access

**Responsibilities:**

- Prisma Client initialization
- Connection lifecycle management
- Service injection

**Key Classes:**

- `PrismaService`: Prisma Client wrapper
- `PrismaModule`: Module definition

## Authentication Flow

### Adult Registration

```
POST /auth/register-adult
├─ Validate input (email, password, fullName)
├─ Check email uniqueness
├─ Hash password with Argon2
├─ Create User (ADULT role)
├─ Create GameProfile (default settings)
├─ Generate JWT token
├─ Create UserSession
├─ Log REGISTRATION activity
└─ Return user + token
```

### Child Registration

```
POST /auth/register-child
├─ Validate input (age <= 15)
├─ Check email uniqueness
├─ (Optional) Link to parent contact
├─ Hash password with Argon2
├─ Create User (CHILD role)
├─ Create GameProfile (MILD restrictions)
├─ Set isVerifiedByParent based on parent link
├─ Generate JWT token
├─ Create UserSession
├─ Log REGISTRATION activity
└─ Return user + token
```

### Login Flow

```
POST /auth/login
├─ Validate credentials
├─ Find user by email
├─ Verify Argon2 password
├─ Check user.isActive
├─ Generate new JWT token
├─ Create new UserSession
├─ Log LOGIN activity
└─ Return user + token
```

### WebSocket Connection

```
socket.connect(auth: { token })
├─ Extract token from auth header
├─ Validate JWT signature
├─ Check session existence & expiration
├─ Attach user to socket.data
├─ Create WebSocketConnection record
├─ Emit connection_established
└─ Ready for events
```

## Game State Management

### Item Collection Flow

```
WebSocket: item_collected
├─ Extract userId & payload
├─ Get level configuration
├─ Validate:
│  ├─ Item index < maxItems
│  ├─ Item not already collected
│  └─ Collection count < maxItems
├─ Update gameProfile.levelsData
├─ Update gameProfile.totalPlayTime
├─ Log ITEM_COLLECTED activity
├─ Broadcast to all players
└─ Send success/failure response
```

### Level Completion Flow

```
WebSocket: level_complete
├─ Extract userId & payload (levelId, score, timeSpent)
├─ Mark level as completed in levelsData
├─ Add score to totalScore
├─ Advance currentLevel if needed
├─ Update totalPlayTime
├─ Log LEVEL_COMPLETED activity
├─ Broadcast achievement
└─ Return updated game profile
```

### Game State Sync (Offline→Online)

```
PATCH /game/sync
├─ Extract userId & syncData
├─ Get current gameProfile
├─ Merge offline changes:
│  ├─ Update levelsData
│  ├─ Update inventory
│  ├─ Update missions
│  └─ Update achievements
├─ Validate all updates
├─ Update gameProfile
├─ Set pendingSync = false
├─ Update lastSyncAt
├─ Log GAME_STATE_SYNCED activity
└─ Return merged game profile
```

## Data Models

### User Model

```typescript
{
  id: ObjectId               // Unique identifier
  email: string              // Unique, required
  password: string           // Argon2 hashed
  fullName: string           // Sensitive data
  role: UserRole             // ADULT | CHILD

  // Sensitive Data
  physicalAddress?: string
  age?: number               // 1-15 for children

  // Child Account Linkage
  parentContactId?: ObjectId // Reference to parent

  // Parental Control
  isVerifiedByParent: boolean // Initially true for ADULT
  playTokens: string[]       // Generated by parent for child

  // Account Status
  isActive: boolean          // Soft delete
  createdAt: Date
  updatedAt: Date

  // Relations
  gameProfile: GameProfile
  sessions: UserSession[]
  activityLog: ActivityLog[]
}
```

### GameProfile Model

```typescript
{
  id: ObjectId; // Unique identifier
  userId: ObjectId; // Unique relation to User

  // Game Options
  language: string; // Default "ar" (Arabic)
  soundEnabled: boolean;
  musicEnabled: boolean;
  contentRestriction: ContentRestriction; // NONE|MILD|MODERATE|STRICT

  // Game Progression
  currentLevel: number;
  totalScore: number;
  totalPlayTime: number; // in seconds

  // Deeply Nested Game State (JSON)
  levelsData: object; // { level_1: {chocolatesTaken, eggsTaken, ...} }
  inventory: object; // Collected items
  missions: object; // Mission progress
  achievements: object; // Unlocked achievements

  // Sync Management
  pendingSync: boolean; // Offline changes pending
  lastSyncAt: Date;
  lastPlayedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}
```

### LevelData Model

```typescript
{
  id: ObjectId; // Unique identifier
  levelId: number; // Unique, sequential
  levelName: string;
  maxChocolates: number; // Default 30
  maxEggs: number; // Default 20
  totalElements: number;
  difficulty: string; // easy|medium|hard
  createdAt: Date;
  updatedAt: Date;
}
```

### ParentContact Model

```typescript
{
  id: ObjectId              // Unique identifier
  parentName: string
  parentPhone: string
  parentEmail: string
  verificationCode: string
  isVerified: boolean
  verifiedAt?: Date
  createdAt: Date
  updatedAt: Date

  // Relations
  childUsers: User[]        // Inverse relation
}
```

### UserSession Model

```typescript
{
  id: ObjectId; // Unique identifier
  userId: ObjectId; // Reference to User
  token: string; // Unique JWT token
  expiresAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### ActivityLog Model

```typescript
{
  id: ObjectId              // Unique identifier
  userId: ObjectId          // Reference to User
  action: string            // LOGIN, REGISTRATION, ITEM_COLLECTED, etc.
  details: object           // Additional metadata
  ipAddress?: string        // For security monitoring
  userAgent?: string
  createdAt: Date
}
```

### WebSocketConnection Model

```typescript
{
  id: ObjectId              // Unique identifier
  userId: ObjectId          // Reference to User
  socketId: string          // Unique per connection
  connectedAt: Date
  disconnectedAt?: Date
  lastHeartbeat: Date
}
```

## Security Features

### Password Security

- **Hashing**: Argon2 with configurable memory/time/parallelism
- **Salting**: Automatic via Argon2
- **Never stored**: Plain passwords never stored or logged

### JWT Security

- **Secret**: Environment variable, not hardcoded
- **Expiration**: Default 7 days
- **Validation**: Token signature + session check
- **Refresh**: New token on each login

### Parental Controls

1. **Age Verification**: Children < 16 require parent contact
2. **Parent Verification**: Email/code confirmation
3. **Play Tokens**: Parent generates, child uses to unlock features
4. **Content Restriction**: 4 levels of content filtering
5. **Account Lockdown**: Parent can deactivate child account

### API Security

- **CORS**: Configurable origin validation
- **Rate Limiting**: 100 requests per 15 minutes
- **Helmet**: Security headers (CSP, X-Frame-Options, etc.)
- **Input Validation**: Class-validator on all DTOs
- **SQL Injection**: N/A (MongoDB, but field injection prevented)

### Data Protection

- **Sensitive Data**: Sanitized in responses (no passwords)
- **Encryption**: At-rest (MongoDB Enterprise) or in transit (HTTPS/WSS)
- **Activity Logs**: Track all user actions for audit
- **Soft Delete**: Users marked inactive, not deleted

## Error Handling

### HTTP Error Responses

```json
{
  "statusCode": 400|401|403|404|409|500,
  "message": "Human-readable error message",
  "error": "BadRequest|Unauthorized|Forbidden|NotFound|Conflict|InternalServerError"
}
```

### WebSocket Error Responses

```json
{
  "error": "Error message",
  "code": "EventName_Failed",
  "details": {}
}
```

## Performance Considerations

### Database Indexing

- `User.email`: Unique index (fast login)
- `User.parentContactId`: Index (query children by parent)
- `GameProfile.userId`: Unique index (1:1 relation)
- `UserSession.token`: Unique index (fast validation)
- `ActivityLog.userId`: Index (activity queries)
- `WebSocketConnection.socketId`: Unique index

### Caching Strategy

- JWT tokens validated via session lookup (not cached)
- Level data static (cache with Prisma or Redis)
- User profiles: Load on login, update on sync

### Query Optimization

- Include relations strategically
- Limit activity logs to recent entries
- Paginate user listings

## Monitoring & Logging

### Activity Tracking

- User registrations and logins
- Item collections (prevent cheating)
- Level completions (verify progress)
- Game state syncs (detect anomalies)
- Account changes

### Real-time Monitoring

- WebSocket connections/disconnections
- Failed authentication attempts
- Rate limit violations
- Database connection health

### Metrics

- Active user count
- Concurrent WebSocket connections
- Average response times
- Database query times

## Deployment

### Environment Variables

```bash
# Database
DATABASE_URL=mongodb+srv://...

# JWT
JWT_SECRET=<strong-random-string>
JWT_EXPIRATION=7d

# Argon2
ARGON2_MEMORY=65540
ARGON2_TIME=3
ARGON2_PARALLELISM=4

# Server
PORT=3000
NODE_ENV=production

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=https://yourdomain.com
```

### Production Checklist

- [ ] Set strong JWT_SECRET
- [ ] Use MongoDB Atlas (managed MongoDB)
- [ ] Enable HTTPS/WSS
- [ ] Configure firewall rules
- [ ] Set up monitoring & alerts
- [ ] Enable database backups
- [ ] Configure rate limiting per endpoint
- [ ] Use environment-specific settings
- [ ] Enable CORS for specific origins only
- [ ] Implement request logging
- [ ] Set up error tracking (Sentry)
- [ ] Configure auto-scaling

## Future Enhancements

1. **Email Verification**: Send confirmation emails
2. **Social Features**: Friend lists, messaging
3. **Leaderboards**: Global/friend rankings
4. **Analytics**: Dashboard for game metrics
5. **Admin Panel**: Manage users, levels, reports
6. **Mobile Push**: Notifications for achievements
7. **Payment Processing**: In-app purchases
8. **CDN Integration**: Asset delivery optimization
9. **Caching Layer**: Redis for hot data
10. **Advanced Reporting**: Detailed player analytics
