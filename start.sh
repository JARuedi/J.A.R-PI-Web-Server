#!/bin/bash

# Start MariaDB
service mariadb start
sleep 3

# Create database and tables
mysql -u root < /app/dp_maria_database.sql

# Set root password
mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED BY '${DB_PASSWORD}'; FLUSH PRIVILEGES;"

# Start Node server
node /app/server.js
