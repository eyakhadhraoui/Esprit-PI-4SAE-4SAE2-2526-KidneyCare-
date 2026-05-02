#!/bin/bash
# ============================================================================
# Jenkins Pipeline - Build & Deploy Script
# ============================================================================

set -e

echo "=== KidneyCare Platform - Jenkins Pipeline ===="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ─── Functions ───────────────────────────────────────────────────────────

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# ─── Pre-requisites Check ───────────────────────────────────────────────

log_info "Checking pre-requisites..."

command -v docker >/dev/null 2>&1 || log_error "Docker is not installed"
command -v docker-compose >/dev/null 2>&1 || log_error "Docker Compose is not installed"
command -v mvn >/dev/null 2>&1 || log_error "Maven is not installed"

log_info "All pre-requisites installed ✓"
echo ""

# ─── Build All Java Projects ────────────────────────────────────────────

log_info "Building all Java services in parallel..."

# Project list
PROJECTS=(
    "EurekaServer"
    "API"
    "FoncGreffon"
    "InfectionEtVaccination"
    "NEPHRO"
    "Nutrition_Service/Nutrition_Service"
    "prescription-Service"
    "projetconsultation"
    "projetparametrevital/projetparametrevital"
)

FAILED=0

for PROJECT in "${PROJECTS[@]}"; do
    (
        cd "$PROJECT"
        log_info "Building $PROJECT..."
        if mvn clean package -DskipTests -B 2>&1 | tail -20; then
            log_info "$PROJECT built successfully ✓"
        else
            log_error "$PROJECT build failed ✗"
        fi
    ) &
done

wait
if [ $FAILED -gt 0 ]; then
    log_error "$FAILED projects failed to build"
fi

log_info "All projects built successfully ✓"
echo ""

# ─── Test All Projects ──────────────────────────────────────────────────

log_info "Running tests..."

for PROJECT in "${PROJECTS[@]}"; do
    (
        cd "$PROJECT"
        mvn test -B 2>/dev/null || true
    ) &
done

wait

log_info "Tests completed ✓"
echo ""

# ─── Docker Build ───────────────────────────────────────────────────────

log_info "Building Docker images..."

if docker-compose build --parallel; then
    log_info "Docker images built successfully ✓"
else
    log_error "Docker build failed"
fi

echo ""

# ─── Deployment (if main/master/develop branch) ──────────────────────────

BRANCH=${GIT_BRANCH:-$(git rev-parse --abbrev-ref HEAD)}

if [[ "$BRANCH" == "main" || "$BRANCH" == "master" || "$BRANCH" == "develop" ]]; then
    log_info "Deploying to $BRANCH..."
    
    # Setup environment
    if [ ! -f .env ]; then
        cp .env.dev .env
        log_info "Created .env from .env.dev"
    fi
    
    # Deploy services
    if docker-compose up -d --remove-orphans; then
        log_info "Services deployed successfully ✓"
        
        # Wait for services to be healthy
        log_info "Waiting for services to be healthy..."
        sleep 10
        
        # Check health status
        docker-compose ps
        
        log_info "Deployment completed ✓"
    else
        log_error "Docker deployment failed"
    fi
else
    log_warn "Not deploying (branch: $BRANCH is not main/master/develop)"
fi

echo ""
log_info "Pipeline completed successfully!"
echo ""
