# API REST Documentation - Happy Backend

## Base URL

```
http://localhost:3000
```

## Response Format

Toutes les réponses suivent ce format standardisé :

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "timestamp": "2026-02-25T13:00:00Z",
  "path": "/api/endpoint"
}
```

### Erreurs

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "VALIDATION_ERROR",
  "details": {
    "field": ["error message"]
  },
  "timestamp": "2026-02-25T13:00:00Z",
  "path": "/api/endpoint"
}
```

---

## Authentication

### Register (Adult)

```http
POST /auth/register
Content-Type: application/json

{
  "email": "parent@example.com",
  "password": "secure_password",
  "fullName": "John Doe",
  "phone": "+33612345678"
}
```

**Response:**

```json
{
  "statusCode": 201,
  "message": "Created",
  "data": {
    "id": "user_123",
    "email": "parent@example.com",
    "role": "ADULT",
    "token": "jwt_token_here",
    "expiresIn": "7d"
  },
  "timestamp": "2026-02-25T13:00:00Z"
}
```

### Register (Child)

```http
POST /auth/register-child
Content-Type: application/json
Authorization: Bearer {token}

{
  "username": "child_player",
  "parentId": "parent_123",
  "contentRestriction": "MODERATE"
}
```

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "parent@example.com",
  "password": "secure_password"
}
```

**Response:**

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": "user_123",
    "email": "parent@example.com",
    "role": "ADULT",
    "token": "jwt_token_here",
    "expiresIn": "7d"
  },
  "timestamp": "2026-02-25T13:00:00Z"
}
```

### Logout

```http
POST /auth/logout
Authorization: Bearer {token}
```

### Verify Token

```http
GET /auth/verify
Authorization: Bearer {token}
```

---

## Users

### Get Current User

```http
GET /users/me
Authorization: Bearer {token}
```

**Response:**

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": "user_123",
    "email": "parent@example.com",
    "fullName": "John Doe",
    "role": "ADULT",
    "children": [
      {
        "id": "child_123",
        "username": "child_player",
        "contentRestriction": "MODERATE"
      }
    ]
  },
  "timestamp": "2026-02-25T13:00:00Z"
}
```

### Get Child Profile

```http
GET /users/child/{childId}
Authorization: Bearer {token}
```

### Update User Profile

```http
PATCH /users/{userId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "fullName": "Jane Doe",
  "phone": "+33687654321"
}
```

### Get User Statistics

```http
GET /users/{userId}/stats
Authorization: Bearer {token}
```

**Response:**

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "gamesPlayed": 42,
    "totalScore": 15000,
    "level": 5,
    "achievements": ["first_game", "level_5", "high_score"]
  },
  "timestamp": "2026-02-25T13:00:00Z"
}
```

---

## Games

### List Games

```http
GET /game/list
Authorization: Bearer {token}
```

**Query Parameters:**

- `status` : PENDING|ACTIVE|COMPLETED (optional)
- `page` : number (default: 1)
- `limit` : number (default: 10)

**Response:**

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "items": [
      {
        "id": "game_123",
        "title": "Math Adventure",
        "description": "Learn math through games",
        "status": "ACTIVE",
        "playersCount": 3,
        "maxPlayers": 4,
        "createdBy": "user_123",
        "createdAt": "2026-02-25T10:00:00Z"
      }
    ],
    "total": 42,
    "page": 1,
    "limit": 10
  },
  "timestamp": "2026-02-25T13:00:00Z"
}
```

### Create Game

```http
POST /game/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Math Adventure",
  "description": "Learn math through games",
  "maxPlayers": 4,
  "contentRestriction": "MILD",
  "settings": {
    "difficulty": "EASY",
    "duration": 3600
  }
}
```

**Response:**

```json
{
  "statusCode": 201,
  "message": "Created",
  "data": {
    "id": "game_123",
    "title": "Math Adventure",
    "status": "PENDING",
    "code": "ABC123",
    "createdAt": "2026-02-25T13:00:00Z"
  },
  "timestamp": "2026-02-25T13:00:00Z"
}
```

### Get Game Details

```http
GET /game/{gameId}
Authorization: Bearer {token}
```

### Join Game

```http
POST /game/{gameId}/join
Authorization: Bearer {token}
Content-Type: application/json

