# 🧪 Test APIs avec cURL

Utilisez ces commandes pour tester les APIs du backend Happy.

## 1️⃣ Inscription (Adult - 18+)

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jean.dupont@example.com",
    "password": "SecurePassword123!",
    "fullName": "Jean Dupont",
    "age": 25,
    "phone": "+33612345678",
    "physicalAddress": "123 Rue de la Paix, 75000 Paris"
  }'
```

**Réponse (201):**

```json
{
  "user": {
    "id": "user_123",
    "email": "jean.dupont@example.com",
    "fullName": "Jean Dupont",
    "age": 25,
    "role": "ADULT",
    "isActive": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Adult account created successfully"
}
```

---

## 2️⃣ Inscription (Child - < 18)

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice.dupont@example.com",
    "password": "ChildPassword123!",
    "fullName": "Alice Dupont",
    "age": 12,
    "phone": "+33612345679",
    "parentName": "Marie Dupont",
    "parentEmail": "marie.dupont@example.com"
  }'
```

**Réponse (201):**

```json
{
  "user": {
    "id": "user_456",
    "email": "alice.dupont@example.com",
    "fullName": "Alice Dupont",
    "age": 12,
    "role": "CHILD",
    "isActive": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Child account created. Verification email sent to parent.",
  "verificationRequired": true,
  "parentContact": {
    "parentName": "Marie Dupont",
    "parentEmail": "marie.dupont@example.com"
  }
}
```

---

## 🔐 Login

```bash
# Enregistrez ce token pour les prochains appels
TOKEN=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jean.dupont@example.com",
    "password": "SecurePassword123!"
  }' | jq -r '.token')

echo $TOKEN
```

**Réponse (200):**

```json
{
  "user": {
    "id": "user_123",
    "email": "jean.dupont@example.com",
    "fullName": "Jean Dupont",
    "role": "ADULT"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 👤 Récupérer le profil de jeu

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/game/profile
```

**Réponse (200):**

```json
{
  "success": true,
  "gameProfile": {
    "id": "profile_123",
    "userId": "user_123",
    "language": "ar",
    "soundEnabled": true,
    "musicEnabled": true,
    "currentLevel": 1,
    "totalScore": 0,
    "totalPlayTime": 0,
    "levelsData": {},
    "lastPlayedAt": "2026-02-27T14:00:00Z"
  }
}
```

---

## 📊 Récupérer les statistiques

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/game/stats
```

**Réponse (200):**

```json
{
  "success": true,
  "stats": {
    "totalScore": 0,
    "totalPlayTime": 0,
    "currentLevel": 1,
    "completedLevels": 0,
    "totalChocolates": 0,
    "totalEggs": 0,
    "language": "ar",
    "soundEnabled": true,
    "musicEnabled": true,
    "lastPlayedAt": "2026-02-27T14:00:00Z"
  }
}
```

---

## 🎯 Collecter un chocolat

```bash
curl -X PATCH http://localhost:3000/game/item-collect \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "levelId": 1,
    "itemType": "chocolate",
    "itemIndex": 0
  }'
```

**Réponse (200):**

```json
{
  "valid": true,
  "message": "Item collected successfully",
  "levelProgress": {
    "chocolatesTaken": [0],
    "eggsTaken": [],
    "completed": false
  }
}
```

---

## 🥚 Collecter un œuf

```bash
curl -X PATCH http://localhost:3000/game/item-collect \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "levelId": 1,
    "itemType": "egg",
    "itemIndex": 0
  }'
```

**Réponse (200):**

```json
{
  "valid": true,
  "message": "Item collected successfully",
  "levelProgress": {
    "chocolatesTaken": [0],
    "eggsTaken": [0],
    "completed": false
  }
}
```

---

## 🏁 Compléter un niveau

```bash
curl -X PATCH http://localhost:3000/game/level-complete \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "levelId": 1,
    "score": 250,
    "timeSpent": 180
  }'
