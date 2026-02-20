# Quick Start Guide - Happy Backend

## 5 Minutes to Running Server

### 1. Prerequisites

- Node.js 18+
- npm 9+
- MongoDB Atlas account (or local MongoDB)
- Godot 4.0+ (for testing with game client)

### 2. Install & Configure

```bash
# Clone or enter project directory
cd happy-backend

# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Configure environment
cp .env.example .env
# Edit .env and set your DATABASE_URL to MongoDB connection string
nano .env
```

### 3. Minimal .env Setup

```env
DATABASE_URL="mongodb+srv://user:pass@cluster.mongodb.net/happy-backend?retryWrites=true&w=majority"
JWT_SECRET="dev-secret-key-change-in-production"
PORT=3000
```

### 4. Database Setup

```bash
# Create migrations (optional, Prisma can auto-sync for MongoDB)
npm run prisma:migrate

# Seed initial level data
npm run prisma:seed

# View data in GUI (optional)
npm run prisma:studio
```

### 5. Start Server

```bash
# Development mode (with hot reload)
npm run start:dev

# You should see:
# ✅ Happy Backend is running on port 3000
# 🎮 WebSocket server available on ws://localhost:3000/game
```

## Testing the API

### 1. Register Adult User

```bash
curl -X POST http://localhost:3000/auth/register-adult \
  -H "Content-Type: application/json" \
  -d '{
    "email": "parent@example.com",
    "password": "SecurePass123",
    "fullName": "John Doe",
    "physicalAddress": "123 Main St"
  }'
```

Expected response:

```json
{
  "user": {
    "id": "...",
    "email": "parent@example.com",
    "fullName": "John Doe",
    "role": "ADULT",
    "gameProfile": { ... }
  },
  "token": "eyJhbGc..."
}
```

### 2. Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "parent@example.com",
    "password": "SecurePass123"
  }'
```

### 3. Get User Profile (authenticated)

```bash
curl -X GET http://localhost:3000/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Connect WebSocket (from Godot or ws client)

```javascript
const socket = io('ws://localhost:3000/game', {
  auth: {
    token: 'YOUR_JWT_TOKEN_HERE',
  },
});

socket.on('connection_established', (data) => {
  console.log('Connected!', data.socketId);
});

// Collect item
socket.emit('item_collected', {
  levelId: 1,
  itemType: 'chocolate',
  itemIndex: 5,
});

// Complete level
socket.emit('level_complete', {
  levelId: 1,
  score: 250,
  timeSpent: 180,
});
```

## Godot Integration Example

### Install Socket.io Client for Godot

Add to your `project.godot`:

```gdscript
var socket = SocketIOClient.new()
```

### Connect to Backend

```gdscript
extends Node

var user_token: String = ""

func _ready():
    # Get token from login first
    var response = await auth_login("child@example.com", "pass123")
    user_token = response["token"]

    # Connect to WebSocket
    socket = SocketIOClient.new()
    socket.connect_to_url("ws://localhost:3000/game", {
        "auth": {
            "token": user_token
        }
    })

    socket.on("connection_established", Callable(self, "_on_connected"))
    socket.on("item_collection_success", Callable(self, "_on_item_collected"))
    socket.on("level_complete_success", Callable(self, "_on_level_completed"))
    socket.on("item_collection_failed", Callable(self, "_on_collection_failed"))

func _on_connected(data):
    print("Connected! Socket ID: ", data["socketId"])

func collect_item(level_id: int, item_index: int):
    socket.emit("item_collected", {
        "levelId": level_id,
        "itemType": "chocolate",
        "itemIndex": item_index
    })

func complete_level(level_id: int, score: int, time_spent: int):
    socket.emit("level_complete", {
        "levelId": level_id,
        "score": score,
        "timeSpent": time_spent
    })

func _on_item_collected(data):
    print("Item collected! Progress: ", data["levelProgress"])

func _on_level_completed(data):
    print("Level completed! Total score: ", data["totalScore"])

func _on_collection_failed(data):
    print("Collection failed: ", data["error"])
```

## Common Tasks

### Create Child Account with Parent Link

1. **Parent creates contact info:**

```bash
curl -X POST http://localhost:3000/users/parent-contact \
  -H "Authorization: Bearer PARENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parentName": "John Doe",
    "parentPhone": "+1234567890",
    "parentEmail": "parent@example.com"
  }'
```

