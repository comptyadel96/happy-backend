# 🎮 Happy Backend - Godot Game Server

An advanced NestJS game backend for Godot with MongoDB, WebSockets, JWT authentication, and comprehensive parental controls. Supports both adult and child accounts with safety-first design.

## 🛠 Tech Stack

- **Framework**: NestJS 11
- **Database**: MongoDB with Prisma ORM
- **Real-time**: Socket.io WebSockets
- **Authentication**: JWT with Passport.js
- **Password Security**: Argon2 hashing
- **Validation**: Class-validator
- **Middleware**: Helmet, Rate Limiting

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
npm install

# Configure environment variables
# Copy .env.example to .env and update MongoDB connection string
cp .env.example .env

# Setup database (generate Prisma client, run migrations, seed data)
npm run db:setup

# Start development server
npm run start:dev
```

### Development Server

```bash
# Watch mode (recommended)
npm run start:dev

# Debug mode
npm run start:debug

# Production build
npm run build
npm run start:prod
```

## 📋 API Endpoints

### Authentication

#### Register Adult User
```http
POST /auth/register-adult
Content-Type: application/json

{
  "email": "parent@example.com",
  "password": "SecurePassword123",
  "fullName": "John Doe",
  "physicalAddress": "123 Main St, City, Country"
}
```

#### Register Child User
```http
POST /auth/register-child
Content-Type: application/json

{
  "email": "child@example.com",
  "password": "ChildPass123",
  "fullName": "Jane Doe",
  "age": 10,
  "parentContactId": "parent-contact-id-optional"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}

Response:
{
  "user": { ... },
  "token": "eyJhbGc..."
}
```

### User Management

#### Get User Profile
```http
GET /users/profile
Authorization: Bearer {token}
```

#### Update Game Profile
```http
PATCH /users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "language": "ar",
  "soundEnabled": true,
  "musicEnabled": true,
  "contentRestriction": "MILD"
}
```

#### Get Activity Logs
```http
GET /users/activity-logs?limit=50
Authorization: Bearer {token}
```

#### Generate Play Token (Parent)
```http
POST /users/play-token/generate
Authorization: Bearer {token}

Response:
{
  "token": "unique-play-token"
}
```

#### Verify Child with Play Token
```http
POST /users/play-token/verify
Authorization: Bearer {token}
Content-Type: application/json

{
  "token": "unique-play-token"
}
```

### Game Management

#### Get Level Data
```http
GET /game/level/{levelId}
Authorization: Bearer {token}
```

#### Collect Item (REST endpoint)
```http
PATCH /game/item-collect
Authorization: Bearer {token}
Content-Type: application/json

{
  "levelId": 1,
  "itemType": "chocolate",
  "itemIndex": 5
}
```

#### Complete Level
```http
PATCH /game/level-complete
Authorization: Bearer {token}
Content-Type: application/json

{
  "levelId": 1,
  "score": 250,
  "timeSpent": 180
}
```

#### Sync Game State (Offline to Online)
```http
PATCH /game/sync
Authorization: Bearer {token}
Content-Type: application/json

{
  "levelsData": { ... },
  "inventory": { ... },
  "missions": { ... },
  "achievements": { ... },
  "totalScore": 1500,
  "totalPlayTime": 3600
}
```

## 🔌 WebSocket Events

Connect to `ws://localhost:3000/game` with token in auth header.

### Client → Server Events

#### Heartbeat
```javascript
socket.emit('heartbeat', {}, (response) => {
  console.log('Heartbeat response:', response);
});
```

#### Player Move
```javascript
socket.emit('player_move', {
  levelId: 1,
  x: 100,
  y: 200
});
```

#### Item Collection
```javascript
socket.emit('item_collected', {
  levelId: 1,
  itemType: 'chocolate', // or 'egg'
  itemIndex: 5
});
```

#### Level Complete
```javascript
socket.emit('level_complete', {
  levelId: 1,
  score: 250,
  timeSpent: 180
});
```

#### Game State Sync
```javascript
socket.emit('game_sync', {
  levelsData: { ... },
  inventory: { ... },
  missions: { ... },
  achievements: { ... },
  totalScore: 1500,
  totalPlayTime: 3600
});
```

### Server → Client Events

- `connection_established`: Initial connection confirmation
- `heartbeat_response`: Heartbeat response
- `player_moved`: Broadcast when another player moves
- `item_collected`: Broadcast when item is collected
- `item_collection_success`: Confirmation of item collection
- `item_collection_failed`: Item collection failed (validation error)
- `level_completed`: Broadcast when level is completed
- `level_complete_success`: Confirmation of level completion
- `sync_success`: Game state synced successfully
- `sync_failed`: Game state sync failed

## 🔐 Security Features

### Authentication & Authorization
- ✅ JWT token-based authentication
- ✅ Argon2 password hashing
- ✅ Refresh token support
- ✅ Role-based access control (ADULT/CHILD)

### Data Protection
- ✅ Helmet security headers
- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ CORS configuration
- ✅ Input validation with class-validator
- ✅ Sensitive data sanitization

### Parental Controls
- ✅ Mandatory parent contact for children under 16
- ✅ Parent verification system
- ✅ Play token generation by parents
- ✅ Content restriction levels (NONE, MILD, MODERATE, STRICT)
- ✅ isVerifiedByParent flag for access control

## 📊 Database Schema

### Core Models

