const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database("./internships.db", (err) => {
    if (err) {
        console.error("Database error:", err.message);
    } else {
        console.log("Connected to SQLite database.");
    }
});

db.run(`
    CREATE TABLE IF NOT EXISTS internships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company TEXT NOT NULL,
        role TEXT NOT NULL,
        location TEXT,
        duration TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// GET all internships
app.get("/api/internships", (req, res) => {
    db.all(
        "SELECT * FROM internships ORDER BY id DESC",
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json(rows);
        }
    );
});

// GET one internship
app.get("/api/internships/:id", (req, res) => {
    db.get(
        "SELECT * FROM internships WHERE id = ?",
        [req.params.id],
        (err, row) => {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (!row) {
                return res.status(404).json({
                    message: "Internship not found"
                });
            }

            res.json(row);
        }
    );
});

// CREATE internship
app.post("/api/internships", (req, res) => {
    const {
        company,
        role,
        location,
        duration,
        description
    } = req.body;

    if (!company || !role) {
        return res.status(400).json({
            message: "Company and role are required"
        });
    }

    const sql = `
        INSERT INTO internships
        (company, role, location, duration, description)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.run(
        sql,
        [
            company,
            role,
            location,
            duration,
            description
        ],
        function (err) {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.status(201).json({
                id: this.lastID,
                company,
                role,
                location,
                duration,
                description
            });
        }
    );
});

// UPDATE internship
app.put("/api/internships/:id", (req, res) => {
    const {
        company,
        role,
        location,
        duration,
        description
    } = req.body;

    const sql = `
        UPDATE internships
        SET company = ?,
            role = ?,
            location = ?,
            duration = ?,
            description = ?
        WHERE id = ?
    `;

    db.run(
        sql,
        [
            company,
            role,
            location,
            duration,
            description,
            req.params.id
        ],
        function (err) {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    message: "Internship not found"
                });
            }

            res.json({
                message: "Internship updated successfully"
            });
        }
    );
});

// DELETE internship
app.delete("/api/internships/:id", (req, res) => {
    db.run(
        "DELETE FROM internships WHERE id = ?",
        [req.params.id],
        function (err) {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    message: "Internship not found"
                });
            }

            res.json({
                message: "Internship deleted successfully"
            });
        }
    );
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});