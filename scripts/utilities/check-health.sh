#!/bin/bash

# ================================
# Health Check Script
# Közlekedési Jegykezelő
# ================================
#
# This script checks the health of all application services:
# - Backend API
# - Frontend application
# - Supabase connection
# - Database connectivity
#
# Usage:
#   bash scripts/utilities/check-health.sh
#   bash scripts/utilities/check-health.sh --verbose
#   bash scripts/utilities/check-health.sh --production
#
# Exit codes:
#   0 - All services healthy
#   1 - One or more services unhealthy
# ================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
VERBOSE=false
PRODUCTION=false
BACKEND_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:4200"
SUPABASE_URL="https://prhlsuwkokuisqavwfoi.supabase.co"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --verbose|-v)
      VERBOSE=true
      shift
      ;;
    --production|-p)
      PRODUCTION=true
      BACKEND_URL="https://your-backend.up.railway.app"
      FRONTEND_URL="https://your-app.netlify.app"
      shift
      ;;
    --backend-url)
      BACKEND_URL="$2"
      shift 2
      ;;
    --frontend-url)
      FRONTEND_URL="$2"
      shift 2
      ;;
    --help|-h)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --verbose, -v          Enable verbose output"
      echo "  --production, -p       Check production URLs"
      echo "  --backend-url URL      Custom backend URL"
      echo "  --frontend-url URL     Custom frontend URL"
      echo "  --help, -h             Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Function to print colored output
print_status() {
  local status=$1
  local message=$2

  if [ "$status" = "OK" ]; then
    echo -e "${GREEN}✓${NC} $message"
  elif [ "$status" = "FAIL" ]; then
    echo -e "${RED}✗${NC} $message"
  elif [ "$status" = "WARN" ]; then
    echo -e "${YELLOW}⚠${NC} $message"
  elif [ "$status" = "INFO" ]; then
    echo -e "${BLUE}ℹ${NC} $message"
  fi
}

# Function to check HTTP endpoint
check_http() {
  local url=$1
  local name=$2
  local expected_status=${3:-200}

  if [ "$VERBOSE" = true ]; then
    print_status "INFO" "Checking $name at $url..."
  fi

  # Try to reach the endpoint
  response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 "$url" 2>/dev/null || echo "000")

  if [ "$response" = "$expected_status" ]; then
    print_status "OK" "$name is healthy (HTTP $response)"
    return 0
  elif [ "$response" = "000" ]; then
    print_status "FAIL" "$name is unreachable"
    return 1
  else
    print_status "FAIL" "$name returned HTTP $response (expected $expected_status)"
    return 1
  fi
}

# Function to check if port is open
check_port() {
  local host=$1
  local port=$2
  local name=$3

  if [ "$VERBOSE" = true ]; then
    print_status "INFO" "Checking $name port $port on $host..."
  fi

  if nc -z -w5 "$host" "$port" 2>/dev/null; then
    print_status "OK" "$name port $port is open"
    return 0
  else
    print_status "FAIL" "$name port $port is not accessible"
    return 1
  fi
}

# Function to check Supabase connectivity
check_supabase() {
  local url=$1

  if [ "$VERBOSE" = true ]; then
    print_status "INFO" "Checking Supabase at $url..."
  fi

  # Check if Supabase REST API is accessible
  response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 "${url}/rest/v1/" 2>/dev/null || echo "000")

  if [ "$response" = "200" ] || [ "$response" = "401" ]; then
    print_status "OK" "Supabase is reachable"
    return 0
  elif [ "$response" = "000" ]; then
    print_status "FAIL" "Supabase is unreachable"
    return 1
  else
    print_status "WARN" "Supabase returned HTTP $response"
    return 0
  fi
}

# Function to check backend health endpoint
check_backend_health() {
  local url=$1

  if [ "$VERBOSE" = true ]; then
    print_status "INFO" "Checking backend health endpoint..."
  fi

  # Check health endpoint
  response=$(curl -s "${url}/health" 2>/dev/null || echo '{"status":"error"}')

  if echo "$response" | grep -q '"status":"ok"' || echo "$response" | grep -q '"status":"healthy"'; then
    print_status "OK" "Backend health check passed"

    if [ "$VERBOSE" = true ]; then
      echo "  Response: $response"
    fi
    return 0
  else
    print_status "FAIL" "Backend health check failed"

    if [ "$VERBOSE" = true ]; then
      echo "  Response: $response"
    fi
    return 1
  fi
}

# Function to check if processes are running locally
check_local_processes() {
  if [ "$PRODUCTION" = true ]; then
    return 0
  fi

  if [ "$VERBOSE" = true ]; then
    print_status "INFO" "Checking local processes..."
  fi

  local backend_running=false
  local frontend_running=false

  # Check backend process
  if pgrep -f "nest start" > /dev/null || pgrep -f "node.*dist/main" > /dev/null; then
    print_status "OK" "Backend process is running"
    backend_running=true
  else
    print_status "WARN" "Backend process not found (may not be started)"
  fi

  # Check frontend process
  if pgrep -f "ng serve" > /dev/null || pgrep -f "@angular/cli" > /dev/null; then
    print_status "OK" "Frontend process is running"
    frontend_running=true
  else
    print_status "WARN" "Frontend process not found (may not be started)"
  fi

  if [ "$backend_running" = false ] && [ "$frontend_running" = false ]; then
    return 1
  fi

  return 0
}

# Main health check logic
main() {
  echo "================================"
  echo "Health Check - Közlekedési Jegykezelő"
  echo "================================"
  echo ""

  if [ "$PRODUCTION" = true ]; then
    print_status "INFO" "Running health checks for PRODUCTION environment"
  else
    print_status "INFO" "Running health checks for DEVELOPMENT environment"
  fi
  echo ""

  local all_healthy=true

  # Check Supabase
  echo "Checking Supabase..."
  if ! check_supabase "$SUPABASE_URL"; then
    all_healthy=false
  fi
  echo ""

  # Check Backend
  echo "Checking Backend..."
  if ! check_http "$BACKEND_URL/health" "Backend API" "200"; then
    all_healthy=false
  elif ! check_backend_health "$BACKEND_URL"; then
    all_healthy=false
  fi
  echo ""

  # Check Frontend (only for development)
  if [ "$PRODUCTION" = false ]; then
    echo "Checking Frontend..."
    if ! check_http "$FRONTEND_URL" "Frontend" "200"; then
      all_healthy=false
    fi
    echo ""
  fi

  # Check local processes (only for development)
  if [ "$PRODUCTION" = false ]; then
    echo "Checking Local Processes..."
    check_local_processes
    echo ""
  fi

  # Summary
  echo "================================"
  if [ "$all_healthy" = true ]; then
    print_status "OK" "All services are healthy"
    echo "================================"
    exit 0
  else
    print_status "FAIL" "Some services are unhealthy"
    echo "================================"
    echo ""
    echo "Troubleshooting steps:"
    echo "  1. Check if services are running:"
    echo "     - Backend: npm run start:dev --workspace=backend"
    echo "     - Frontend: npm run start --workspace=frontend"
    echo "  2. Check environment variables in .env files"
    echo "  3. Check network connectivity"
    echo "  4. Review logs for errors"
    echo "  5. Verify Supabase project is active"
    echo ""
    exit 1
  fi
}

# Run main function
main
