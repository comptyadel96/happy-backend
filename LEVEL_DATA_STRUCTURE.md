# Structure des Données de Niveau - Spécification Godot

## Données par Niveau (levelsData)

Chaque niveau a cette structure JSON immuable:

```json
{
  "1": {
    "chokolate_collected": 0,
    "eggs_collected": 0,
    "diamond_collected": 0,
    "time": 0,
    "score": 0,
    "level_won": false,
    "level_unlocked": false,
    "chokolate_taked": [],
    "eggs_taked": [],
    "diamonds_taked": [],
    "player_position_name": "",
    "happy_letters": {
      "H": false,
      "A": false,
      "P": false,
      "P2": false,
      "Y": false
    }
  }
}
```

### Champs Détails:

| Champ | Type | Description |
|-------|------|-------------|
| `chokolate_collected` | int | Nombre de chocolats collectés dans le niveau |
| `eggs_collected` | int | Nombre d'œufs collectés dans le niveau |
| `diamond_collected` | int | Nombre de diamants collectés dans le niveau |
| `time` | int | Temps passé dans le niveau (en secondes) |
| `score` | int | Score du niveau (augmente avec la rejouabilité) |
| `level_won` | bool | Vérifie si le niveau est complété |
| `level_unlocked` | bool | Vérifie si le niveau est déverrouillé |
| `chokolate_taked` | array[int] | Tableau d'indices des chocolats collectés |
| `eggs_taked` | array[int] | Tableau d'indices des œufs collectés |
| `diamonds_taked` | array[int] | Tableau d'indices des diamants collectés |
| `player_position_name` | string | Checkpoint (vide au démarrage) |
| `happy_letters` | object | Dict des lettres H/A/P/P2/Y collectées |

---

## Valeurs Max par Niveau

```json
{
  "1": {"chokolate_max": 30, "diamond_max": 2, "eggs_max": 2},
  "2": {"chokolate_max": 30, "diamond_max": 2, "eggs_max": 2},
  "3": {"chokolate_max": 24, "diamond_max": 1, "eggs_max": 3},
  "4": {"chokolate_max": 36, "diamond_max": 1, "eggs_max": 1},
  "5": {"chokolate_max": 20, "diamond_max": 1, "eggs_max": 2},
  "6": {"chokolate_max": 40, "diamond_max": 1, "eggs_max": 2},
  "7": {"chokolate_max": 20, "diamond_max": 1, "eggs_max": 2},
  "8": {"chokolate_max": 40, "diamond_max": 1, "eggs_max": 2},
  "9": {"chokolate_max": 30, "diamond_max": 1, "eggs_max": 20}
}
```

---

## Inventaire des Niveaux (levels_inventory)

```json
{
  "2": {
    "have": {"key": false, "family_image": false},
    "taked": {"key": false, "family_image": false}
  },
  "3": {
    "have": {"lever": false},
    "taked": {"lever": false}
  },
  "5": {
    "have": {"key": false, "tshirt": false, "hat": false},
    "taked": {"key": false, "tshirt": false, "hat": false}
  },
  "6": {
    "have": {"mask": false},
    "taked": {"mask": false}
  }
}
```

Structure: `levels_inventory[LevelId]["have"][item_name]` ou `[taked]`

---

## Missions des Niveaux (levelsMissions)

```json
{
  "1": {
    "StrangerImage": false,
    "StrangerImageTask": false
  }
}
```

Structure: `levelsMissions[LevelId][MissionName]`

---

## États des Niveaux (levelsStates)

```json
{
  "1": {"BarnDoor": false, "CaveFarmDoor": false},
  "2": {"LeverElectricity": false},
  "3": {"LeverRight": false, "LeverStock": false, "PlatformDoor": false},
  "4": {"LeverLeft": false, "LeverCenter": false},
  "5": {"BasmentDoor": false, "HouseDoor": false, "Faza3a": false},
  "6": {"CaveCompleted": false}
}
```

Structure: `levelsStates[LevelId][StateName]`

---

## Options du Jeu (gameOptions)

```json
{
  "first_time_play": true,
  "happy_map_position": 1,
  "music": 1.0,
  "sound": 1.0,
  "vibration": true,
  "language": "ar"
}
```

---

## Données du Jeu (gameData)

```json
{
  "movment_hint_show": true,
  "ledder_hint_show": true,
  "use_hint_show": true,
  "hang_hint_show": true,
  "attack_hint_show": true,
  "attack_skill": false,
  "climb_skill": false
}
```

---

## Endpoints API Correspondants

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/game/profile` | GET | Récupère tous les profils de jeu |
| `/game/level/:levelId` | GET | Récupère les contraintes d'un niveau |
| `/game/collect-item` | POST | Collecte un item |
| `/game/level/:levelId/complete` | POST | Marque un niveau comme complété |
| `/game/sync` | POST | Synchronise l'état du jeu offline→online |

---

## Notes de Déploiement

✅ **Niveaux 1-6**: Complètement implémentés  
✅ **Niveaux 7-9**: Support ajouté mais à tester en jeu  
✅ **Diamonds**: Ajoutés au modèle LevelData  
✅ **Redis Adapter**: Configuré pour WebSocket scaling  
✅ **Docker**: Alpine + OpenSSL 3.0 compatible
