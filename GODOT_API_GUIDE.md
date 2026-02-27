# 🎮 Godot Game API Guide - Happy Backend

Ce guide explique comment intégrer votre jeu Godot avec le backend Happy pour gérer les scores, les œufs, les chocolats et l'authentification.

---

## 📋 Table des matières

1. [Configuration de base](#configuration-de-base)
2. [Authentification](#authentification)
3. [Récupération du profil joueur](#récupération-du-profil-joueur)
4. [Collecte d'items](#collecte-ditems)
5. [Fin de niveau](#fin-de-niveau)
6. [Synchronisation](#synchronisation)
7. [Exemples complets](#exemples-complets)

---

## 🔧 Configuration de base

### Variables d'environnement

Définissez ces variables dans votre projet Godot :

```gdscript
const BACKEND_URL = "http://localhost:3000"  # Ou votre URL de production
const API_VERSION = "v1"
var auth_token = ""  # Stocké après login
```

### Headers standards

Tous les endpoints (sauf login/register) nécessitent ce header :

```
Authorization: Bearer {token}
Content-Type: application/json
```

---

## 🔐 Authentification

### 1. Inscription d'un nouvel utilisateur

**Endpoint:** `POST /auth/register`

**Paramètres:**

```json
{
  "email": "joueur@example.com",
  "password": "SecurePass123",
  "fullName": "Jean Dupont",
  "age": 25,
  "phone": "+33612345678",
  "physicalAddress": "123 Rue de la Paix, 75000 Paris"
}
```

**Note sur l'âge:**

- **Si l'utilisateur a 18+ ans :** Fournir `phone` et `physicalAddress`
- **Si l'utilisateur a moins de 18 ans :** Fournir `phone` (du parent), `parentName`, `parentEmail`

**Réponse (201 Created):**

```json
{
  "user": {
    "id": "user_123",
    "email": "joueur@example.com",
    "fullName": "Jean Dupont",
    "age": 25,
    "role": "ADULT",
    "isActive": true,
    "createdAt": "2026-02-27T14:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Adult account created successfully"
}
```

**Code Godot:**

```gdscript
func register_player(email: String, password: String, full_name: String, age: int, phone: String, address: String = "") -> void:
	var url = BACKEND_URL + "/auth/register"
	var body = {
		"email": email,
		"password": password,
		"fullName": full_name,
		"age": age,
		"phone": phone,
		"physicalAddress": address
	}

	var http_request = HTTPRequest.new()
	add_child(http_request)
	http_request.request_completed.connect(_on_register_completed)
	http_request.request(url, [], HTTPClient.METHOD_POST, JSON.stringify(body))

func _on_register_completed(result: int, response_code: int, headers: PackedStringArray, body: PackedByteArray) -> void:
	if response_code == 201:
		var response = JSON.parse_string(body.get_string_from_utf8())
		auth_token = response["token"]
		print("Inscription réussie! Token: ", auth_token)
	else:
		print("Erreur inscription: ", body.get_string_from_utf8())
```

---

### 2. Connexion (Login)

**Endpoint:** `POST /auth/login`

**Paramètres:**

```json
{
  "email": "joueur@example.com",
  "password": "SecurePass123"
}
```

**Réponse (200 OK):**

```json
{
  "user": {
    "id": "user_123",
    "email": "joueur@example.com",
    "fullName": "Jean Dupont",
    "role": "ADULT"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Code Godot:**

```gdscript
func login(email: String, password: String) -> void:
	var url = BACKEND_URL + "/auth/login"
	var body = {
		"email": email,
		"password": password
	}

	var http_request = HTTPRequest.new()
	add_child(http_request)
	http_request.request_completed.connect(_on_login_completed)
	http_request.request(url, [], HTTPClient.METHOD_POST, JSON.stringify(body))

func _on_login_completed(result: int, response_code: int, headers: PackedStringArray, body: PackedByteArray) -> void:
	if response_code == 200:
		var response = JSON.parse_string(body.get_string_from_utf8())
		auth_token = response["token"]
		print("Connecté! Bienvenue: ", response["user"]["fullName"])
	else:
		print("Erreur connexion: ", body.get_string_from_utf8())
```

---

## 👤 Récupération du profil joueur

### 1. Obtenir le profil de jeu complet

**Endpoint:** `GET /game/profile`

**Headers:**

```
Authorization: Bearer {token}
```

**Réponse (200 OK):**

```json
{
  "success": true,
  "gameProfile": {
    "id": "profile_123",
    "userId": "user_123",
    "language": "ar",
    "soundEnabled": true,
    "musicEnabled": true,
    "contentRestriction": "NONE",
    "currentLevel": 5,
    "totalScore": 1250,
    "totalPlayTime": 3600,
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
    "lastPlayedAt": "2026-02-27T14:00:00Z"
  }
}
```

**Code Godot:**

```gdscript
func get_game_profile() -> void:
	var url = BACKEND_URL + "/game/profile"
	var headers = ["Authorization: Bearer " + auth_token]

	var http_request = HTTPRequest.new()
	add_child(http_request)
	http_request.request_completed.connect(_on_profile_received)
	http_request.request(url, headers, HTTPClient.METHOD_GET)

func _on_profile_received(result: int, response_code: int, headers: PackedStringArray, body: PackedByteArray) -> void:
	if response_code == 200:
		var response = JSON.parse_string(body.get_string_from_utf8())
		var profile = response["gameProfile"]
		print("Niveau actuel: ", profile["currentLevel"])
		print("Score total: ", profile["totalScore"])
	else:
		print("Erreur: ", body.get_string_from_utf8())
```

---

### 2. Obtenir les statistiques du joueur

**Endpoint:** `GET /game/stats`

**Headers:**

```
Authorization: Bearer {token}
```

**Réponse (200 OK):**

```json
{
  "success": true,
  "stats": {
    "totalScore": 1250,
    "totalPlayTime": 3600,
    "currentLevel": 5,
    "completedLevels": 4,
    "totalChocolates": 18,
    "totalEggs": 12,
    "language": "ar",
    "soundEnabled": true,
    "musicEnabled": true,
    "lastPlayedAt": "2026-02-27T14:00:00Z"
  }
}
```

**Code Godot:**

```gdscript
func get_player_stats() -> void:
	var url = BACKEND_URL + "/game/stats"
	var headers = ["Authorization: Bearer " + auth_token]

	var http_request = HTTPRequest.new()
	add_child(http_request)
	http_request.request_completed.connect(_on_stats_received)
	http_request.request(url, headers, HTTPClient.METHOD_GET)

func _on_stats_received(result: int, response_code: int, headers: PackedStringArray, body: PackedByteArray) -> void:
	if response_code == 200:
		var response = JSON.parse_string(body.get_string_from_utf8())
		var stats = response["stats"]
		print("🏆 Score total: ", stats["totalScore"])
		print("🥚 Œufs collectés: ", stats["totalEggs"])
		print("🍫 Chocolats collectés: ", stats["totalChocolates"])
	else:
		print("Erreur: ", body.get_string_from_utf8())
```

---

## 🎯 Collecte d'items

### Collecter un chocolat ou un œuf

**Endpoint:** `PATCH /game/item-collect`

**Paramètres:**

```json
{
  "levelId": 1,
  "itemType": "chocolate",
  "itemIndex": 0
}
```

- `levelId`: ID du niveau (1, 2, 3, etc.)
- `itemType`: `"chocolate"` ou `"egg"`
- `itemIndex`: Index de l'item collecté (0-indexed)

**Réponse (200 OK):**

```json
{
  "valid": true,
  "message": "Item collected successfully",
  "levelProgress": {
    "chocolatesTaken": [0, 1],
    "eggsTaken": [],
    "completed": false
  }
}
```

**Code Godot:**

```gdscript
func collect_item(level_id: int, item_type: String, item_index: int) -> void:
	var url = BACKEND_URL + "/game/item-collect"
	var headers = ["Authorization: Bearer " + auth_token, "Content-Type: application/json"]
	var body = {
		"levelId": level_id,
		"itemType": item_type,  # "chocolate" ou "egg"
		"itemIndex": item_index
	}

	var http_request = HTTPRequest.new()
	add_child(http_request)
	http_request.request_completed.connect(_on_item_collected)
	http_request.request(url, headers, HTTPClient.METHOD_PATCH, JSON.stringify(body))

func _on_item_collected(result: int, response_code: int, headers: PackedStringArray, body: PackedByteArray) -> void:
	if response_code == 200:
		var response = JSON.parse_string(body.get_string_from_utf8())
		if response["valid"]:
			print("✅ Item collecté!")
			print("Chocolats pris: ", response["levelProgress"]["chocolatesTaken"])
			print("Œufs pris: ", response["levelProgress"]["eggsTaken"])
		else:
			print("❌ Erreur: ", response["error"])
	else:
		print("Erreur: ", body.get_string_from_utf8())
```

---

## 🏁 Fin de niveau

### Compléter un niveau et soumettre le score

**Endpoint:** `PATCH /game/level-complete`

**Paramètres:**

```json
{
  "levelId": 1,
  "score": 250,
  "timeSpent": 180
}
```

- `levelId`: ID du niveau complété
- `score`: Points obtenus au niveau
- `timeSpent`: Temps passé en secondes

**Réponse (200 OK):**

```json
{
  "success": true,
  "message": "Level completed successfully",
  "totalScore": 1250,
  "gameProfile": {
    "id": "profile_123",
    "totalScore": 1250,
    "currentLevel": 2,
    "totalPlayTime": 180
  }
}
```

**Code Godot:**

```gdscript
func complete_level(level_id: int, score: int, time_spent_seconds: int) -> void:
	var url = BACKEND_URL + "/game/level-complete"
	var headers = ["Authorization: Bearer " + auth_token, "Content-Type: application/json"]
	var body = {
		"levelId": level_id,
		"score": score,
		"timeSpent": time_spent_seconds
	}

	var http_request = HTTPRequest.new()
	add_child(http_request)
	http_request.request_completed.connect(_on_level_completed)
	http_request.request(url, headers, HTTPClient.METHOD_PATCH, JSON.stringify(body))

func _on_level_completed(result: int, response_code: int, headers: PackedStringArray, body: PackedByteArray) -> void:
	if response_code == 200:
		var response = JSON.parse_string(body.get_string_from_utf8())
		if response["success"]:
			print("🎉 Niveau complété!")
			print("Score total: ", response["totalScore"])
			print("Prochain niveau: ", response["gameProfile"]["currentLevel"])
		else:
			print("Erreur: ", response["error"])
	else:
		print("Erreur: ", body.get_string_from_utf8())
```

---

## 🔄 Synchronisation

### Synchroniser l'état du jeu (offline to online)

**Endpoint:** `PATCH /game/sync`

Utilisez cet endpoint pour synchroniser les données offline accumulées avec le serveur.

**Paramètres:**

```json
{
  "levelsData": {
    "level_1": {
      "chocolatesTaken": [0, 1, 2],
      "eggsTaken": [0, 1],
      "completed": true,
      "score": 250,
      "timeSpent": 180
    }
  },
  "totalScore": 1250,
  "totalPlayTime": 3600,
  "inventory": {},
  "missions": {},
  "achievements": {}
}
```

**Réponse (200 OK):**

```json
{
  "success": true,
  "message": "Game state synced successfully",
  "gameProfile": {
    "id": "profile_123",
    "totalScore": 1250,
    "levelsData": { ... },
    "pendingSync": false,
    "lastSyncAt": "2026-02-27T14:00:00Z"
  }
}
```

**Code Godot:**

```gdscript
func sync_game_state(offline_data: Dictionary) -> void:
	var url = BACKEND_URL + "/game/sync"
	var headers = ["Authorization: Bearer " + auth_token, "Content-Type: application/json"]

	var body = {
		"levelsData": offline_data.get("levelsData", {}),
		"totalScore": offline_data.get("totalScore", 0),
		"totalPlayTime": offline_data.get("totalPlayTime", 0)
	}

	var http_request = HTTPRequest.new()
	add_child(http_request)
	http_request.request_completed.connect(_on_sync_completed)
	http_request.request(url, headers, HTTPClient.METHOD_PATCH, JSON.stringify(body))

func _on_sync_completed(result: int, response_code: int, headers: PackedStringArray, body: PackedByteArray) -> void:
	if response_code == 200:
		var response = JSON.parse_string(body.get_string_from_utf8())
		if response["success"]:
			print("✅ Synchronisation réussie!")
			print("Dernier sync: ", response["gameProfile"]["lastSyncAt"])
		else:
			print("Erreur sync: ", response["error"])
	else:
		print("Erreur: ", body.get_string_from_utf8())
```

---

## 📚 Exemples complets

### Exemple 1: Flux complet d'authentification

```gdscript
extends Node

const BACKEND_URL = "http://localhost:3000"
var auth_token = ""

func _ready():
	# Étape 1: Inscription
	register_and_login()

func register_and_login():
	# Inscription
	var register_url = BACKEND_URL + "/auth/register"
	var register_body = {
		"email": "joueur@example.com",
		"password": "SecurePass123",
		"fullName": "Jean Dupont",
		"age": 25,
		"phone": "+33612345678",
		"physicalAddress": "123 Rue de Paris"
	}

	var http = HTTPRequest.new()
	add_child(http)
	http.request_completed.connect(_on_register_done)
	http.request(register_url, [], HTTPClient.METHOD_POST, JSON.stringify(register_body))

func _on_register_done(result: int, response_code: int, headers: PackedStringArray, body: PackedByteArray):
	if response_code == 201:
		var response = JSON.parse_string(body.get_string_from_utf8())
		auth_token = response["token"]
		print("✅ Inscrit et connecté!")

		# Étape 2: Charger le profil
		await get_tree().create_timer(1.0).timeout
		get_game_profile()
	else:
		print("❌ Erreur: ", body.get_string_from_utf8())

func get_game_profile():
	var url = BACKEND_URL + "/game/profile"
	var headers = ["Authorization: Bearer " + auth_token]

	var http = HTTPRequest.new()
	add_child(http)
	http.request_completed.connect(_on_profile_received)
	http.request(url, headers, HTTPClient.METHOD_GET)

func _on_profile_received(result: int, response_code: int, headers: PackedStringArray, body: PackedByteArray):
	if response_code == 200:
		var response = JSON.parse_string(body.get_string_from_utf8())
		print("🎮 Profil chargé!")
		print("Niveau: ", response["gameProfile"]["currentLevel"])
		print("Score: ", response["gameProfile"]["totalScore"])
```

### Exemple 2: Jouer et collecter des items

```gdscript
func play_level(level_id: int):
	print("🎮 Niveau ", level_id, " commencé!")
	var level_start_time = Time.get_ticks_msec()
	var items_collected = []

	# Simulation de collecte d'items
	for i in range(3):
		await get_tree().create_timer(2.0).timeout
		collect_item(level_id, "chocolate", i)
		items_collected.append({"type": "chocolate", "index": i})

	# Fin du niveau
	var time_spent = (Time.get_ticks_msec() - level_start_time) / 1000
	var score = 250  # Points calculés par Godot

	await get_tree().create_timer(1.0).timeout
	complete_level(level_id, score, int(time_spent))

func collect_item(level_id: int, item_type: String, item_index: int):
	var url = BACKEND_URL + "/game/item-collect"
	var headers = ["Authorization: Bearer " + auth_token, "Content-Type: application/json"]
	var body = {
		"levelId": level_id,
		"itemType": item_type,
		"itemIndex": item_index
	}

	var http = HTTPRequest.new()
	add_child(http)
	http.request_completed.connect(_on_item_collected)
	http.request(url, headers, HTTPClient.METHOD_PATCH, JSON.stringify(body))

func _on_item_collected(result: int, response_code: int, headers: PackedStringArray, body: PackedByteArray):
	if response_code == 200:
		var response = JSON.parse_string(body.get_string_from_utf8())
		print("✅ Item collecté!")

func complete_level(level_id: int, score: int, time_spent_seconds: int):
	var url = BACKEND_URL + "/game/level-complete"
	var headers = ["Authorization: Bearer " + auth_token, "Content-Type: application/json"]
	var body = {
		"levelId": level_id,
		"score": score,
		"timeSpent": time_spent_seconds
	}

	var http = HTTPRequest.new()
	add_child(http)
	http.request_completed.connect(_on_level_completed)
	http.request(url, headers, HTTPClient.METHOD_PATCH, JSON.stringify(body))

func _on_level_completed(result: int, response_code: int, headers: PackedStringArray, body: PackedByteArray):
	if response_code == 200:
		var response = JSON.parse_string(body.get_string_from_utf8())
		print("🎉 Niveau complété!")
		print("Score total: ", response["totalScore"])
```

---

## 🔍 Codes d'erreur

| Code | Description                       |
| ---- | --------------------------------- |
| 200  | ✅ Succès                         |
| 201  | ✅ Créé avec succès               |
| 400  | ❌ Requête invalide               |
| 401  | ❌ Non authentifié / Token expiré |
| 409  | ❌ Conflit (email déjà utilisé)   |
| 500  | ❌ Erreur serveur                 |

---

## 🚀 Conseils d'implémentation

1. **Stockez le token** : Sauvegardez le token dans les préférences Godot pour les sessions futures
2. **Gérez les erreurs réseau** : Implémentez un système de retry avec délai exponentiel
3. **Synchronisation offline** : Accumulez les données offline et synchronisez quand la connexion est rétablie
4. **Cachez le token** : Ne l'affichez jamais dans les logs en production
5. **Vérifiez l'authentification** : Toujours inclure le header `Authorization: Bearer {token}`

---

## 📞 Support

Pour toute question ou problème:

- Vérifiez que le backend fonctionne: `GET /health/redis`
- Vérifiez vos headers (Authorization)
- Assurez-vous que le token n'a pas expiré (7 jours)

---

**Dernière mise à jour:** 27 février 2026