{
  "childId": "child_123",
  "joinCode": "ABC123"
}
```

### Leave Game

```http
POST /game/{gameId}/leave
Authorization: Bearer {token}
```

### Get Game Players

```http
GET /game/{gameId}/players
Authorization: Bearer {token}
```

### Submit Game Score

```http
POST /game/{gameId}/score
Authorization: Bearer {token}
Content-Type: application/json

{
  "score": 5000,
  "duration": 1200,
  "playerId": "child_123"
}
```

---

## WebSocket (Real-time)

### Connect

```
ws://localhost:3001
```

### Authenticate

```javascript
ws.send(
  JSON.stringify({
    type: 'authenticate',
    token: 'jwt_token_here',
  }),
);
```

### Game Events

#### Join Room

```javascript
ws.send(
  JSON.stringify({
    event: 'game.join',
    data: {
      gameId: 'game_123',
      playerId: 'child_123',
    },
  }),
);
```

#### Send Game Action

```javascript
ws.send(
  JSON.stringify({
    event: 'game.action',
    data: {
      action: 'move',
      position: { x: 10, y: 20 },
    },
  }),
);
```

#### Receive Updates

```javascript
ws.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  switch (message.type) {
    case 'game.state':
      console.log('Game state:', message.data);
      break;
    case 'game.player_joined':
      console.log('Player joined:', message.data.player);
      break;
    case 'game.score_update':
      console.log('Score:', message.data.score);
      break;
  }
});
```

---

## Notifications (Firebase)

### Register Device

```http
POST /notifications/register-device
Authorization: Bearer {token}
Content-Type: application/json

{
  "deviceToken": "firebase_device_token",
  "platform": "godot|android|ios|web"
}
```

### Subscribe to Topic

```http
POST /notifications/subscribe-topic
Authorization: Bearer {token}
Content-Type: application/json

{
  "topic": "game_updates",
  "deviceTokens": ["token1", "token2"]
}
```

---

## Error Codes

| Code             | Status | Description             |
| ---------------- | ------ | ----------------------- |
| VALIDATION_ERROR | 400    | Validation failed       |
| UNAUTHORIZED     | 401    | Invalid credentials     |
| FORBIDDEN        | 403    | No permission           |
| NOT_FOUND        | 404    | Resource not found      |
| CONFLICT         | 409    | Resource already exists |
| RATE_LIMITED     | 429    | Too many requests       |
| INTERNAL_ERROR   | 500    | Server error            |

---

## Integration avec Godot

### Exemple complet en GDScript

```gdscript
extends Node

var api_url: String = "http://localhost:3000"
var ws_url: String = "ws://localhost:3001"
var auth_token: String = ""
var http_client: HTTPClient

func _ready():
  http_client = HTTPClient.new()

func login(email: String, password: String) -> void:
  var url = api_url + "/auth/login"
  var body = JSON.stringify({
    "email": email,
    "password": password
  })

  var headers = ["Content-Type: application/json"]
  http_client.request(HTTPClient.METHOD_POST, url, headers, body)

func _process(_delta):
  if http_client.get_status() == HTTPClient.STATUS_BODY:
    var response = http_client.read_response_body_chunk()
    if response:
      var data = JSON.parse_string(response)
      if data.statusCode == 200:
        auth_token = data.data.token
        print("Login successful!")

func get_games() -> void:
  var url = api_url + "/game/list"
  var headers = [
    "Content-Type: application/json",
    "Authorization: Bearer " + auth_token
  ]
  http_client.request(HTTPClient.METHOD_GET, url, headers)

func connect_websocket() -> void:
  var ws = WebSocketClient.new()
  ws.connect_to_url(ws_url)

  ws.connect("data_received", self, "_on_ws_data")

  # Authenticate
  yield(get_tree(), "idle_frame")
  ws.send_text(JSON.stringify({
    "type": "authenticate",
    "token": auth_token
  }))

func _on_ws_data():
  var data = JSON.parse_string(get_last_pull_data())
  match data.type:
    "game.state":
      print("Game state update:", data.data)
    "game.player_joined":
      print("Player joined:", data.data.player)
    "game.score_update":
      print("Score update:", data.data.score)
```

---

## Rate Limiting

- Window: 15 minutes
- Max requests: 100 per IP
- Status: 429 Too Many Requests

---

## CORS

Configuré pour accepter :

- `http://localhost:*` (développement)
- À configurer pour production

---

## Documentation interactive

Swagger UI disponible à : `http://localhost:3000/api/docs` (en développement)