#### User
- **Roles**: ADULT, CHILD
- **Sensitive Data**: Full name, physical address, age
- **Parental Link**: Parent contact reference for children
- **Security**: isVerifiedByParent, playTokens, isActive

#### GameProfile
- **State**: Current level, total score, play time
- **Game Data**: levelsData, inventory, missions, achievements (JSON)
- **Options**: Language (default: "ar"), sound, music, content restrictions
- **Sync**: pendingSync, lastSyncAt, lastPlayedAt

#### LevelData
- **Configuration**: Level ID, name, difficulty
- **Constraints**: maxChocolates (default 30), maxEggs (default 20)
- **Validation**: Total elements count

#### ParentContact
- **Information**: Name, phone, email
- **Verification**: Code-based verification system
- **Status**: isVerified, verifiedAt

#### UserSession
- **Tracking**: JWT token, expiration time
- **Management**: isActive status

#### ActivityLog
- **Monitoring**: User actions (LOGIN, REGISTRATION, ITEM_COLLECTED, LEVEL_COMPLETED, GAME_STATE_SYNCED)
- **Debugging**: IP address, user agent, detailed metadata

## 🎮 Game Logic

### Item Collection Validation

When collecting items, the backend validates:
1. ✅ Level exists
2. ✅ Item index is within bounds (< maxItems for level)
3. ✅ Item hasn't been collected before in this level
4. ✅ Collection count doesn't exceed maximum
5. ✅ Parental consent verified (for child accounts)

### Level Completion

- Records score and time spent
- Updates total player score
- Advances to next level if progress
- Maintains full level history

### Game State Sync

Supports offline-to-online transitions:
- Merge offline changes with server state
- Validate all state updates
- Preserve integrity of collected items

## 📱 Godot Integration

### Example Godot Connection

```gdscript
extends Node

var socket = SocketIOClient.new()
var user_token: String

func _ready():
    socket.connect_to_url("ws://localhost:3000/game", {
        "auth": {
            "token": user_token
        }
    })
    
    socket.on("connection_established", Callable(self, "_on_connected"))
    socket.on("item_collected", Callable(self, "_on_item_collected"))
    socket.on("level_completed", Callable(self, "_on_level_completed"))

func _on_connected(data):
    print("Connected! Socket ID:", data.socketId)
    socket.emit("heartbeat", {})

func collect_item(level_id: int, item_type: String, item_index: int):
    socket.emit("item_collected", {
        "levelId": level_id,
        "itemType": item_type,
        "itemIndex": item_index
    })

func complete_level(level_id: int, score: int, time_spent: int):
    socket.emit("level_complete", {
        "levelId": level_id,
        "score": score,
        "timeSpent": time_spent
    })
```

## 🗄 Database Setup

### Initialize MongoDB

```bash
# Generate Prisma client
npm run prisma:generate

# Create migrations (will prompt for name)
npm run prisma:migrate

# Seed initial data (levels)
npm run prisma:seed

# View/manage data in Prisma Studio
npm run prisma:studio
```

### Environment Variables

```env
# Database
DATABASE_URL="mongodb+srv://user:password@cluster.mongodb.net/happy-backend?retryWrites=true&w=majority"

# JWT
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRATION="7d"

# Argon2 Password Hashing
ARGON2_MEMORY=65540
ARGON2_TIME=3
ARGON2_PARALLELISM=4

# Server
PORT=3000
NODE_ENV="development"

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN="http://localhost:*"
```

## 📝 Project Structure

```
src/
├── auth/                 # Authentication module
│   ├── dto/             # DTOs for registration/login
│   ├── auth.service.ts  # Auth logic
│   ├── auth.controller.ts
│   ├── jwt.strategy.ts  # JWT strategy
│   ├── jwt-auth.guard.ts
│   ├── ws-jwt.guard.ts  # WebSocket JWT guard
│   └── auth.module.ts
├── users/               # User management
│   ├── users.service.ts
│   ├── users.controller.ts
│   └── users.module.ts
├── game/                # Game logic
│   ├── game.service.ts
│   ├── game.controller.ts
│   ├── game.gateway.ts  # WebSocket gateway
│   └── game.module.ts
├── prisma/              # Prisma service
│   ├── prisma.service.ts
│   └── prisma.module.ts
├── app.module.ts        # Root module
└── main.ts             # Entry point
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# Test with coverage
npm run test:cov

# E2E tests
npm run test:e2e

# Watch mode
npm run test:watch
```

## 🚨 Error Handling

The API returns consistent error responses:

```json
{
  "statusCode": 400,
  "message": "Email already in use",
  "error": "Bad Request"
}
```

Common error codes:
- `400` - Bad Request (validation failed)
- `401` - Unauthorized (invalid credentials/token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate email)
- `500` - Internal Server Error

## 📈 Monitoring

All user actions are logged in ActivityLog:
- User registrations and logins
- Item collections
- Level completions
- Game state syncs
- Account changes

Access logs via: `GET /users/activity-logs`

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Commit changes: `git commit -am 'Add my feature'`
3. Push to branch: `git push origin feature/my-feature`
4. Submit a pull request

## 📄 License

UNLICENSED - Proprietary

## 🎯 Next Steps

- [ ] Email verification system
- [ ] Social features (friend lists, messaging)
- [ ] Leaderboards
- [ ] In-app purchases
- [ ] Analytics dashboard
- [ ] Admin panel
- [ ] Mobile push notifications
- [ ] Advanced reporting
