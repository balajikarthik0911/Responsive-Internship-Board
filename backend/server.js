const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, "..")));

// SQLite database
const dbPath = path.join(__dirname, "internships.db");

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Database connection error:", err.message);
    } else {
        console.log("Connected to SQLite database.");
    }
});

// Create table
db.run(
    `
    CREATE TABLE IF NOT EXISTS internships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        company TEXT NOT NULL,
        location TEXT NOT NULL,
        duration TEXT NOT NULL,
        description TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    `,
    (err) => {
        if (err) {
            console.error("Table creation error:", err.message);
        } else {
            console.log("Internships table ready.");
        }
    }
);

// --------------------------------------------------
// GET all internships
// --------------------------------------------------
app.get("/api/internships", (req, res) => {
    const sql = `
        SELECT
            id,
            title,
            company,
            location,
            duration,
            description,
            created_at
        FROM internships
        ORDER BY id DESC
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("GET error:", err.message);
            return res.status(500).json({
                error: err.message
            });
        }

        res.json(rows);
    });
});

// --------------------------------------------------
// GET internship by ID
// --------------------------------------------------
app.get("/api/internships/:id", (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
        return res.status(400).json({
            error: "Invalid internship ID"
        });
    }

    const sql = `
        SELECT
            id,
            title,
            company,
            location,
            duration,
            description,
            created_at
        FROM internships
        WHERE id = ?
    `;

    db.get(sql, [id], (err, row) => {
        if (err) {
            console.error("GET BY ID error:", err.message);
            return res.status(500).json({
                error: err.message
            });
        }

        if (!row) {
            return res.status(404).json({
                error: "Internship not found"
            });
        }

        res.json(row);
    });
});

// --------------------------------------------------
// POST - Add internship
// --------------------------------------------------
app.post("/api/internships", (req, res) => {
    const {
        title,
        company,
        location,
        duration,
        description
    } = req.body;

    if (!title || !company || !location || !duration || !description) {
        return res.status(400).json({
            error: "All fields are required"
        });
    }

    const sql = `
        INSERT INTO internships
        (title, company, location, duration, description)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.run(
        sql,
        [
            title.trim(),
            company.trim(),
            location.trim(),
            duration.trim(),
            description.trim()
        ],
        function (err) {
            if (err) {
                console.error("POST error:", err.message);

                return res.status(500).json({
                    error: err.message
                });
            }

            res.status(201).json({
                message: "Internship added successfully",
                id: this.lastID
            });
        }
    );
});

// --------------------------------------------------
// PUT - Update internship
// --------------------------------------------------
app.put("/api/internships/:id", (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
        return res.status(400).json({
            error: "Invalid internship ID"
        });
    }

    const {
        title,
        company,
        location,
        duration,
        description
    } = req.body;

    if (!title || !company || !location || !duration || !description) {
        return res.status(400).json({
            error: "All fields are required"
        });
    }

    const sql = `
        UPDATE internships
        SET
            title = ?,
            company = ?,
            location = ?,
            duration = ?,
            description = ?
        WHERE id = ?
    `;

    db.run(
        sql,
        [
            title.trim(),
            company.trim(),
            location.trim(),
            duration.trim(),
            description.trim(),
            id
        ],
        function (err) {
            if (err) {
                console.error("PUT error:", err.message);

                return res.status(500).json({
                    error: err.message
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    error: "Internship not found"
                });
            }

            res.json({
                message: "Internship updated successfully"
            });
        }
    );
});

// --------------------------------------------------
// DELETE - Delete internship
// --------------------------------------------------
app.delete("/api/internships/:id", (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
        return res.status(400).json({
            error: "Invalid internship ID"
        });
    }

    const sql = `
        DELETE FROM internships
        WHERE id = ?
    `;

    db.run(sql, [id], function (err) {
        if (err) {
            console.error("DELETE error:", err.message);

            return res.status(500).json({
                error: err.message
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({
                error: "Internship not found"
            });
        }

        res.json({
            message: "Internship deleted successfully"
        });
    });
});

// --------------------------------------------------
// Start server
// --------------------------------------------------
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});