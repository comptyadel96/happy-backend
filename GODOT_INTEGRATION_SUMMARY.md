# Résumé des Changements - Intégration Godot API

## Date: 2 Mars 2026

### Changements effectués pour intégrer les spécifications du développeur Godot

---

## 1. Schéma Prisma (`prisma/schema.prisma`)

### Ajouts au modèle `User`:

- `wilaya?: String` - Champ pour la région/province (Algérie)

### Ajouts au modèle `GameProfile`:

Remplacé les champs génériques par des champs spécifiques à Godot:

```prisma
levelsData      Json  // Données complètes de chaque niveau
levelsInventory Json  // Items collectés par niveau (have/taked)
levelsStates    Json  // États des triggers/portes par niveau
levelsMissions  Json  // Missions complétées par niveau
gameOptions     Json  // Options du jeu (langue, position, etc)
gameData        Json  // Données du jeu (hints, skills, etc)
```

---

## 2. Fichiers DTO créés

### `src/game/dto/level-data.dto.ts`

Nouvelle classe pour structurer les données de niveau:

- `LevelDataDto`: Structure complète d'un niveau
- `HappyLettersDto`: Structure des 5 lettres "HAPPY"
- `SubmitLevelDataDto`: Wrapper pour soumission

**Spécifications incluses:**

- 10 niveaux max supportés
- Collectibles: chocolats, oeufs, diamants
- Happy letters: H, A, P, P2, Y
- Checkpoint pour reprendre

### `src/game/dto/game-state.dto.ts`

Classes pour synchroniser l'état du jeu:

- `GameOptionsDto`: Options globales (langue, position)
- `GameDataDto`: Données du jeu (hints, skills)
- `SyncGameStateDto`: Synchronisation complète
- `InventoryItemDto`: Structure des inventaires
- `LevelStateDto`: Structure des états de niveau

---

## 3. Mise à jour des DTOs existants

### `src/auth/dto/register.dto.ts`

Ajout du champ `wilaya`:

- Champ optionnel pour tous les utilisateurs
- Stocké lors de l'enregistrement
- Utilisable pour les statistiques régionales

---

## 4. Mise à jour du Service (`src/game/game.service.ts`)

### Nouvelles méthodes:

1. **`submitLevelData(userId, levelData)`**
   - Enregistre les données complètes d'un niveau
   - Met à jour le score total et le temps de jeu
   - Déverrouille le niveau suivant si complété

2. **`syncLevelsInventory(userId, levelsInventory)`**
   - Synchronise les items collectés par niveau
   - Format: `levels_inventory[levelId]["have"|"taked"][itemName]`

3. **`syncLevelsStates(userId, levelsStates)`**
   - Synchronise les états des portes/leviers/triggers
   - Format: `levels_states[levelId][stateName] = bool`

4. **`syncLevelsMissions(userId, levelsMissions)`**
   - Synchronise les missions complétées
   - Format: `levels_missions[levelId][missionName] = bool`

5. **`syncGameOptions(userId, gameOptions)`**
   - Synchronise les options du jeu
   - Langue, position sur la carte, first_time_play

6. **`syncGameData(userId, gameData)`**
   - Synchronise les hints et skills débloqués
   - 6 hints + 2 skills

7. **`getCompleteGameState(userId)`**
   - Récupère l'état complet du jeu
   - Utilisé au démarrage pour charger l'état sauvegardé

---

## 5. Mise à jour du Contrôleur (`src/game/game.controller.ts`)

### Nouveaux endpoints:

| Méthode | Endpoint                 | Description                             |
| ------- | ------------------------ | --------------------------------------- |
| POST    | `/game/level/submit`     | Soumettre données complètes d'un niveau |
| PATCH   | `/game/levels/inventory` | Synchroniser inventaire des niveaux     |
| PATCH   | `/game/levels/states`    | Synchroniser états des niveaux          |
| PATCH   | `/game/levels/missions`  | Synchroniser missions des niveaux       |
| PATCH   | `/game/options`          | Synchroniser options du jeu             |
| PATCH   | `/game/data`             | Synchroniser données du jeu             |
| GET     | `/game/state`            | Récupérer état complet pour Godot       |

