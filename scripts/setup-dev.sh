#!/bin/bash
# ============================================================================
# Development Environment Setup Script (Unix/Linux/Mac)
# ============================================================================
# This script automates the setup of the development environment for the
# Kozlekedesi Jegykezelo (Public Transport Ticketing) application.
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "${BLUE}============================================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}============================================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# ============================================================================
# Main Script
# ============================================================================

clear
print_header "Kozlekedesi Jegykezelo - Development Environment Setup"

# ============================================================================
# 1. Check Prerequisites
# ============================================================================

echo "[1/6] Checking prerequisites..."
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js not found!"
    echo "Please install Node.js 20.x LTS from: https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node --version)
print_success "Node.js version: $NODE_VERSION"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm not found!"
    exit 1
fi

NPM_VERSION=$(npm --version)
print_success "npm version: $NPM_VERSION"

# Check Git
if ! command -v git &> /dev/null; then
    print_warning "Git not found. Some features may not work."
else
    GIT_VERSION=$(git --version)
    print_success "$GIT_VERSION"
fi

echo ""

# ============================================================================
# 2. Install Backend Dependencies
# ============================================================================

echo "[2/6] Installing backend dependencies..."
echo ""

if [ -f "backend/package.json" ]; then
    cd backend
    print_info "Installing backend packages... This may take a few minutes."
    npm install
    print_success "Backend dependencies installed successfully"
    cd ..
else
    print_warning "backend/package.json not found. Skipping backend setup."
    print_info "The backend may need to be initialized first."
fi

echo ""

# ============================================================================
# 3. Install Frontend Dependencies
# ============================================================================

echo "[3/6] Installing frontend dependencies..."
echo ""

if [ -f "frontend/package.json" ]; then
    cd frontend
    print_info "Installing frontend packages... This may take a few minutes."
    npm install
    print_success "Frontend dependencies installed successfully"
    cd ..
else
    print_warning "frontend/package.json not found. Skipping frontend setup."
    print_info "The frontend may need to be initialized first."
fi

echo ""

# ============================================================================
# 4. Setup Environment Files
# ============================================================================

echo "[4/6] Setting up environment files..."
echo ""

# Backend .env
if [ -f "backend/.env.example" ]; then
    if [ ! -f "backend/.env" ]; then
        cp backend/.env.example backend/.env
        print_success "Created backend/.env from template"
        print_warning "ACTION REQUIRED: Please edit backend/.env with your Supabase credentials"
    else
        print_info "backend/.env already exists (skipped)"
    fi
else
    print_warning "backend/.env.example not found"
fi

# Frontend .env
if [ -f "frontend/.env.example" ]; then
    if [ ! -f "frontend/.env" ]; then
        cp frontend/.env.example frontend/.env
        print_success "Created frontend/.env from template"
        print_warning "ACTION REQUIRED: Please edit frontend/.env with your Supabase credentials"
    else
        print_info "frontend/.env already exists (skipped)"
    fi
else
    print_warning "frontend/.env.example not found"
fi

echo ""

# ============================================================================
# 5. Verify Installation
# ============================================================================

echo "[5/6] Verifying installation..."
echo ""

# Check backend build
if [ -f "backend/package.json" ]; then
    cd backend
    print_info "Checking if backend builds..."
    if npm run build > /dev/null 2>&1; then
        print_success "Backend builds successfully"
    else
        print_warning "Backend build may have issues"
    fi
    cd ..
fi

# Check frontend build
if [ -f "frontend/package.json" ]; then
    cd frontend
    print_info "Checking if frontend builds..."
    if npm run build > /dev/null 2>&1; then
        print_success "Frontend builds successfully"
    else
        print_warning "Frontend build may have issues"
    fi
    cd ..
fi

echo ""

# ============================================================================
# 6. Display Next Steps
# ============================================================================

echo "[6/6] Setup complete!"
echo ""

print_header "Next Steps"

echo "1. Configure environment variables:"
echo "   - Edit backend/.env with your Supabase credentials"
echo "   - Edit frontend/.env with your Supabase credentials"
echo ""
echo "2. Review the setup documentation:"
echo "   - database/SUPABASE_SETUP.md - Supabase configuration"
echo "   - docs/ENVIRONMENT_SETUP.md - Environment variables guide"
echo ""
echo "3. Start the development servers:"
echo "   Backend:  cd backend  && npm run start:dev"
echo "   Frontend: cd frontend && npm start"
echo ""
echo "4. Access the application:"
echo "   Backend API:  http://localhost:3000"
echo "   Swagger Docs: http://localhost:3000/api/docs"
echo "   Frontend App: http://localhost:4200"
echo ""

print_header "Useful Commands"

echo "Backend commands:"
echo "  npm run start:dev  - Start development server with hot reload"
echo "  npm run test       - Run unit tests"
echo "  npm run lint       - Run ESLint"
echo "  npm run build      - Build for production"
echo ""
echo "Frontend commands:"
echo "  ng serve           - Start development server"
echo "  ng test            - Run unit tests"
echo "  ng lint            - Run ESLint"
echo "  ng build           - Build for production"
echo ""

print_header "Setup Complete"

echo "Happy coding! 🚀"
echo ""
