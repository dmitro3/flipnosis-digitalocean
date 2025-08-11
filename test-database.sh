#!/bin/bash
echo "Testing database connection..."
PGPASSWORD='FlipnosisDB2024Secure' psql -h 116.202.24.43 -U flipnosis_user -d flipnosis -c "SELECT version();"
echo "Database connection successful!"
