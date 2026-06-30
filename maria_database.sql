CREATE DATABASE IF NOT EXISTS digital_planner;
USE digital_planner;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    join_date DATE NOT NULL,
    join_time TIME NOT NULL
);
