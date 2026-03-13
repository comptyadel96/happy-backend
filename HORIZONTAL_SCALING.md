# Horizontal Scaling Guide - Happy Backend

Guide complet pour déployer et scaler l'application Happy Backend avec **Hetzner Cloud**, **Docker**, **Load Balancer Hetzner** et **Redis Cloud**.

---

## Table des matières

1. [Architecture](#architecture)
2. [Prérequis](#prérequis)
3. [Configuration Hetzner Cloud](#configuration-hetzner-cloud)
4. [Configuration Redis Cloud](#configuration-redis-cloud)
5. [Docker & Docker Compose](#docker--docker-compose)
6. [Load Balancer Hetzner](#load-balancer-hetzner)
7. [Déploiement Initial](#déploiement-initial)
8. [Scaling Horizontal](#scaling-horizontal)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Troubleshooting](#troubleshooting)

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│          Hetzner Load Balancer                      │
│  (distribution du trafic avec TLS termination)      │
└─────────────────────────────────────────────────────┘
                       ↓
        ┌──────────────┬──────────────┐
        ↓              ↓              ↓
   ┌─────────┐   ┌─────────┐   ┌─────────┐
   │ Server1 │   │ Server2 │   │ Server3 │
   │(Docker) │   │(Docker) │   │(Docker) │
   └─────────┘   └─────────┘   └─────────┘
        ↓              ↓              ↓
        └──────────────┬──────────────┘
                       ↓
          ┌────────────────────────┐
          │  Redis Cloud (Cluster) │
          │  (session + cache)     │
          └────────────────────────┘
                       ↓
          ┌────────────────────────┐
          │  MongoDB (Hetzner ou   │
          │  Atlas Cloud)          │
          └────────────────────────┘
```

---

## Prérequis

### Comptes & Outils

- ✅ Compte **Hetzner Cloud** (https://console.hetzner.cloud/)
- ✅ Compte **Redis Cloud** (https://redis.com/cloud/)
- ✅ MongoDB (MongoDB Atlas ou instance Hetzner)
- ✅ **Docker** et **Docker Compose** installés localement
- ✅ **Hetzner CLI** (`hcloud`)
- ✅ **SSH Keys** configurées
- ✅ Domaine DNS pointant vers le Load Balancer

### Ressources Hetzner Estimées

- **3 Serveurs**: CX21 (2 vCPU, 4GB RAM) = ~8.99€/mois chacun
- **1 Load Balancer**: LB11 = ~5.00€/mois
- **Volumes/Snapshots**: variables
- **Total**: ~35€/mois + Redis Cloud + MongoDB

---

## Configuration Hetzner Cloud

### 1. Créer les serveurs

```bash
# Login à Hetzner Cloud
hcloud auth-token set <YOUR_API_TOKEN>

# Créer 3 serveurs (Ubuntu 22.04 LTS)
hcloud server create \
  --name happy-app-1 \
  --type cx21 \
  --image ubuntu-22.04 \
  --ssh-key <SSH_KEY_ID> \
  --location fsn1

hcloud server create \
  --name happy-app-2 \
  --type cx21 \
  --image ubuntu-22.04 \
  --ssh-key <SSH_KEY_ID> \
  --location fsn1

hcloud server create \
  --name happy-app-3 \
  --type cx21 \
  --image ubuntu-22.04 \
  --ssh-key <SSH_KEY_ID> \
  --location fsn1

# Lister les serveurs créés
hcloud server list
```

### 2. Configurer les serveurs

Après la création, accédez à chaque serveur en SSH:

```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer Docker et Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Ajouter l'utilisateur courant au groupe docker
sudo usermod -aG docker $USER
newgrp docker

# Installer Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Vérifier les installations
docker --version
docker-compose --version

# Créer un répertoire pour l'application
mkdir -p /app/happy-backend
cd /app/happy-backend
```

### 3. Réseau privé (optionnel mais recommandé)

```bash
# Créer un réseau privé
hcloud network create --name happy-network --ip-range 10.0.0.0/8

# Ajouter les serveurs au réseau
hcloud server attach-to-network happy-app-1 \
  --network happy-network --ip 10.0.0.2

hcloud server attach-to-network happy-app-2 \
  --network happy-network --ip 10.0.0.3

hcloud server attach-to-network happy-app-3 \
  --network happy-network --ip 10.0.0.4
```

---

## Configuration Redis Cloud

### 1. Créer un cluster Redis Cloud

1. Allez sur https://redis.com/cloud/
2. Créez un compte gratuit (30MB gratuit pour démarrer)
3. **Créez un nouveau "Database":**
   - Sélectionnez **Cloud Provider**: Hetzner (ou AWS/GCP)
   - **Region**: Choisissez la même que vos serveurs (eu-central-1 pour Hetzner FSN1)
   - **Plan**: Commencez avec le plan gratuit ou Small
   - **Database name**: `happy-redis`

### 2. Récupérer les credentials

Une fois créé, vous aurez:

- **Host**: `redis-xxxxx.cloud.redis.io`
- **Port**: `xxxxx`
- **Password**: `xxxxx`

**Format de connexion:**

```
redis://:YOUR_PASSWORD@YOUR_HOST:YOUR_PORT/0
```

### 3. Configurer Redis Cloud pour Hetzner

Pour une meilleure latence, utilisez le réseau privé Hetzner si Redis Cloud le support, sinon:

- Réduire la latence avec une région identique
- Augmenter les timeouts
- Configurer un WAF/Firewall approprié

---

## Docker & Docker Compose

### 1. Préparer le docker-compose.yml pour production

Créez `/app/happy-backend/docker-compose.yml`:

```yaml
version: '3.9'

services:
  happy-app:
    image: happy-backend:latest # à remplacer par votre registre Docker
    container_name: happy-app
    ports:
      - '3000:3000' # NestJS app
    environment:
      # Database
      DATABASE_URL: 'mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_HOST}'

      # Redis
      REDIS_URL: 'redis://:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}/0'

      # JWT
      JWT_SECRET: '${JWT_SECRET}'
      JWT_EXPIRATION: '24h'

      # App
      NODE_ENV: 'production'
      PORT: 3000
      HOSTNAME: '0.0.0.0'

    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/health']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

    networks:
      - app-network

    logging:
      driver: 'json-file'
      options:
        max-size: '10m'
        max-file: '3'

networks:
  app-network:
    driver: bridge
```

### 2. Fichier .env.production

Créez `/app/happy-backend/.env.production`:

```env
# Database MongoDB
MONGO_USER=happy_user
MONGO_PASSWORD=your_secure_password
MONGO_HOST=your-mongodb-host.mongodb.net

# Redis Cloud
REDIS_PASSWORD=your_redis_password
REDIS_HOST=redis-xxxxx.cloud.redis.io
REDIS_PORT=xxxxx

# JWT
JWT_SECRET=your_ultra_secret_key_change_this_in_production

# Application
NODE_ENV=production
PORT=3000
```

### 3. Construire l'image Docker

```bash
# Localement ou sur un serveur de build
docker build -t happy-backend:latest .

# Tag pour registre privé (optionnel)
docker tag happy-backend:latest your-registry.azurecr.io/happy-backend:latest
docker push your-registry.azurecr.io/happy-backend:latest
```

---

## Load Balancer Hetzner

### 1. Créer le Load Balancer

```bash
# Via CLI
hcloud load-balancer create \
  --name happy-lb \
  --load-balancer-type lb11 \
  --network happy-network

# Via Console:
# https://console.hetzner.cloud/load_balancers
```

### 2. Configurer les services

**Dans la console Hetzner Cloud:**

1. Allez à **Load Balancer** → **happy-lb**
2. **Services** → **Add Service**

#### Service 1: HTTP → HTTPS Redirect

```
Protocol: HTTP
Port: 80
Health Check: HTTP /health (port 3000)
```

#### Service 2: HTTPS (TLS)

```
Protocol: HTTPS
Port: 443
Health Check: HTTP /health (port 3000)
Certificate: Créez/importez votre certificat SSL
```

### 3. Ajouter les serveurs au Load Balancer

```bash
# Via CLI
hcloud load-balancer add-target happy-lb --target-type server happy-app-1
hcloud load-balancer add-target happy-lb --target-type server happy-app-2
hcloud load-balancer add-target happy-lb --target-type server happy-app-3

# Vérifier
hcloud load-balancer describe happy-lb
```

### 4. Configuration DNS

Pointez votre domaine vers l'IP du Load Balancer:

```
your-domain.com  A  <LOAD_BALANCER_IP>
```

---

## Déploiement Initial

### 1. Sur chaque serveur Hetzner

```bash
# Cloner le repository
cd /app/happy-backend
git clone <your-repo-url> .

# Ou uploader les fichiers
scp -r ./docker-compose.yml root@<server-ip>:/app/happy-backend/
scp -r ./.env.production root@<server-ip>:/app/happy-backend/
```

### 2. Déployer avec Docker Compose

```bash
# SSH sur chaque serveur
ssh root@<server-ip>

# Allez dans le répertoire
cd /app/happy-backend

# Télécharger l'image (ou construire)
docker pull your-registry/happy-backend:latest

# Lancer l'application
docker-compose up -d

# Vérifier le statut
docker-compose ps
docker-compose logs -f
```

### 3. Vérifier la santé

```bash
# Depuis votre machine locale
curl -I https://your-domain.com/health

# Devrait retourner 200 OK
```

---

## Scaling Horizontal

### Augmenter les instances

#### Méthode 1: Ajouter de nouveaux serveurs

```bash
# Créer un nouveau serveur
hcloud server create \
  --name happy-app-4 \
  --type cx21 \
  --image ubuntu-22.04 \
  --ssh-key <SSH_KEY_ID>

# Le configurer (voir section Configuration Hetzner Cloud)

# L'ajouter au Load Balancer
hcloud load-balancer add-target happy-lb --target-type server happy-app-4

# Déployer l'app
ssh root@<new-server-ip>
cd /app/happy-backend
docker-compose up -d
```

#### Méthode 2: Docker Swarm (optionnel)

Si vous voulez orchestrer avec Docker Swarm:

```bash
# Sur le premier serveur (manager)
docker swarm init --advertise-addr 10.0.0.2

# Sur les autres serveurs (workers)
docker swarm join --token <TOKEN> 10.0.0.2:2377

# Déployer un stack
docker stack deploy -c docker-compose.yml happy
```

### Autoscaling (recommandé pour production)

Utilisez **Kubernetes** (Hetzner propose CCM) ou **GitHub Actions** pour:

- Monitorer la charge CPU/Mémoire
- Créer/détruire des serveurs automatiquement
- Mettre à jour le Load Balancer

---

## Monitoring & Maintenance

### 1. Logs centralisés

```bash
# Voir les logs d'un serveur
ssh root@<server-ip>
docker-compose logs -f happy-app

# Ou via journalctl
journalctl -u docker -f
```

### 2. Healthcheck Redis

```bash
# Depuis n'importe quel serveur
docker exec <container-id> redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD ping
# Devrait retourner: PONG
```

### 3. Backup & Snapshot

```bash
# Créer un snapshot du serveur
hcloud server create-image \
  --label backup=true \
  --type snapshot \
  happy-app-1 \
  --name happy-app-1-backup-2026-03-13

# Snapshot automatique via cron
0 2 * * * hcloud server create-image happy-app-1 --name "happy-app-1-$(date +\%Y\%m\%d)" > /var/log/backup.log 2>&1
```

### 4. Monitoring avec Prometheus (optionnel)

```yaml
# docker-compose.yml - ajouter
prometheus:
  image: prom/prometheus:latest
  ports:
    - '9090:9090'
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
  networks:
    - app-network
```

---

## Troubleshooting

### Problème: Le Load Balancer ne route pas vers les serveurs

**Solution:**

```bash
# Vérifier la santé des serveurs
hcloud load-balancer describe happy-lb
# Chercher le statut "health_status"

# Vérifier la connectivité
ssh root@<server-ip> curl localhost:3000/health

# Vérifier les ports
netstat -tlnp | grep 3000
```

### Problème: Redis Cloud timeout

**Solution:**

```bash
# Augmenter le timeout dans .env
REDIS_SOCKET_KEEPALIVE: "true"
REDIS_SOCKET_TIMEOUT: "30000"

# Redéployer
docker-compose down
docker-compose up -d
```

### Problème: MongoDB connection timeout

**Solution:**

```bash
# Vérifier la chaîne de connexion
# mongodb+srv://user:password@host/database?retryWrites=true&w=majority

# Augmenter le timeout
MONGODB_CONNECTION_TIMEOUT: "5000"

# Vérifier les firewall rules MongoDB Atlas/Hetzner
```

### Problème: OOM Killer (Out of Memory)

**Solution:**

```bash
# Vérifier la RAM
free -h

# Limiter les conteneurs dans docker-compose.yml
services:
  happy-app:
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G

# Redémarrer les services
docker-compose up -d
```

---

## Bonnes Pratiques

### Sécurité

- ✅ Utilisez des **SSH Keys** (jamais des passwords)
- ✅ Activez **Firewall Hetzner** (port 22, 80, 443 seulement)
- ✅ Utilisez **HTTPS/TLS** avec certificat valide (Let's Encrypt gratuit)
- ✅ Stockez les secrets dans un **Vault** (HashiCorp, AWS Secrets Manager)
- ✅ Limitez les accès MongoDB/Redis par IP

### Performance

- ✅ Activez **gzip compression** dans Nginx/Load Balancer
- ✅ Utilisez **HTTP/2** ou **HTTP/3** (QUIC)
- ✅ Configurez **cache headers** appropriés
- ✅ Utilisez **CDN** pour les assets statiques

### Coût

- ✅ Utilisez des **instances plus petites** et déployez plus
- ✅ Utilisez des **snapshots** au lieu de backups complets
- ✅ Nettoyez les vieux **volumes** et **snapshots**
- ✅ Explorez les **projets Hetzner** pour l'organisation

### Mise à Jour

```bash
# Déployer une nouvelle version
docker pull your-registry/happy-backend:v1.2.3

# Mettre à jour docker-compose.yml
# Redéployer
docker-compose up -d

# Vérifier
docker-compose logs -f
```

---

## Support & Ressources

- 📚 [Documentation Hetzner Cloud](https://docs.hetzner.cloud/)
- 📚 [Redis Cloud Documentation](https://docs.redis.com/latest/rc/)
- 📚 [Docker Documentation](https://docs.docker.com/)
- 📚 [NestJS Deployment Guide](https://docs.nestjs.com/deployment)

---

**Dernière mise à jour**: Mars 2026
**Version**: 1.0
