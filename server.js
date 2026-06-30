const express = require('express');
const mysql = require('mysql2');
const { exec } = require('child_process');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'digital_planner'
});

db.connect(err => {
    if (err) console.error('DB connection error:', err);
    else console.log('Connected to MariaDB');
});

app.post('/login', (req, res) => {
    const { email } = req.body;
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0];

    const query = "INSERT INTO users (email, join_date, join_time) VALUES (?, ?, ?)";

    db.query(query, [email, date, time], (err) => {
        if (err) {
            console.error("DB Error:", err);
            return res.status(500).send("Database Error");
        }
        exec('python3 /app/retreaval.py', (error, stdout, stderr) => {
            if (error) {
                console.error(`Python Error: ${error}`);
                return res.status(500).send("Spreadsheet Update Failed");
            }
            console.log(`Python Output: ${stdout}`);
            res.send({ message: "Success!" });
        });
    });
});

app.listen(3000, () => console.log('Server running on port 3000'));
