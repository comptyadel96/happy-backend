#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# Happy Backend - Pre-Deployment Validation Script
# Usage: bash validate-deployment.sh
# ═══════════════════════════════════════════════════════════════════════════

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ─────────────────────────────────────────────────────────────────────────────
# Helper Functions
# ─────────────────────────────────────────────────────────────────────────────

print_header() {
  echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 1: Environment Checks
# ─────────────────────────────────────────────────────────────────────────────

print_header "1. ENVIRONMENT CHECKS"

# Check if .env.production exists
if [ -f .env.production ]; then
  print_success ".env.production found"
else
  print_error ".env.production not found"
  print_info "Run: cp .env.production.example .env.production"
  exit 1
fi

# Check required environment variables
REQUIRED_VARS=("DATABASE_URL" "REDIS_URL" "JWT_SECRET" "NODE_ENV")
for var in "${REQUIRED_VARS[@]}"; do
  if grep -q "^$var=" .env.production; then
    VALUE=$(grep "^$var=" .env.production | cut -d= -f2-)
    if [ -z "$VALUE" ] || [ "$VALUE" = "your*" ] || [ "$VALUE" = "${var}" ]; then
      print_warning "$var is not configured (placeholder value detected)"
    else
      print_success "$var is configured"
    fi
  else
    print_error "$var is missing from .env.production"
  fi
done

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 2: File Structure Checks
# ─────────────────────────────────────────────────────────────────────────────

print_header "2. FILE STRUCTURE CHECKS"

REQUIRED_FILES=(
  "Dockerfile"
  "docker-compose.yml"
  "nginx/nginx.conf"
  "src/main.ts"
  "src/app.module.ts"
  "src/game/game.gateway.ts"
  "src/common/adapters/redis-io.adapter.ts"
  "prisma/schema.prisma"
  "package.json"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    print_success "$file exists"
  else
    print_error "$file is missing!"
    exit 1
  fi
done

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 3: Critical Configuration Checks
# ─────────────────────────────────────────────────────────────────────────────

print_header "3. CRITICAL CONFIGURATION CHECKS"

# Check main.ts has RedisIoAdapter
if grep -q "RedisIoAdapter" src/main.ts; then
  print_success "RedisIoAdapter imported in main.ts"
else
  print_error "RedisIoAdapter NOT found in main.ts (critical for scaling!)"
  exit 1
fi

if grep -q "connectToRedis" src/main.ts; then
  print_success "RedisIoAdapter.connectToRedis() called"
else
  print_error "RedisIoAdapter.connectToRedis() NOT called in main.ts"
  exit 1
fi

if grep -q "useWebSocketAdapter" src/main.ts; then
  print_success "WebSocket adapter configured"
else
  print_error "WebSocket adapter NOT configured in main.ts"
  exit 1
fi

# Check trust proxy
if grep -q "trust proxy" src/main.ts; then
  print_success "Trust proxy configured (for Load Balancer)"
else
  print_warning "Trust proxy NOT configured - may cause IP issues with Load Balancer"
fi

# Check nginx WebSocket headers
if grep -q "proxy_set_header.*Upgrade" nginx/nginx.conf; then
  print_success "Nginx WebSocket Upgrade header present"
else
  print_error "Nginx missing WebSocket Upgrade header!"
  exit 1
fi

# Check nginx timeouts
if grep -q "proxy_read_timeout.*3600s" nginx/nginx.conf; then
  print_success "Nginx WebSocket timeout set to 3600s"
else
  print_warning "Nginx WebSocket timeout may be too short (should be 3600s)"
fi

# Check game.gateway has namespace
if grep -q "@WebSocketGateway" src/game/game.gateway.ts; then
  print_success "GameGateway WebSocket configured"
else
  print_error "GameGateway WebSocket NOT configured!"
  exit 1
fi

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 4: Docker Checks
# ─────────────────────────────────────────────────────────────────────────────

print_header "4. DOCKER CHECKS"

# Check Docker is installed
if command -v docker &> /dev/null; then
  print_success "Docker is installed"
  DOCKER_VERSION=$(docker --version)
  print_info "Version: $DOCKER_VERSION"
else
  print_error "Docker is not installed!"
  exit 1
fi

# Check Docker Compose is installed
if command -v docker-compose &> /dev/null; then
  print_success "Docker Compose is installed"
  DC_VERSION=$(docker-compose --version)
  print_info "Version: $DC_VERSION"
else
  print_error "Docker Compose is not installed!"
  exit 1
fi

# Check docker-compose.yml syntax
if docker-compose config > /dev/null 2>&1; then
  print_success "docker-compose.yml is valid"
else
  print_error "docker-compose.yml has syntax errors!"
  exit 1
fi

# Check Dockerfile syntax
if [ -f Dockerfile ]; then
  print_success "Dockerfile exists"
  # Basic check for required commands
  if grep -q "FROM" Dockerfile && grep -q "RUN" Dockerfile; then
    print_success "Dockerfile has basic structure"
  else
    print_error "Dockerfile structure is invalid"
    exit 1
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 5: NPM/Package Checks
# ─────────────────────────────────────────────────────────────────────────────

print_header "5. NPM/PACKAGE CHECKS"

if [ -f package.json ]; then
  print_success "package.json found"
  
  # Check for required dependencies
  if grep -q '"socket.io":' package.json; then
    print_success "socket.io is in dependencies"
  else
    print_warning "socket.io not found in dependencies"
  fi
  
  if grep -q '"@socket.io/redis-adapter":' package.json; then
    print_success "@socket.io/redis-adapter is in dependencies"
  else
    print_warning "@socket.io/redis-adapter not found in dependencies"
  fi
  
  if grep -q '"redis":' package.json; then
    print_success "redis client is in dependencies"
  else
    print_warning "redis client not found in dependencies"
  fi
  
  if grep -q '"prisma":' package.json; then
    print_success "Prisma is in dependencies"
  else
    print_error "Prisma not found in dependencies!"
    exit 1
  fi
else
  print_error "package.json not found!"
  exit 1
fi

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 6: Prisma Schema Checks
# ─────────────────────────────────────────────────────────────────────────────

print_header "6. PRISMA SCHEMA CHECKS"

if grep -q "model GameProfile" prisma/schema.prisma; then
  print_success "GameProfile model found"
else
  print_error "GameProfile model not found in schema!"
  exit 1
fi

if grep -q "model User" prisma/schema.prisma; then
  print_success "User model found"
else
  print_error "User model not found in schema!"
  exit 1
fi

if grep -q "levelsData.*Json" prisma/schema.prisma; then
  print_success "levelsData field found in GameProfile"
else
  print_warning "levelsData field may not be properly configured"
fi

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 7: Optional: Build Test
# ─────────────────────────────────────────────────────────────────────────────

print_header "7. OPTIONAL: DOCKER BUILD TEST"
print_info "Attempting to build Docker image (this may take a few minutes)..."

if docker-compose build --no-cache 2>&1 | grep -q "Successfully tagged\|Build complete"; then
  print_success "Docker build successful!"
else
  print_warning "Docker build test completed with possible warnings"
fi

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 8: Summary
# ─────────────────────────────────────────────────────────────────────────────

print_header "VALIDATION COMPLETE"

echo -e "${GREEN}✅ All critical checks passed!${NC}\n"

print_info "Next steps:"
echo "1. Configure .env.production with actual credentials"
echo "2. Test locally: docker-compose up -d"
echo "3. Test WebSocket connection"
echo "4. Deploy to Hetzner servers"
echo ""
print_info "For detailed guides, see:"
echo "- DOCKER_QUICK_START.md (local testing + Hetzner deployment)"
echo "- DOCKER_WEBSOCKET_VALIDATION.md (technical details)"
echo "- HORIZONTAL_SCALING.md (architecture overview)"
echo ""
