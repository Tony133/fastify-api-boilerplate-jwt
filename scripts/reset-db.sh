#!/bin/bash
# scripts/reset-db.sh
docker-compose down -v
docker-compose up -d
echo "Database reset and tables successfully recreated!"