```

**Réponse (200):**

```json
{
  "success": true,
  "message": "Level completed successfully",
  "totalScore": 250,
  "gameProfile": {
    "id": "profile_123",
    "userId": "user_123",
    "totalScore": 250,
    "currentLevel": 2,
    "totalPlayTime": 180,
    "levelsData": {
      "level_1": {
        "chocolatesTaken": [0],
        "eggsTaken": [0],
        "completed": true,
        "score": 250,
        "timeSpent": 180
      }
    }
  }
}
```

---

## 🔄 Synchroniser l'état du jeu (offline→online)

```bash
curl -X PATCH http://localhost:3000/game/sync \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "levelsData": {
      "level_1": {
        "chocolatesTaken": [0, 1, 2],
        "eggsTaken": [0, 1],
        "completed": true,
        "score": 250,
        "timeSpent": 180
      },
      "level_2": {
        "chocolatesTaken": [0, 1],
        "eggsTaken": [],
        "completed": false
      }
    },
    "totalScore": 500,
    "totalPlayTime": 360
  }'
```

**Réponse (200):**

```json
{
  "success": true,
  "message": "Game state synced successfully",
  "gameProfile": {
    "id": "profile_123",
    "totalScore": 500,
    "totalPlayTime": 360,
    "pendingSync": false,
    "lastSyncAt": "2026-02-27T14:00:00Z"
  }
}
```

---

## 🏥 Vérifier la santé de Redis

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/health/redis
```

**Réponse (200 - Redis OK):**

```json
{
  "status": "ok",
  "redis": "✅ Connected to Redis Cloud"
}
```

**Réponse (200 - Redis KO):**

```json
{
  "status": "error",
  "redis": "❌ Redis unreachable"
}
```

---

## 📝 Obtenir les infos d'un niveau

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/game/level/1
```

**Réponse (200):**

```json
{
  "id": "level_1",
  "levelId": 1,
  "levelName": "Level 1",
  "maxChocolates": 30,
  "maxEggs": 20,
  "totalElements": 50,
  "difficulty": "normal"
}
```

---

## ❌ Erreurs courantes

### Erreur: Email déjà utilisé

```json
{
  "statusCode": 409,
  "message": "Email already in use",
  "error": "Conflict"
}
```

### Erreur: Token expiré

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### Erreur: Champs manquants (Adult)

```json
{
  "statusCode": 400,
  "message": "Phone number and physical address are required for adults",
  "error": "Bad Request"
}
```

### Erreur: Champs manquants (Child)

```json
{
  "statusCode": 400,
  "message": "Parent name, parent phone number, and parent email are required for minors",
  "error": "Bad Request"
}
```

### Erreur: Item déjà collecté

```json
{
  "valid": false,
  "error": "Item already collected"
}
```

---

## 🔧 Script bash complet pour tester

```bash
#!/bin/bash

# Configuration
BACKEND_URL="http://localhost:3000"
EMAIL="test.$(date +%s)@example.com"
PASSWORD="TestPassword123!"

echo "🎮 Test Happy Backend API"
echo "========================="

# 1. Inscription
echo -e "\n1️⃣ Inscription d'un adulte..."
REGISTER=$(curl -s -X POST $BACKEND_URL/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"fullName\": \"Test User\",
    \"age\": 25,
    \"phone\": \"+33612345678\",
    \"physicalAddress\": \"123 Rue de Test\"
  }")

TOKEN=$(echo $REGISTER | jq -r '.token')
echo "✅ Inscription réussie!"
echo "Token: $TOKEN"

# 2. Récupérer le profil
echo -e "\n2️⃣ Récupération du profil..."
curl -s -H "Authorization: Bearer $TOKEN" \
  $BACKEND_URL/game/profile | jq '.'

# 3. Collecter un chocolat
echo -e "\n3️⃣ Collecte d'un chocolat..."
curl -s -X PATCH $BACKEND_URL/game/item-collect \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "levelId": 1,
    "itemType": "chocolate",
    "itemIndex": 0
  }' | jq '.'

# 4. Compléter le niveau
echo -e "\n4️⃣ Complétion du niveau..."
curl -s -X PATCH $BACKEND_URL/game/level-complete \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "levelId": 1,
    "score": 250,
    "timeSpent": 180
  }' | jq '.'

# 5. Récupérer les stats
echo -e "\n5️⃣ Récupération des stats..."
curl -s -H "Authorization: Bearer $TOKEN" \
  $BACKEND_URL/game/stats | jq '.'

echo -e "\n✅ Tests terminés!"
```

---

## 🚀 Commandes rapides

```bash
# Démarrer le backend
npm run start:dev

# Tester la compilation
npm run build

# Lancer les tests
npm run test

# Tests E2E
npm run test:e2e

# Vérifier Redis
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/health/redis
```

---

**💡 Conseil**: Utilisez [Postman](https://www.postman.com/) ou [Insomnia](https://insomnia.rest/) pour des tests interactifs!