Response: `{ "id": "contact-id-xyz" }`

2. **Register child with parent link:**

```bash
curl -X POST http://localhost:3000/auth/register-child \
  -H "Content-Type: application/json" \
  -d '{
    "email": "child@example.com",
    "password": "ChildPass123",
    "fullName": "Jane Doe",
    "age": 10,
    "parentContactId": "contact-id-xyz"
  }'
```

### Generate Play Token (Parent Verification)

```bash
curl -X POST http://localhost:3000/users/play-token/generate \
  -H "Authorization: Bearer PARENT_TOKEN"

# Response: { "token": "random-token-xyz" }
```

### Activate Child with Play Token

```bash
curl -X POST http://localhost:3000/users/play-token/verify \
  -H "Authorization: Bearer CHILD_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "random-token-xyz"
  }'
```

### Sync Game State After Offline Play

```bash
curl -X PATCH http://localhost:3000/game/sync \
  -H "Authorization: Bearer CHILD_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "levelsData": {
      "level_1": {
        "chocolatesTaken": [1, 2, 3],
        "eggsTaken": [4, 5],
        "completed": true,
        "score": 250
      }
    },
    "totalScore": 500,
    "totalPlayTime": 3600
  }'
```

## Project Structure

```
happy-backend/
├── src/
│   ├── auth/              # Authentication (JWT, Passport, registration)
│   │   ├── dto/
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   ├── jwt.strategy.ts
│   │   ├── jwt-auth.guard.ts
│   │   ├── ws-jwt.guard.ts
│   │   └── auth.module.ts
│   │
│   ├── users/             # User management (profiles, parent control)
│   │   ├── users.service.ts
│   │   ├── users.controller.ts
│   │   └── users.module.ts
│   │
│   ├── game/              # Game logic (WebSocket, state sync)
│   │   ├── game.service.ts
│   │   ├── game.controller.ts
│   │   ├── game.gateway.ts    # WebSocket Gateway
│   │   └── game.module.ts
│   │
│   ├── prisma/            # Database service
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   │
│   ├── config/            # Configuration
│   │   └── config.ts
│   │
│   ├── app.module.ts      # Root module
│   └── main.ts           # Entry point
│
├── prisma/
│   ├── schema.prisma     # Data models
│   └── seed.ts          # Database seeding
│
├── dist/                 # Compiled output
├── .env                  # Environment variables
├── .env.example          # Example env file
├── package.json
├── tsconfig.json
├── IMPLEMENTATION.md     # Detailed implementation guide
├── ARCHITECTURE.md       # System architecture
└── README.md
```

## Debugging

### Enable Debug Logging

```bash
DEBUG=nestjs:* npm run start:dev
```

### Check Database Connection

```bash
npm run prisma:studio
```

### Verify WebSocket Connection

```javascript
// Browser console
const socket = io('ws://localhost:3000/game', {
  auth: { token: 'YOUR_TOKEN' },
});

socket.on('connect', () => console.log('Connected'));
socket.on('disconnect', () => console.log('Disconnected'));
socket.on('error', (error) => console.error('Error:', error));
```

### View Activity Logs

```bash
curl -X GET http://localhost:3000/users/activity-logs?limit=20 \
  -H "Authorization: Bearer USER_TOKEN"
```

## Common Errors & Solutions

### "Cannot find module @prisma/client"

```bash
npm run prisma:generate
```

### "MongoDB connection timeout"

- Check DATABASE_URL in .env
- Ensure IP whitelist includes your machine
- Verify credentials are correct

### "Token expired"

- Login again to get new token
- Default expiration is 7 days

### "Item already collected"

- This is validation preventing cheating
- Item index already exists in levelsData

### "CORS error on WebSocket"

- Check CORS_ORIGIN in .env
- Update to match your Godot client URL

## Next Steps

1. ✅ Server running locally
2. 📱 Connect Godot client
3. 👨‍👧 Test adult/child registration
4. 🎮 Test game state sync
5. 📊 Review activity logs
6. 🚀 Deploy to production (MongoDB Atlas + cloud hosting)

## Production Deployment

See IMPLEMENTATION.md → Database Setup & Environment Variables for production checklist.

## Support

- Check IMPLEMENTATION.md for detailed API documentation
- Review ARCHITECTURE.md for system design
- Check error logs: `npm run start:dev` shows real-time errors
- Enable Prisma Studio for database inspection: `npm run prisma:studio`
