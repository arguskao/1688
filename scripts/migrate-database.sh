#!/bin/bash

# =============================================================================
# Database Migration Script
# =============================================================================
# This script runs database migrations for the Quote List System
# Usage: ./scripts/migrate-database.sh [environment]
# Example: ./scripts/migrate-database.sh production
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get environment (default to development)
ENVIRONMENT=${1:-development}

echo -e "${GREEN}==============================================================================${NC}"
echo -e "${GREEN}Database Migration Script${NC}"
echo -e "${GREEN}Environment: ${ENVIRONMENT}${NC}"
echo -e "${GREEN}==============================================================================${NC}"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL environment variable is not set${NC}"
    echo ""
    echo "Please set DATABASE_URL before running migrations:"
    echo "  export DATABASE_URL='postgresql://user:password@host/database'"
    echo ""
    echo "Or load from .env file:"
    echo "  source .env"
    echo "  ./scripts/migrate-database.sh"
    exit 1
fi

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: psql is not installed${NC}"
    echo ""
    echo "Please install PostgreSQL client:"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu: sudo apt-get install postgresql-client"
    echo "  Windows: Download from https://www.postgresql.org/download/"
    exit 1
fi

echo -e "${YELLOW}Checking database connection...${NC}"
if psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database connection successful${NC}"
else
    echo -e "${RED}✗ Database connection failed${NC}"
    echo "Please check your DATABASE_URL"
    exit 1
fi

echo ""
echo -e "${YELLOW}Running migrations...${NC}"
echo ""

# Run initial migration
echo "Running migration: 0001_initial.sql"
if psql "$DATABASE_URL" -f migrations/0001_initial.sql; then
    echo -e "${GREEN}✓ Migration 0001_initial.sql completed${NC}"
else
    echo -e "${RED}✗ Migration 0001_initial.sql failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}==============================================================================${NC}"
echo -e "${GREEN}All migrations completed successfully!${NC}"
echo -e "${GREEN}==============================================================================${NC}"
echo ""

# Verify tables were created
echo -e "${YELLOW}Verifying database schema...${NC}"
echo ""

TABLES=$(psql "$DATABASE_URL" -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;")

if [ -z "$TABLES" ]; then
    echo -e "${RED}Warning: No tables found in database${NC}"
else
    echo -e "${GREEN}Tables created:${NC}"
    echo "$TABLES" | while read -r table; do
        if [ ! -z "$table" ]; then
            echo "  - $table"
        fi
    done
fi

echo ""
echo -e "${GREEN}Database migration complete!${NC}"
