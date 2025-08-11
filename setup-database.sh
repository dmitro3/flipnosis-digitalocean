#!/bin/bash
set -e
echo "Setting up PostgreSQL database..."
apt-get update
apt-get install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
sudo -u postgres psql << 'SQL'
CREATE USER flipnosis_user WITH PASSWORD 'FlipnosisDB2024Secure';
CREATE DATABASE flipnosis OWNER flipnosis_user;
GRANT ALL PRIVILEGES ON DATABASE flipnosis TO flipnosis_user;
\q
SQL
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/*/main/postgresql.conf
echo "host    flipnosis        flipnosis_user    0.0.0.0/0               md5" >> /etc/postgresql/*/main/pg_hba.conf
systemctl restart postgresql
ufw allow 22/tcp
ufw allow 5432/tcp
ufw --force enable
echo "Database setup complete!"
echo "Database: flipnosis"
echo "User: flipnosis_user"
echo "Password: FlipnosisDB2024Secure"
echo "Port: 5432"
