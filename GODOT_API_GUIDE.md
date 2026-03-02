# Guide des Endpoints Godot Game

Cet API fournit les endpoints nécessaires pour synchroniser et gérer l'état du jeu Godot avec le serveur NestJS.

## Vue d'ensemble de la structure des données

### Structure de données par niveau (10 niveaux max)

```json
{
  "levelId": 1,
  "chokolata_collected": 15,
  "eggs_collected": 2,
  "diamond_collected": 1,
  "time": 120,
  "score": 8500,
  "chokolate_taked_ids": [true, true, false, false, true],
  "eggs_taked_ids": [true, false],
  "diamonds_taked_ids": [true],
  "game_won": true,
  "level_unlocked": true,
  "player_position_name": "checkpoint_1",
  "happy_letters": {
    "H": false,
    "A": false,
    "P": false,
    "P2": false,
    "Y": false
  }
}
```

### Limites par niveau

```json
{
  "1": { "chokolate_max": 30, "diamond_max": 2, "eggs_max": 2 },
  "2": { "chokolate_max": 30, "diamond_max": 2, "eggs_max": 2 },
  "3": { "chokolate_max": 20, "diamond_max": 1, "eggs_max": 2 },
  "4": { "chokolate_max": 40, "diamond_max": 1, "eggs_max": 2 },
  "5": { "chokolate_max": 20, "diamond_max": 1, "eggs_max": 2 },
  "6": { "chokolate_max": 40, "diamond_max": 1, "eggs_max": 2 },
  "7": { "chokolate_max": 20, "diamond_max": 1, "eggs_max": 2 },
  "8": { "chokolate_max": 40, "diamond_max": 1, "eggs_max": 2 },
  "9": { "chokolate_max": 30, "diamond_max": 1, "eggs_max": 20 },
  "10": { "chokolate_max": 30, "diamond_max": 2, "eggs_max": 2 }
}
```

---

## Endpoints API

### 1. Soumettre les données d'un niveau

**POST** `/game/level/submit`

Envoie les données complètes d'un niveau après sa completion.

**Headers requis:**

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**

```json
{
  "levelId": 1,
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

---

### 2. Synchroniser l'inventaire des niveaux

**PATCH** `/game/levels/inventory`

Synchronise les items disponibles et collectés pour chaque niveau.

**Headers requis:**

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**

```json
{
  "2": {
    "have": { "key": false, "family_image": false },
    "taked": { "key": false, "family_image": false }
  },
  "3": {
    "have": { "lever": false },
    "taked": { "lever": false }
  },
  "5": {
    "have": { "key": false, "tshirt": false, "hat": false },
    "taked": { "key": false, "tshirt": false, "hat": false }
  },
  "6": {
    "have": { "mask": false },
    "taked": { "mask": false }
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

### 3. Synchroniser les états des niveaux

**PATCH** `/game/levels/states`

Synchronise les états des portes, leviers, plateformes et autres triggers.

**Headers requis:**

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**

```json
{
  "1": { "BarnDoor": false, "CaveFarmDoor": false },
  "2": { "LeverElectricity": false },
  "3": { "LeverRight": false, "LeverStock": false, "PlatformDoor": false },
  "4": { "LeverLeft": false, "LeverCenter": false },
  "5": { "BasmentDoor": false, "HouseDoor": false, "Faza3a": false },
  "6": { "CaveCompleted": false }
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

### 4. Synchroniser les missions des niveaux

**PATCH** `/game/levels/missions`

Synchronise la progression des missions par niveau.

**Headers requis:**

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**

```json
{
  "1": { "StrangerImage": false }
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

### 5. Synchroniser les options du jeu

**PATCH** `/game/options`

Synchronise les options globales du jeu (langue, position sur la carte, etc).

**Headers requis:**

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**

```json
{
  "first_time_play": true,
  "happy_map_position": 1,
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

### 6. Synchroniser les données du jeu

**PATCH** `/game/data`

Synchronise les données du jeu comme les indices affichés et les compétences débloquées.

**Headers requis:**

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**

```json
{
  "movment_hint_show": true,
  "ledder_hint_show": true,
  "use_hint_show": true,
  "hang_hint_show": true,
  "attack_skill": false,
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

### 7. Récupérer l'état complet du jeu

**GET** `/game/state`

Récupère l'état complet du jeu pour synchroniser le client Godot au démarrage ou après reconnexion.

**Headers requis:**

```
Authorization: Bearer {access_token}
```

**Response (200):**

```json
{
  "success": true,
  "gameState": {
    "levelsData": {},
    "levelsInventory": {},
    "levelsStates": {},
    "levelsMissions": {},
    "gameOptions": {},
    "gameData": {},
    "currentLevel": 1,
    "totalScore": 0,
    "totalPlayTime": 0,
    "lastSyncAt": "2026-02-27T10:35:00Z"
  }
}
```

---

### 8. Profil du jeu (existant)

**GET** `/game/profile`

Récupère le profil complet du jeu du joueur.

---

### 9. Statistiques du joueur (existant)

**GET** `/game/stats`

Récupère les statistiques agrégées du joueur.

---

### 10. Synchroniser tout l'état du jeu (existant)

**PATCH** `/game/sync`

Synchronise l'état complet du jeu (ancien endpoint compatible).

---

## Points d'enregistrement et données Wilaya

### Enregistrement avec Wilaya

**POST** `/auth/register`

L'enregistrement inclut maintenant le champ `wilaya` (région/province).

**Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "fullName": "John Doe",
  "age": 25,
  "phone": "+213612345678",
  "wilaya": "Alger",
  "physicalAddress": "123 Rue de la Paix, Alger"
}
```

---

## Flux d'utilisation recommandé

### 1. Au démarrage du jeu

- Appeler `GET /game/state` pour charger l'état du jeu sauvegardé

### 2. Après chaque niveau complété

- Appeler `POST /game/level/submit` avec les données du niveau

### 3. Synchronisation périodique ou à la demande

- Appeler `PATCH /game/levels/inventory` pour synchroniser l'inventaire
- Appeler `PATCH /game/levels/states` pour synchroniser les états
- Appeler `PATCH /game/levels/missions` pour synchroniser les missions
- Appeler `PATCH /game/options` si les options ont changé
- Appeler `PATCH /game/data` si les données du jeu ont changé

### 4. Avant de quitter

- Appeler `GET /game/profile` pour vérifier la sauvegarde
- Ou appeler `PATCH /game/sync` pour une synchronisation globale d'urgence

---

## Codes d'erreur HTTP

| Code | Signification                              |
| ---- | ------------------------------------------ |
| 200  | Succès                                     |
| 201  | Créé avec succès                           |
| 400  | Données invalides                          |
| 401  | Non authentifié (token invalide ou absent) |
| 404  | Ressource non trouvée                      |
| 409  | Conflit (ex: email déjà utilisé)           |
| 500  | Erreur serveur                             |

---

## Notes importantes

1. **Authentification**: Tous les endpoints `/game/*` nécessitent un token JWT valide en header `Authorization: Bearer {token}`

2. **Offline Mode**: Le serveur peut accepter les données avec `skipValidation: true` pour le mode offline

3. **Idempotence**: Les endpoints `PATCH` sont idempotents - appeler deux fois avec les mêmes données devrait donner le même résultat

4. **Horodatage**: Le serveur enregistre automatiquement `lastPlayedAt` et `lastSyncAt` pour chaque synchronisation

5. **Limites**: Maximum 10 niveaux supportés avec les données spécifiées

6. **Stockage JSON**: Toutes les données de jeu sont stockées en JSON pour la flexibilité