### Documentation Swagger:

- Tous les endpoints incluent des exemples d'utilisation
- Codes d'erreur HTTP documentés
- Descriptions complètes des champs

---

## 6. Mise à jour du Service d'Auth (`src/auth/auth.service.ts`)

### Changements:

- Extraire le champ `wilaya` du DTO
- Stocker `wilaya` lors de la création de l'utilisateur
- Compatible avec les enregistrements adultes et mineurs

---

## 7. Documentation créée

### `GODOT_API_GUIDE.md`

Guide complet pour le développeur Godot incluant:

- Structure des données pour 10 niveaux
- Limites maximales par niveau
- Exemples de tous les endpoints
- Format des requêtes/réponses
- Flux d'utilisation recommandé
- Codes d'erreur HTTP
- Notes sur l'authentification et l'offline mode

---

## 8. Structure des Données Godot

### Limites par niveau (tableau complet):

```
Niveau 1-2: 30 chocolats, 2 diamants, 2 oeufs
Niveau 3,5,7: 20 chocolats, 1 diamant, 2 oeufs
Niveau 4,6,8: 40 chocolats, 1 diamant, 2 oeufs
Niveau 9: 30 chocolats, 1 diamant, 20 oeufs
Niveau 10: 30 chocolats, 2 diamants, 2 oeufs
```

### Elements spéciaux par niveau:

- **Niveau 1**: BarnDoor, CaveFarmDoor
- **Niveau 2**: LeverElectricity
- **Niveau 3**: LeverRight, LeverStock, PlatformDoor
- **Niveau 4**: LeverLeft, LeverCenter
- **Niveau 5**: BasmentDoor, HouseDoor, Faza3a
- **Niveau 6**: CaveCompleted

### Missions:

- Actuellement une seule mission: "StrangerImage" au niveau 1

### Happy Letters:

- H, A, P, P2, Y collectables dans les niveaux

---

## Flux de Données Recommandé

```
1. Démarrage du jeu
   → GET /game/state (charger état sauvegardé)

2. Pendant le jeu
   → PATCH /game/levels/inventory (items collectés)
   → PATCH /game/levels/states (doors/levers activés)

3. Fin de niveau
   → POST /game/level/submit (données complètes)

4. Avant de quitter
   → PATCH /game/options (options changées)
   → PATCH /game/data (hints/skills changés)
```

---

## Authentification

- **Token requis**: JWT Bearer token en header `Authorization: Bearer {token}`
- **Durée**: 7 jours
- **Scope**: Toutes les données sont liées à l'utilisateur authentifié
- **Wilaya**: Enregistrée à l'inscription pour les statistiques régionales

---

## Compatibilité

✅ Tous les endpoints existants restent fonctionnels
✅ Nouveaux endpoints sont additionnels
✅ Schema Prisma étendu (pas de changements rétroactifs)
✅ TypeScript compilé sans erreurs
✅ DTOs validés avec class-validator

---

## Prochaines Étapes Recommandées

1. **Test des endpoints**: Valider que tous les endpoints répondent correctement
2. **Intégration Godot**: Implémenter les appels API côté Godot
3. **Offline mode**: Tester la synchronisation offline-to-online
4. **Migration des données**: Si des données existantes doivent être migrées
5. **Monitoring**: Ajouter des logs pour les synchronisations de niveau

---

## Notes Importantes

- Les données JSON offrent de la flexibilité pour futures extensions
- Les limites par niveau sont applicables côté client Godot
- Le serveur valide les scores mais accepte les données flexibles
- Les timestamps `lastSyncAt` et `lastPlayedAt` sont automatiques
- Tous les endpoints supportent le mode offline avec `skipValidation: true`
