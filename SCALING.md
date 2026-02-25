# Configuration Horizontale Scalabilité & Firebase

## Redis Configuration

Ajoute au `.env` :

```env
# Redis (pour distributed caching et sessions)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=optional_password
```

### Installation locale Redis (Windows)

```bash
# Via WSL2
wsl -- redis-server

# Ou via Docker
docker run -d -p 6379:6379 redis:latest
```

### Production

Utilise un service Redis managé (AWS ElastiCache, Azure Cache for Redis, etc).

---

## Firebase Configuration

### 1. Setup Firebase Console

- Crée un projet sur [Firebase Console](https://console.firebase.google.com)
- Active Cloud Messaging
- Télécharge les clés de service (JSON)

### 2. Configuration

Place le fichier JSON dans le projet root ou spécifie le chemin :

```env
FIREBASE_SERVICE_ACCOUNT_PATH="./firebase-service-account.json"
FIREBASE_DATABASE_URL="https://your-project.firebaseio.com"
```

### 3. Utilisation dans le code

```typescript
import { NotificationService } from './notifications/notification.service';

constructor(private notificationService: NotificationService) {}

// Envoyer une notification
await this.notificationService.sendNotification(
  deviceToken,
  'Titre',
  'Corps du message',
  { customData: 'value' }
);

// Envoyer à un topic
await this.notificationService.sendToTopic(
  'game_updates',
  'Nouvelle partie',
  'Une nouvelle partie est disponible!'
);
```

---

## Scalabilité Horizontale

### Points clés d'architecture :

1. **Sessions décentralisées**
   - Stockées dans Redis, pas en mémoire
   - Sessions partagées entre instances
2. **Cache distribué**
   - Utilisé pour les données fréquentes
   - Invalidation cohérente via Redis

3. **Pas de state en mémoire**
   - Évite les problèmes de synchronisation
   - Permet l'autoscaling transparent

### Déploiement multi-instances

```bash
# Instance 1
PORT=3000 INSTANCE_ID=instance-1 npm run start:prod

# Instance 2
PORT=3001 INSTANCE_ID=instance-2 npm run start:prod

# Load balancer en front (nginx, AWS ALB, etc)
```

---

## API REST pour Godot

### Endpoints disponibles

#### Authentification

```
POST /auth/register
POST /auth/login
POST /auth/logout
GET  /auth/verify
```

#### Utilisateurs

```
GET  /users/me
PATCH /users/:id
GET  /users/child/:id
```

#### Jeux

```
GET  /game/list
POST /game/create
GET  /game/:id
POST /game/:id/join
```

#### Notifications (future)

```
POST /notifications/register-device
POST /notifications/subscribe-topic
```

### Format de réponse standard

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "timestamp": "2026-02-25T13:00:00Z"
}
```

### Erreurs

```json
{
  "statusCode": 400,
  "message": "Bad Request",
  "error": "validation_failed",
  "timestamp": "2026-02-25T13:00:00Z"
}
```

---

## WebSocket pour temps réel

Les WebSockets restent connectés pour :

- Synchronisation en temps réel des parties
- Notifications immédiates
- Échanges de messages

```typescript
// Client Godot
var ws = WebSocketClient.new();
ws.connect_to_url('ws://localhost:3001');
ws.send_text(
  JSON.stringify({
    event: 'game.join',
    data: { gameId: '123' },
  }),
);
```

---

## Checklist Déploiement

- [ ] Prisma generate & migrate
- [ ] Redis running (ou URL de service)
- [ ] Firebase credentials configurés
- [ ] Variables d'env complètes
- [ ] npm run build
- [ ] npm run start:prod
- [ ] Tester endpoints
- [ ] Configurer load balancer
- [ ] Monitoring Redis/Logs
