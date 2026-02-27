# 🎮 Happy Backend - API Documentation

## ✅ État du projet

- ✅ **Redis Cloud**: Réactivé et fonctionnel
- ✅ **Authentification**: Unifiée (un seul `RegisterDto`)
- ✅ **APIs de jeu**: Implémentées et testées
- ✅ **Compilation**: Sans erreurs

---

## 🚀 Quick Start pour les développeurs Godot

### 1. Variables de configuration

```gdscript
const BACKEND_URL = "http://localhost:3000"
const API_VERSION = "v1"
var auth_token = ""
```

### 2. Authentification en 3 étapes

```gdscript
# Étape 1: Inscription
POST /auth/register
{
  "email": "joueur@example.com",
  "password": "SecurePass123",
  "fullName": "Jean Dupont",
  "age": 25,
  "phone": "+33612345678",
  "physicalAddress": "123 Rue de Paris"  # Obligatoire si 18+
}

# Étape 2: Login
POST /auth/login
{
  "email": "joueur@example.com",
  "password": "SecurePass123"
}

# Réponse: reçoit le token JWT à utiliser dans tous les autres appels
```

---

## 📊 APIs principales pour le jeu

### 1. **Récupérer le profil joueur**

```
GET /game/profile
Headers: Authorization: Bearer {token}

Retourne: score total, niveau actuel, temps de jeu, etc.
```

### 2. **Obtenir les statistiques**

```
GET /game/stats
Headers: Authorization: Bearer {token}

Retourne:
- totalScore: Score total
- totalChocolates: Chocolats collectés
- totalEggs: Œufs collectés
- completedLevels: Niveaux complétés
- totalPlayTime: Temps total de jeu
```

### 3. **Collecter un item (chocolat ou œuf)**

```
PATCH /game/item-collect
Headers: Authorization: Bearer {token}

Body:
{
  "levelId": 1,
  "itemType": "chocolate",  # ou "egg"
  "itemIndex": 0
}

Retourne: confirmation de la collecte et état du niveau
```

### 4. **Compléter un niveau**

```
PATCH /game/level-complete
Headers: Authorization: Bearer {token}

Body:
{
  "levelId": 1,
  "score": 250,
  "timeSpent": 180  # en secondes
}

Retourne: nouveau score total et niveau suivant
```

### 5. **Synchroniser les données (offline → online)**

```
PATCH /game/sync
Headers: Authorization: Bearer {token}

Body:
{
  "levelsData": { ... },
  "totalScore": 1250,
  "totalPlayTime": 3600
}

Retourne: profil mis à jour sur le serveur
```

---

## 🔑 Structure d'authentification

### Age < 18 ans (Mineur)

```json
{
  "email": "enfant@example.com",
  "password": "SecurePass123",
  "fullName": "Alice Dupont",
  "age": 12,
  "phone": "+33612345678",        # ← Numéro du PARENT
  "parentName": "Marie Dupont",    # ← NOM du parent
  "parentEmail": "parent@example.com"  # ← EMAIL du parent
}
```

### Age >= 18 ans (Adulte)

```json
{
  "email": "adulte@example.com",
  "password": "SecurePass123",
  "fullName": "Jean Dupont",
  "age": 25,
  "phone": "+33612345678",         # ← Numéro PERSONNEL
  "physicalAddress": "123 Rue de Paris"  # ← Adresse requise
}
```

---

## 📝 Utilisation complète depuis Godot

Voir le fichier: **[GODOT_API_GUIDE.md](./GODOT_API_GUIDE.md)**

Ce guide inclut:

- Exemples de code Godot complets
- Gestion des tokens
- Synchronisation offline/online
- Gestion des erreurs

---

## 🔧 Configuration Redis Cloud

Le service Cache a été réactivé avec Redis Cloud:

```typescript
// src/cache/cache.service.ts
this.redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
});
```

**Variables d'environnement requises:**

```
REDIS_HOST=your-redis-host.cloud.redislabs.com
REDIS_PORT=6379
REDIS_PASSWORD=your-password
DATABASE_URL=mongodb://...
JWT_SECRET=your-jwt-secret
```

---

## 🧪 Test rapide des APIs

```bash
# 1. Vérifier la connexion Redis
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/health/redis

# 2. S'inscrire
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123",
    "fullName": "Test User",
    "age": 25,
    "phone": "+33612345678",
    "physicalAddress": "123 Rue"
  }'

# 3. Se connecter
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'

# 4. Récupérer le profil
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/game/profile

# 5. Collecter un item
curl -X PATCH http://localhost:3000/game/item-collect \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "levelId": 1,
    "itemType": "chocolate",
    "itemIndex": 0
  }'
```

---

## 📊 Structure des données

### GameProfile

```json
{
  "id": "string",
  "userId": "string",
  "language": "ar",
  "soundEnabled": true,
  "musicEnabled": true,
  "currentLevel": 5,
  "totalScore": 1250,
  "totalPlayTime": 3600, // en secondes
  "levelsData": {
    "level_1": {
      "chocolatesTaken": [0, 1, 2],
      "eggsTaken": [0, 1],
      "completed": true,
      "score": 250,
      "timeSpent": 180
    }
  },
  "lastPlayedAt": "2026-02-27T14:00:00Z"
}
```

### User (Joueur)

```json
{
  "id": "string",
  "email": "string",
  "password": "hashed",
  "fullName": "string",
  "age": 25,
  "role": "ADULT", // ou "CHILD"
  "physicalAddress": "string (si adulte)",
  "parentContactId": "string (si enfant)",
  "isActive": true,
  "createdAt": "2026-02-27T14:00:00Z"
}
```

---

## 🔒 Sécurité

- ✅ Passwords hachés avec Argon2
- ✅ JWT tokens avec expiration 7 jours
- ✅ Guard JWT sur tous les endpoints du jeu
- ✅ Validation des données avec class-validator
- ✅ Redis Cloud sécurisé

---

## 🎯 Points clés pour les développeurs

1. **Token JWT**: Valable 7 jours, stockez-le localement pour les sessions futures
2. **Header Authorization**: Toujours inclure: `Authorization: Bearer {token}`
3. **Gestion des mineurs**: Si age < 18, demandez les infos du parent
4. **Synchronisation offline**: Accumulez les données offline, synchronisez quand connecté
5. **Erreurs**: Implémentez retry avec délai exponentiel

---

## 📞 Endpoints résumés

| Méthode | Endpoint               | Description                | Auth |
| ------- | ---------------------- | -------------------------- | ---- |
| POST    | `/auth/register`       | Créer un compte            | ❌   |
| POST    | `/auth/login`          | Se connecter               | ❌   |
| GET     | `/game/profile`        | Récupérer le profil de jeu | ✅   |
| GET     | `/game/stats`          | Récupérer les statistiques | ✅   |
| GET     | `/game/level/:levelId` | Infos d'un niveau          | ✅   |
| PATCH   | `/game/item-collect`   | Collecter un item          | ✅   |
| PATCH   | `/game/level-complete` | Compléter un niveau        | ✅   |
| PATCH   | `/game/sync`           | Synchroniser l'état du jeu | ✅   |
| GET     | `/health/redis`        | Vérifier Redis             | ✅   |

---

## 🚀 Déploiement

```bash
# Build
npm run build

# Start dev
npm run start:dev

# Start production
npm run start:prod
```

---

**✨ Prêt à être utilisé par Godot!**

Pour plus de détails, consultez [GODOT_API_GUIDE.md](./GODOT_API_GUIDE.md)
