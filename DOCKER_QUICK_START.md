# 🚀 Quick Start - Docker WebSocket Local Testing & Hetzner Deployment

Ce guide vous montre comment tester localement avec Docker Compose et déployer sur Hetzner Cloud.

---

## 🧪 Part 1: Test Local (Docker Compose)

### Prérequis

- Docker et Docker Compose installés
- Redis Cloud account (compte gratuit OK)
- MongoDB Atlas ou instance locale

### Étape 1: Préparation des variables d'environnement

Créez `.env.production` à la racine:

```env
# ──── Base de données MongoDB ────────────────────────────────────────────────
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/happy-db?retryWrites=true&w=majority

# ──── Redis Cloud ────────────────────────────────────────────────────────────
REDIS_URL=redis://:your_password@redis-xxxxx.cloud.redis.io:12345/0

# ──── JWT & Sécurité ────────────────────────────────────────────────────────
JWT_SECRET=your-super-secret-key-change-in-production-12345
JWT_EXPIRATION=24h

# ──── App ────────────────────────────────────────────────────────────────────
NODE_ENV=production
PORT=3000
CORS_ORIGIN=*

# ──── Logs & Monitoring ──────────────────────────────────────────────────────
LOG_LEVEL=debug
```

### Étape 2: Lancer Docker Compose

```bash
# Construire l'image (première fois)
docker-compose build

# Lancer 2 instances + Nginx
docker-compose up -d

# Vérifier les conteneurs
docker-compose ps

# Logs en temps réel
docker-compose logs -f app1
docker-compose logs -f app2
docker-compose logs -f nginx
```

### Étape 3: Tester les endpoints

```bash
# Health check
curl http://localhost/health

# Health check Redis
curl http://localhost/health/redis

# API (via Nginx)
curl http://localhost/api/docs

# WebSocket (via browser console ou postman)
# Voir section "Test WebSocket" ci-dessous
```

### Étape 4: Test WebSocket avec Node.js

Créez un fichier `test-websocket.js`:

```javascript
const io = require('socket.io-client');

// Générez un JWT valide d'abord, ou utilisez un token existant
const TOKEN = 'your-valid-jwt-token';

const socket = io('http://localhost/game', {
  auth: {
    token: TOKEN,
  },
  transports: ['websocket', 'polling'],
});

socket.on('connect', () => {
  console.log('✅ Connected:', socket.id);
});

socket.on('connection_established', (data) => {
  console.log('📡 Server response:', data);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
});

socket.on('error', (error) => {
  console.error('⚠️ Error:', error);
});

// Send a test message
socket.emit('game_state_update', {
  levelId: 1,
  score: 1500,
});
```

Lancez:

```bash
npm install socket.io-client
node test-websocket.js
```

### Étape 5: Vérifier le partage Redis entre instances

**Dans une window**:

```bash
docker-compose logs app1 | grep "Redis"
```

**Dans une autre window**:

```bash
docker-compose logs app2 | grep "Redis"
```

Les deux doivent se connecter à Redis Cloud.

---

## 🌍 Part 2: Déploiement Hetzner

### Prérequis

- Compte Hetzner Cloud
- 3 serveurs CX21 créés (ou plus)
- Hetzner Load Balancer créé
- Certificate SSL Let's Encrypt ajouté au LB

### Étape 1: Préparation des serveurs Hetzner

SSH sur **chaque** serveur:

```bash
# Mise à jour système
sudo apt update && sudo apt upgrade -y

# Installation Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Ajout utilisateur au groupe docker
sudo usermod -aG docker ubuntu
newgrp docker

# Installation Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Vérification
docker --version
docker-compose --version

# Créer répertoire app
mkdir -p ~/happy-backend
cd ~/happy-backend
```

### Étape 2: Déployer l'app sur chaque serveur

Depuis votre machine locale:

```bash
# Copier les fichiers vers serveur 1
scp -r \
  docker-compose.yml \
  Dockerfile \
  package.json \
  package-lock.json \
  src/ \
  prisma/ \
  .env.production \
  ubuntu@<SERVER_1_IP>:~/happy-backend/

scp -r nginx/nginx.conf ubuntu@<SERVER_1_IP>:~/happy-backend/nginx/

# Répéter pour SERVER_2 et SERVER_3
```

### Étape 3: Lancer l'app sur chaque serveur

```bash
# SSH sur server 1
ssh ubuntu@<SERVER_1_IP>

# Dans la VM:
cd ~/happy-backend
docker-compose build
docker-compose up -d

# Vérifier
docker-compose ps
docker-compose logs app1
```

**Répéter pour tous les serveurs**.

### Étape 4: Configurer Hetzner Load Balancer

Dans **Console Hetzner Cloud**:

