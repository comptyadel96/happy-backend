# 🎮 Guide Complet pour Développeur Godot

> **Version**: 2.0  
> **Date**: 27 février 2026  
> **Backend**: NestJS + Prisma + MongoDB  
> **Status**: ✅ Production Ready

---

## 📌 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Structure de données recommandée](#structure-de-données-recommandée)
3. [Architecture améliorée](#architecture-améliorée)
4. [Intégration API](#intégration-api)
5. [Gestion online/offline](#gestion-onlineoffline)
6. [Synchronisation des données](#synchronisation-des-données)
7. [Gestion des erreurs](#gestion-des-erreurs)
8. [Checklist d'intégration](#checklist-dintégration)

---

## Vue d'ensemble

Le système de collecte d'objets permet aux joueurs de collecter **5 types d'items différents** avec un système de points automatique.

### Types d'items supportés

| Item | Points | Max/Niveau | Utilité |
|------|--------|------------|---------|
| 🍫 **Chocolat** | 10 | 30 | Item courant |
| 🥚 **Œuf** | 25 | 20 | Item spécial |
| 💎 **Diamant** | 100 | 5 | Premium/rare |
| ⭐ **Étoile** | 50 | 10 | Succès/objectif |
| 🪙 **Pièce** | 1 | 100 | Monnaie |

---

## Structure de données recommandée

### Structure LevelData optimisée

```gdscript
class_name LevelData
extends RefCounted

# 📊 Compteurs d'objets collectés
var chokolata_collected: int = 0      # Nombre de chocolats collectés
var eggs_collected: int = 0           # Nombre d'œufs collectés
var diamond_collected: int = 0        # Nombre de diamants collectés
var stars_collected: int = 0          # Nombre d'étoiles collectées
var coins_collected: int = 0          # Nombre de pièces collectées

# 🎯 Performance et progression
var best_time: int = 0                # Meilleur temps en secondes
var best_score: int = 0               # Meilleur score du niveau
var total_score_earned: int = 0       # Score total accumulé
var game_won: bool = false            # Niveau complété
var level_unlocked: bool = false      # Niveau déverrouillé

# 🔄 Indices d'objets collectés (pour éviter les doublons)
var chokolate_taked: Array[bool] = []  # Positions de chocolats pris
var eggs_taked: Array[bool] = []       # Positions d'œufs pris
var diamonds_taked: Array[bool] = []   # Positions de diamants pris
var stars_taked: Array[bool] = []      # Positions d'étoiles prises
var coins_taked: Array[bool] = []      # Positions de pièces prises

# 📍 État du joueur dans le niveau
var player_position_name: StringName = &""  # Spawn point actuel

# 🔤 Lettres "HAPPY" collectées (bonus optionnel)
var happy_letters: Dictionary[StringName, bool] = {
    &"H": false,
    &"A": false,
    &"P": false,
    &"P2": false,
    &"Y": false,
}
```

### GameData persistante

```gdscript
# Données de jeu globales
var game_data: Dictionary[StringName, Variant] = {
    # 💡 Tutoriels et hints
    "movment_hint_show": true,
    "ledder_hint_show": true,
    "use_hint_show": true,
    "hang_hint_show": true,
    
    # 🎮 Compétences débloquées
    "attack_skill": false,
    "climb_skill": false,
}

# Options de jeu du joueur
var game_options: Dictionary[StringName, Variant] = {
    "first_time_play": true,           # Première connexion
    "happy_map_position": 1,           # Position actuelle dans la map
    "language": "ar",                  # Langue (ar, en, fr, etc)
}

# État des levers et portes par niveau
var levels_states: Dictionary[String, Dictionary] = {
    "1": {"BarnDoor": false, "CaveFarmDoor": false},
    "2": {"LeverElectricity": false},
    "3": {"LeverRight": false, "LeverStock": false, "PlatformDoor": false},
    "4": {"LeverLeft": false, "LeverCenter": false},
    "5": {"BasmentDoor": false, "HouseDoor": false, "Faza3a": false},
    "6": {"CaveCompleted": false},
    "7": {},
    "8": {},
}

# Missions par niveau
var levels_mission: Dictionary[String, Dictionary] = {
    "1": {"StrangerImage": false},
}

# Inventaire du joueur par niveau
var levels_invntory: Dictionary[StringName, Dictionary] = {
    "1": {},
    "2": {
        "have": {"key": false, "family_image": false},
        "taked": {"key": false, "family_image": false},
    },
    "3": {
        "have": {"lever": false},
        "taked": {"lever": false},
    },
    "4": {},
    "5": {
        "have": {"key": false, "tshirt": false, "hat": false},
        "taked": {"key": false, "tshirt": false, "hat": false},
    },
    "6": {
        "have": {"mask": false},
        "taked": {"mask": false},
    },
}
```

### Constantes de configuration

```gdscript
# ⚙️ Limites maximales d'objets par niveau
const LEVELS_DATA: Dictionary = {
    1: {"chokolate_max": 30, "diamond_max": 2, "eggs_max": 2, "stars_max": 3, "coins_max": 50},
    2: {"chokolate_max": 30, "diamond_max": 2, "eggs_max": 2, "stars_max": 3, "coins_max": 50},
    3: {"chokolate_max": 20, "diamond_max": 1, "eggs_max": 2, "stars_max": 2, "coins_max": 30},
    4: {"chokolate_max": 40, "diamond_max": 1, "eggs_max": 2, "stars_max": 2, "coins_max": 40},
    5: {"chokolate_max": 20, "diamond_max": 1, "eggs_max": 2, "stars_max": 3, "coins_max": 30},
    6: {"chokolate_max": 40, "diamond_max": 1, "eggs_max": 2, "stars_max": 3, "coins_max": 40},
    7: {"chokolate_max": 20, "diamond_max": 1, "eggs_max": 2, "stars_max": 2, "coins_max": 30},
    8: {"chokolate_max": 40, "diamond_max": 1, "eggs_max": 2, "stars_max": 3, "coins_max": 40},
    9: {"chokolate_max": 30, "diamond_max": 1, "eggs_max": 20, "stars_max": 5, "coins_max": 100},
    10: {"chokolate_max": 30, "diamond_max": 2, "eggs_max": 2, "stars_max": 5, "coins_max": 50},
}

# 🏆 Points attribués par type
const ITEM_POINTS: Dictionary = {
    "chocolate": 10,
    "egg": 25,
    "diamond": 100,
    "star": 50,
    "coin": 1,
}
```

---

## Architecture améliorée

### Gestionnaire de jeu centralisé

```gdscript
# GameManager.gd - Singleton de gestion globale
extends Node

const API_URL = "http://localhost:3000"
var jwt_token: String = ""
var current_level: int = 1
var game_profile: LevelData = LevelData.new()
var is_offline: bool = false
var pending_collections: Array = []

signal item_collected(item_type: String, points: int)
signal level_completed
signal sync_started
signal sync_completed
signal connection_status_changed(is_online: bool)

func _ready():
    set_multiplayer_authority(multiplayer.get_unique_id())
    check_internet_connection()

func check_internet_connection() -> bool:
    # Vérifie la connectivité internet
    var response = await ping_server()
    is_offline = response == null
    connection_status_changed.emit(!is_offline)
    return !is_offline

func ping_server() -> Variant:
    var http = HTTPRequest.new()
    add_child(http)
    http.request(API_URL)
    var result = await http.request_completed
    http.queue_free()
    return result[1] if result else null
```

### Contrôleur de collecte optimisé

```gdscript
# ItemCollector.gd - Gère la collecte d'objets
extends Node

@onready var game_manager = GameManager
@export var item_type: String = "chocolate"
@export var item_index: int = 0
@export var particle_scene: PackedScene

var collected: bool = false

func _on_item_touched(body: Node) -> void:
    if collected or body.name != "Player":
        return
    
    collected = true
    play_collection_animation()
    
    if game_manager.is_offline:
        collect_offline()
    else:
        await collect_online()
    
    queue_free()

func collect_online() -> void:
    var result = await game_manager.collect_item(
        game_manager.current_level,
        item_type,
        item_index
    )
    
    if result.valid:
        game_manager.item_collected.emit(item_type, result.earnedPoints)
    else:
        handle_collection_error(result.error)

func collect_offline() -> void:
    # Stocke localement pour synchronisation ultérieure
    var collection_data = {
        "level": game_manager.current_level,
        "type": item_type,
        "index": item_index,
        "timestamp": Time.get_ticks_msec()
    }
    game_manager.pending_collections.append(collection_data)
    
    # Assume la collecte localement
    var points = ITEM_POINTS.get(item_type, 0)
    game_manager.item_collected.emit(item_type, points)

func play_collection_animation() -> void:
    match item_type:
        "chocolate":
            play_particle_effect("chocolate_sparkle")
            play_sound("res://sounds/collect_chocolate.ogg")
        "diamond":
            play_particle_effect("diamond_burst")
            play_sound("res://sounds/collect_diamond.ogg")
            show_popup("💎 Diamant collecté!")
        # ... autres types
```

---

## Intégration API

### Manager de communication API

```gdscript
# APIManager.gd - Gère toutes les requêtes API
extends Node

const API_BASE = "http://localhost:3000"

func collect_item(level_id: int, item_type: String, item_index: int, skip_validation: bool = false) -> Dictionary:
    var url = API_BASE + "/game/item-collect"
    var headers = [
        "Authorization: Bearer " + GameManager.jwt_token,
        "Content-Type: application/json"
    ]
    
    var payload = {
        "levelId": level_id,
        "itemType": item_type,
        "itemIndex": item_index,
        "skipValidation": skip_validation
    }
    
    var http = HTTPRequest.new()
    add_child(http)
    http.request(url, headers, HTTPClient.METHOD_PATCH, JSON.stringify(payload))
    
    var response = await http.request_completed
    http.queue_free()
    
    if response[1] == 200:
        var data = JSON.parse_string(response[3].get_string_from_utf8())
        return {
            "valid": true,
            "earnedPoints": data.get("earnedPoints", 0),
            "totalScore": data.get("levelProgress", {}).get("totalScore", 0)
        }
    else:
        var error_data = JSON.parse_string(response[3].get_string_from_utf8())
        return {
            "valid": false,
            "error": error_data.get("error", "Unknown error")
        }

func complete_level(level_id: int, score: int, time_spent: int) -> Dictionary:
    var url = API_BASE + "/game/level-complete"
    var headers = [
        "Authorization: Bearer " + GameManager.jwt_token,
        "Content-Type: application/json"
    ]
    
    var payload = {
        "levelId": level_id,
        "score": score,
        "timeSpent": time_spent
    }
    
    var http = HTTPRequest.new()
    add_child(http)
    http.request(url, headers, HTTPClient.METHOD_PATCH, JSON.stringify(payload))
    
    var response = await http.request_completed
    http.queue_free()
    
    if response[1] == 200:
        return {"success": true}
    else:
        return {"success": false, "error": "Level completion failed"}

func sync_offline_data() -> Dictionary:
    if GameManager.pending_collections.is_empty():
        return {"success": true, "synced": 0}
    
    # Prépare les données pour synchronisation
    var profile = await get_game_profile()
    
    var url = API_BASE + "/game/sync"
    var headers = [
        "Authorization: Bearer " + GameManager.jwt_token,
        "Content-Type: application/json"
    ]
    
    var payload = {
        "levelsData": profile.levelsData,
        "totalScore": profile.totalScore,
        "totalPlayTime": profile.totalPlayTime
    }
    
    var http = HTTPRequest.new()
    add_child(http)
    http.request(url, headers, HTTPClient.METHOD_PATCH, JSON.stringify(payload))
    
    var response = await http.request_completed
    http.queue_free()
    
    if response[1] == 200:
        GameManager.pending_collections.clear()
        return {"success": true, "synced": len(GameManager.pending_collections)}
    else:
        return {"success": false, "error": "Sync failed"}

func get_game_profile() -> Dictionary:
    var url = API_BASE + "/game/profile"
    var headers = [
        "Authorization: Bearer " + GameManager.jwt_token
    ]
    
    var http = HTTPRequest.new()
    add_child(http)
    http.request(url, headers, HTTPClient.METHOD_GET)
    
    var response = await http.request_completed
    http.queue_free()
    
    if response[1] == 200:
        return JSON.parse_string(response[3].get_string_from_utf8())
    else:
        return {}

func get_player_stats() -> Dictionary:
    var url = API_BASE + "/game/stats"
    var headers = [
        "Authorization: Bearer " + GameManager.jwt_token
    ]
    
    var http = HTTPRequest.new()
    add_child(http)
    http.request(url, headers, HTTPClient.METHOD_GET)
    
    var response = await http.request_completed
    http.queue_free()
    
    if response[1] == 200:
        return JSON.parse_string(response[3].get_string_from_utf8())
    else:
        return {}
```

---

## Gestion online/offline

### Détection de connexion automatique

```gdscript
# NetworkMonitor.gd - Surveille la connexion Internet
extends Node

var connection_timer: Timer
var last_known_state: bool = true

signal connection_lost
signal connection_restored

func _ready():
    connection_timer = Timer.new()
    add_child(connection_timer)
    connection_timer.timeout.connect(_check_connection)
    connection_timer.start(5.0)  # Vérifier chaque 5 secondes

func _check_connection() -> void:
    var is_online = await ping_server()
    
    if is_online and !last_known_state:
        # Connexion rétablie
        connection_restored.emit()
        GameManager.sync_offline_data()
    elif !is_online and last_known_state:
        # Connexion perdue
        connection_lost.emit()
        GameManager.is_offline = true
    
    last_known_state = is_online

func ping_server() -> bool:
    var http = HTTPRequest.new()
    add_child(http)
    var error = http.request("http://localhost:3000")
    
    if error != OK:
        http.queue_free()
        return false
    
    var response = await http.request_completed
    http.queue_free()
    
    return response[1] != 0 if response else false
```

---

## Synchronisation des données

### Strategy de synchronisation

```gdscript
# DataSyncManager.gd - Gère la synchronisation des données
extends Node

class_name DataSyncManager

var sync_in_progress: bool = false
var last_sync: int = 0
var sync_interval: int = 30000  # 30 secondes

signal sync_progress(items_synced: int, total_items: int)
signal sync_completed(success: bool, message: String)

func should_sync() -> bool:
    if sync_in_progress:
        return false
    if GameManager.pending_collections.is_empty():
        return false
    
    var time_since_last = Time.get_ticks_msec() - last_sync
    return time_since_last >= sync_interval

func sync_now() -> void:
    if sync_in_progress:
        return
    
    sync_in_progress = true
    
    var total = len(GameManager.pending_collections)
    var synced = 0
    
    for collection in GameManager.pending_collections:
        var result = await APIManager.collect_item(
            collection.level,
            collection.type,
            collection.index,
            false  # Validation activée pour sync
        )
        
        if result.valid:
            synced += 1
        
        sync_progress.emit(synced, total)
    
    # Synchronise l'état global
    var sync_result = await APIManager.sync_offline_data()
    
    sync_in_progress = false
    last_sync = Time.get_ticks_msec()
    
    if sync_result.success:
        sync_completed.emit(true, "✅ %d objets synchronisés" % synced)
    else:
        sync_completed.emit(false, "❌ Erreur de synchronisation")
```

---

## Gestion des erreurs

### Gestion complète des erreurs

```gdscript
# ErrorHandler.gd - Gère les erreurs d'API
extends Node

enum ErrorType {
    ALREADY_COLLECTED,
    LIMIT_EXCEEDED,
    INVALID_LEVEL,
    NETWORK_ERROR,
    AUTHENTICATION_ERROR,
    UNKNOWN
}

func handle_collection_error(error_message: String) -> ErrorType:
    match error_message.to_lower():
        "item already collected":
            show_error("❌ Cet objet a déjà été collecté!")
            return ErrorType.ALREADY_COLLECTED
        
        _ if "maximum" in error_message.to_lower() and "exceeds" in error_message.to_lower():
            show_error("❌ Limite d'objets atteinte pour ce niveau")
            return ErrorType.LIMIT_EXCEEDED
        
        "level not found":
            show_error("❌ Ce niveau n'existe pas")
            return ErrorType.INVALID_LEVEL
        
        _:
            show_error("❌ Erreur: " + error_message)
            return ErrorType.UNKNOWN

func show_error(message: String) -> void:
    print("[ERROR] " + message)
    # Affiche une notification visuelle au joueur
    # Exemple: PopupLabel, Toast notification, etc
```

---

## Checklist d'intégration

### Phase 1: Configuration de base

- [ ] Créer `GameManager.gd` (singleton)
- [ ] Créer `APIManager.gd` pour les requêtes HTTP
- [ ] Créer `NetworkMonitor.gd` pour la détection de connexion
- [ ] Implémenter la classe `LevelData` avec toutes les variables
- [ ] Créer `LEVELS_DATA` constant avec limites

### Phase 2: Collecte d'objets

- [ ] Créer `ItemCollector.gd` attaché à chaque objet
- [ ] Implémenter `collect_online()` pour la collecte en ligne
- [ ] Implémenter `collect_offline()` pour la collecte hors ligne
- [ ] Ajouter animations et effets sonores
- [ ] Tester chaque type d'objet (5 types)

### Phase 3: Gestion de niveau

- [ ] Implémenter la complétion de niveau
- [ ] Afficher le score obtenu
- [ ] Tracker le meilleur temps
- [ ] Déverrouiller le prochain niveau

### Phase 4: Synchronisation

- [ ] Créer `DataSyncManager.gd`
- [ ] Implémenter la détection de reconnexion
- [ ] Synchroniser automatiquement au reconnexion
- [ ] Afficher l'état de synchronisation
- [ ] Tester offline → online → offline

### Phase 5: Tests

- [ ] Collecter tous les objets d'un niveau
- [ ] Compléter un niveau
- [ ] Tester le mode offline
- [ ] Tester la synchronisation offline
- [ ] Vérifier les scores dans le dashboard
- [ ] Tester avec internet instable
- [ ] Vérifier la prévention des doublons

---

## 📋 Points importants

### ✅ À faire

- ✅ Utiliser `skipValidation: true` en mode offline
- ✅ Débouncer les clics pour éviter les doublons
- ✅ Vérifier la connexion régulièrement (toutes les 5 sec)
- ✅ Synchroniser automatiquement au reconnexion
- ✅ Afficher le feedback visuel de collecte
- ✅ Stocker le token JWT de manière sécurisée

### ❌ À éviter

- ❌ Envoyer plusieurs requêtes pour le même objet
- ❌ Oublier le `Authorization: Bearer` header
- ❌ Utiliser des indices de tableau hors limites
- ❌ Ne pas gérer les erreurs de réseau
- ❌ Oublier de synchroniser après reconnexion

---

## 🧪 Exemples de test

### Test simple de collecte

```gdscript
# Teste la collecte d'un chocolat
func test_collect_chocolate():
    var result = await APIManager.collect_item(1, "chocolate", 0)
    assert(result.valid, "Collecte devrait réussir")
    assert(result.earnedPoints == 10, "Devrait gagner 10 points")
    print("✅ Test collecte chocolat: OK")
```

### Test du mode offline

```gdscript
# Simule une collecte hors ligne
func test_offline_collection():
    GameManager.is_offline = true
    var collector = ItemCollector.new()
    await collector.collect_offline()
    assert(len(GameManager.pending_collections) > 0, "Données stockées localement")
    print("✅ Test offline: OK")
```

---

## 📞 Support API

**Base URL**: `http://localhost:3000`

### Endpoints principaux

```
PATCH /game/item-collect    - Collecter un objet
PATCH /game/level-complete  - Compléter un niveau
GET   /game/stats           - Obtenir les statistiques
PATCH /game/sync            - Synchroniser les données offline
```

### Headers requis

```gdscript
"Authorization: Bearer <votre_jwt_token>"
"Content-Type: application/json"
```

---

## 🎉 Conclusion

Vous avez maintenant tout ce qu'il faut pour intégrer complètement le système de collecte d'objets dans votre jeu Godot!

**Questions?** Consultez le code du backend ou les exemples fournis.

**Bon développement! 🚀**
