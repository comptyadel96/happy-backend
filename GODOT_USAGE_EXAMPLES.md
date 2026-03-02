# Exemples d'Utilisation - API Godot

## Table des matières

1. [Authentification](#authentification)
2. [Charge Initiale](#charge-initiale)
3. [Soumission de Niveau](#soumission-de-niveau)
4. [Synchronisation Périodique](#synchronisation-périodique)
5. [Synchronisation Offline](#synchronisation-offline)
6. [Exemples cURL](#exemples-curl)

---

## Authentification

### 1. Enregistrement avec Wilaya

**URL**: `POST /auth/register`

**Exemple d'enregistrement (Adulte en Algérie):**

```json
{
  "email": "joueur@example.dz",
  "password": "MdpSecure123!",
  "fullName": "Ahmed Ben Ali",
  "age": 28,
  "phone": "+213612345678",
  "wilaya": "Alger",
  "physicalAddress": "123 Rue de la Révolution, Alger"
}
```

**Response (200):**

```json
{
  "user": {
    "id": "user_12345",
    "email": "joueur@example.dz",
    "fullName": "Ahmed Ben Ali",
    "role": "ADULT",
    "wilaya": "Alger",
    "age": 28,
    "createdAt": "2026-03-02T10:30:00Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 604800
}
```

### 2. Enregistrement (Enfant)

**Exemple d'enregistrement (Enfant en Algérie):**

```json
{
  "email": "enfant@example.dz",
  "password": "MdpSecure123!",
  "fullName": "Fatima Medjahed",
  "age": 10,
  "phone": "+213612345678",
  "wilaya": "Constantine",
  "parentName": "Said Medjahed",
  "parentEmail": "parent@example.dz"
}
```

### 3. Connexion

**URL**: `POST /auth/login`

**Request:**

```json
{
  "email": "joueur@example.dz",
  "password": "MdpSecure123!"
}
```

**Response:**

```json
{
  "user": {
    /* ... */
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 604800
}
```

---

## Charge Initiale

### Au démarrage du jeu, charger l'état sauvegardé

**URL**: `GET /game/state`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Response (200):**

```json
{
  "success": true,
  "gameState": {
    "levelsData": {
      "1": {
        "chokolata_collected": 30,
        "eggs_collected": 2,
        "diamond_collected": 2,
        "time": 120,
        "score": 8500,
        "chokolate_taked_ids": [true, true, true],
        "eggs_taked_ids": [true, true],
        "diamonds_taked_ids": [true, true],
        "game_won": true,
        "level_unlocked": true,
        "player_position_name": "checkpoint_1",
        "happy_letters": {
          "H": true,
          "A": false,
          "P": false,
          "P2": false,
          "Y": false
        },
        "submittedAt": "2026-03-01T15:30:00Z"
      }
    },
    "levelsInventory": {
      "2": {
        "have": { "key": false, "family_image": false },
        "taked": { "key": false, "family_image": false }
      },
      "3": {
        "have": { "lever": false },
        "taked": { "lever": false }
      }
    },
    "levelsStates": {
      "1": { "BarnDoor": true, "CaveFarmDoor": false },
      "2": { "LeverElectricity": false }
    },
    "levelsMissions": {
      "1": { "StrangerImage": true }
    },
    "gameOptions": {
      "first_time_play": false,
      "happy_map_position": 1,
      "language": "ar"
    },
    "gameData": {
      "movment_hint_show": true,
      "ledder_hint_show": false,
      "use_hint_show": true,
      "hang_hint_show": true,
      "attack_skill": false,
      "climb_skill": false
    },
    "currentLevel": 2,
    "totalScore": 8500,
    "totalPlayTime": 120,
    "lastSyncAt": "2026-03-02T09:45:00Z"
  }
}
```

---

## Soumission de Niveau

### Après que le joueur complète un niveau

**URL**: `POST /game/level/submit`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request (Niveau 1 - Complet):**

```json
{
  "levelId": 1,
  "chokolata_collected": 30,
  "eggs_collected": 2,
  "diamond_collected": 2,
  "time": 125,
  "score": 8500,
  "chokolate_taked_ids": [
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true
  ],
  "eggs_taked_ids": [true, true],
  "diamonds_taked_ids": [true, true],
  "game_won": true,
  "level_unlocked": true,
  "player_position_name": "exit_portal",
  "happy_letters": {
    "H": true,
    "A": false,
    "P": false,
    "P2": false,
    "Y": false
  }
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Level data submitted successfully",
  "levelId": 1,
  "totalScore": 8500
}
```

**Request (Niveau 2 - Partiel):**

```json
{
  "levelId": 2,
  "chokolata_collected": 15,
  "eggs_collected": 1,
  "diamond_collected": 1,
  "time": 180,
  "score": 5200,
  "chokolate_taked_ids": [
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true
  ],
  "eggs_taked_ids": [true],
  "diamonds_taked_ids": [true],
  "game_won": false,
  "level_unlocked": false,
  "player_position_name": "checkpoint_2",
  "happy_letters": {
    "H": false,
    "A": false,
    "P": true,
    "P2": false,
    "Y": false
  }
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Level data submitted successfully",
  "levelId": 2,
  "totalScore": 13700
}
```

---

## Synchronisation Périodique

### Synchroniser inventaire des niveaux

**URL**: `PATCH /game/levels/inventory`

**Request:**

```json
{
  "1": {
    "have": {
      "shield": true,
      "potion": true,
      "key": false
    },
    "taked": {
      "shield": true,
      "potion": false,
      "key": false
    }
  },
  "2": {
    "have": {
      "key": true,
      "family_image": true
    },
    "taked": {
      "key": false,
      "family_image": false
    }
  }
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Levels inventory synced",
  "levelsInventory": {}
}
```

---

### Synchroniser états des niveaux

**URL**: `PATCH /game/levels/states`

**Request:**

```json
{
  "1": {
    "BarnDoor": true,
    "CaveFarmDoor": false,
    "TreeBridge": true
  },
  "2": {
    "LeverElectricity": true
  },
  "3": {
    "LeverRight": false,
    "LeverStock": true,
    "PlatformDoor": false
  },
  "4": {
    "LeverLeft": true,
    "LeverCenter": false
  },
  "5": {
    "BasmentDoor": false,
    "HouseDoor": true,
    "Faza3a": false
  },
  "6": {
    "CaveCompleted": false
  }
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Levels states synced",
  "levelsStates": {}
}
```

---

### Synchroniser missions des niveaux

**URL**: `PATCH /game/levels/missions`

**Request:**

```json
{
  "1": {
    "StrangerImage": true,
    "FindAllLetters": false
  },
  "2": {
    "CollectAllEggs": false
  }
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Levels missions synced",
  "levelsMissions": {}
}
```

---

### Synchroniser options du jeu

**URL**: `PATCH /game/options`

**Request:**

```json
{
  "first_time_play": false,
  "happy_map_position": 3,
  "language": "ar"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Game options synced",
  "gameOptions": {}
}
```

---

### Synchroniser données du jeu

**URL**: `PATCH /game/data`

**Request:**

```json
{
  "movment_hint_show": true,
  "ledder_hint_show": true,
  "use_hint_show": false,
  "hang_hint_show": true,
  "attack_skill": true,
  "climb_skill": false
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Game data synced",
  "gameData": {}
}
```

---

## Synchronisation Offline

### Mode offline - Approche recommandée

1. **Offline**: Accumuler les données localement
2. **Online**: Envoyer le lot complet

**URL**: `PATCH /game/sync` (endpoint legacy compatible)

**Request (Sync complet après offline):**

```json
{
  "levelsData": {
    "1": {
      "chokolata_collected": 30,
      "eggs_collected": 2,
      "diamond_collected": 2,
      "time": 125,
      "score": 8500,
      "chokolate_taked_ids": [true, true, true],
      "eggs_taked_ids": [true, true],
      "diamonds_taked_ids": [true, true],
      "game_won": true,
      "level_unlocked": true,
      "player_position_name": "exit_portal",
      "happy_letters": {
        "H": true,
        "A": false,
        "P": false,
        "P2": false,
        "Y": false
      }
    },
    "2": {
      "chokolata_collected": 15,
      "eggs_collected": 1,
      "diamond_collected": 0,
      "time": 200,
      "score": 3500,
      "chokolate_taked_ids": [true, true, true],
      "eggs_taked_ids": [true],
      "diamonds_taked_ids": [],
      "game_won": false,
      "level_unlocked": false,
      "player_position_name": "checkpoint_2",
      "happy_letters": {
        "H": false,
        "A": false,
        "P": true,
        "P2": false,
        "Y": false
      }
    }
  },
  "totalScore": 12000,
  "totalPlayTime": 325
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Game state synced successfully",
  "gameProfile": {
    "userId": "user_12345",
    "totalScore": 12000,
    "totalPlayTime": 325,
    "currentLevel": 3,
    "lastSyncAt": "2026-03-02T10:45:00Z"
  }
}
```

---

## Exemples cURL

### 1. Enregistrement

```bash
curl -X POST "http://localhost:3000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joueur@example.dz",
    "password": "MdpSecure123!",
    "fullName": "Ahmed Ben Ali",
    "age": 28,
    "phone": "+213612345678",
    "wilaya": "Alger",
    "physicalAddress": "123 Rue de la Révolution, Alger"
  }'
```

### 2. Connexion

```bash
curl -X POST "http://localhost:3000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joueur@example.dz",
    "password": "MdpSecure123!"
  }'
```

### 3. Charger l'état du jeu

```bash
curl -X GET "http://localhost:3000/game/state" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### 4. Soumettre un niveau

```bash
curl -X POST "http://localhost:3000/game/level/submit" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "levelId": 1,
    "chokolata_collected": 30,
    "eggs_collected": 2,
    "diamond_collected": 2,
    "time": 125,
    "score": 8500,
    "chokolate_taked_ids": [true, true, true],
    "eggs_taked_ids": [true, true],
    "diamonds_taked_ids": [true, true],
    "game_won": true,
    "level_unlocked": true,
    "player_position_name": "exit_portal",
    "happy_letters": {
      "H": true,
      "A": false,
      "P": false,
      "P2": false,
      "Y": false
    }
  }'
```

### 5. Synchroniser inventaire

```bash
curl -X PATCH "http://localhost:3000/game/levels/inventory" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "1": {
      "have": { "shield": true, "potion": true },
      "taked": { "shield": true, "potion": false }
    }
  }'
```

### 6. Synchroniser options

```bash
curl -X PATCH "http://localhost:3000/game/options" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "first_time_play": false,
    "happy_map_position": 1,
    "language": "ar"
  }'
```

---

## Notes Importantes

- Remplacer `YOUR_TOKEN_HERE` par le token JWT obtenu à l'authentification
- L'URL de base est par défaut `http://localhost:3000` en développement
- Tous les timestamps sont en ISO 8601 format
- Les endpoints acceptent `Content-Type: application/json`
- Les réponses incluent toujours un champ `success: boolean`