1. **Load Balancer** → **happy-lb**
2. **Targets** → **Add Target** → Sélectionnez les 3 serveurs
3. **Services**:
   - **HTTP (port 80)** → Redirect to HTTPS
   - **HTTPS (port 443)** → Certificate (Let's Encrypt)
4. **Health Check** → `GET /health` → port 3000

### Étape 5: Pointer le DNS

```bash
# Votre registrar DNS:
happy-game.com  A  <LOAD_BALANCER_IP>
```

Ou:

```bash
happy-game.com  CNAME  lb-xxxxx.hetzner.cloud
```

### Étape 6: Test Production

```bash
# Test health
curl https://happy-game.com/health

# Test API
curl https://happy-game.com/api/docs

# Test WebSocket (depuis client Godot ou navigateur)
# Doit se connecter via wss://happy-game.com/game
```

---

## 🔍 Monitoring & Debugging

### Logs en temps réel sur Hetzner

```bash
ssh ubuntu@<SERVER_IP>
docker-compose logs -f app1

# Ou un service spécifique
docker logs -f <CONTAINER_ID>
```

### Vérifier Redis Adapter

```bash
# Dans les logs, cherchez:
# "Redis adapter connected"
# "WebSocket server initialized"

docker-compose logs app1 | grep -i redis
docker-compose logs app1 | grep -i websocket
```

### Tester la répartition de charge

```bash
# Ouvrir 3 connexions WebSocket
# Chaque fois, noter le INSTANCE_ID reçu en response

# Les 3 devrait être différents si scaling fonctionne:
# - socket1 → app1
# - socket2 → app2
# - socket3 → app3 (ou sur app1/app2 selon la charge)
```

### Vérifier la communication inter-serveurs

```bash
# Sur server 1:
docker-compose logs app1 | grep "User.*connected"

# Envoyer un message depuis server 1 vers un utilisateur connecté à server 2
# Le message doit passer par Redis et atteindre le client

# Cherchez dans les logs:
# "Broadcasting message via Redis"
```

---

## 🛑 Troubleshooting

### Problème: Erreur `REDIS_URL` non trouvé

**Solution**:

```bash
# Vérifier .env.production
cat .env.production | grep REDIS_URL

# Si vide:
# 1. Editer .env.production
# 2. Redémarrer: docker-compose down && docker-compose up -d
```

### Problème: WebSocket timeout après 60s

**Cause**: Nginx timeout trop court
**Solution**:

```bash
# Vérifier nginx.conf
docker exec <nginx-container> cat /etc/nginx/nginx.conf | grep -A2 "proxy_read_timeout"

# Doit avoir: proxy_read_timeout 3600s; (dans /game location)
```

### Problème: "Connection refused" Redis

**Cause**: Redis Cloud firewall
**Solution**:

```bash
# Dans Redis Cloud console:
# 1. Allez à "Security" → "Access Control"
# 2. Ajoutez les IPs Hetzner à la whitelist
# Ou laissez ouvert (pas recommandé, mais OK pour test)

# Testez manuellement:
docker exec app1 \
  redis-cli -u "$REDIS_URL" ping
# Doit retourner: PONG
```

### Problème: Messages WebSocket perdus entre instances

**Cause**: Redis Adapter pas activé
**Solution**:

```bash
# Vérifier que main.ts a:
# - import RedisIoAdapter
# - redisIoAdapter.connectToRedis()
# - app.useWebSocketAdapter(redisIoAdapter)

docker-compose logs app1 | grep -i "redis\|adapter"
# Doit afficher "Redis adapter connected"
```

---

## 📊 Monitoring Recommandé

### Option 1: Prometheus + Grafana (complet)

```bash
# Ajouter à docker-compose.yml
prometheus:
  image: prom/prometheus:latest
  ports: ["9090:9090"]
  volumes: ["./prometheus.yml:/etc/prometheus/prometheus.yml"]

grafana:
  image: grafana/grafana:latest
  ports: ["3001:3000"]
```

### Option 2: Simple Healthcheck (basique)

```bash
# Cron job toutes les 5 minutes
*/5 * * * * curl -f https://happy-game.com/health || alert
```

### Option 3: Hetzner Cloud Console (natif)

- Allez à chaque serveur → "Monitoring" tab
- Voir CPU, RAM, Network

---

## 📝 Checklist de Production

- [ ] `.env.production` créé avec vraies valeurs
- [ ] Docker Compose fonctionne localement
- [ ] WebSocket testés localement
- [ ] Sereurs Hetzner préparés (Docker installé)
- [ ] App déployée sur tous les serveurs
- [ ] Load Balancer configuré + certificat SSL
- [ ] DNS pointe vers Load Balancer
- [ ] Health checks passent
- [ ] WebSocket testés en production
- [ ] Scaling testé (3+ instances)
- [ ] Monitoring en place
- [ ] Logs centralisés (optionnel)

---

## 🎯 Prochains Pas

1. **Aujourd'hui**: Test local avec docker-compose
2. **Demain**: Déployer sur 1 serveur Hetzner
3. **Jour 3**: Ajouter 2e et 3e serveurs
4. **Semaine 1**: Tester sous charge avec Apache Bench
5. **Semaine 2**: Mettre en place auto-scaling (optionnel)

---

**Good luck! 🚀**

Pour questions: Consulter HORIZONTAL_SCALING.md ou DOCKER_WEBSOCKET_VALIDATION.md
