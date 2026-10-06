const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
// Security headers
app.use(helmet());
// Rate limiting for API routes
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: "Too many requests. Please try again later."
    }
});

app.use("/api", apiLimiter);

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

    // Server-side type validation
    if (
        typeof title !== "string" ||
        typeof company !== "string" ||
        typeof location !== "string" ||
        typeof duration !== "string" ||
        typeof description !== "string"
    ) {
        return res.status(400).json({
            error: "All fields must be text."
        });
    }

    // Server-side required-field validation
    if (
        !title.trim() ||
        !company.trim() ||
        !location.trim() ||
        !duration.trim() ||
        !description.trim()
    ) {
        return res.status(400).json({
            error: "All fields are required."
        });
    }

    // Length validation
    if (title.trim().length > 100) {
        return res.status(400).json({
            error: "Title must be 100 characters or less."
        });
    }

    if (company.trim().length > 100) {
        return res.status(400).json({
            error: "Company name must be 100 characters or less."
        });
    }

    if (location.trim().length > 100) {
        return res.status(400).json({
            error: "Location must be 100 characters or less."
        });
    }

    if (duration.trim().length > 50) {
        return res.status(400).json({
            error: "Duration must be 50 characters or less."
        });
    }

    if (description.trim().length > 1000) {
        return res.status(400).json({
            error: "Description must be 1000 characters or less."
        });
    }

    // Parameterized SQL query
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
                    error: "Failed to add internship."
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
// APPLICATIONS TABLE
// --------------------------------------------------
db.run(`
    CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        internship_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`, (err) => {
    if (err) {
        console.error("Applications table error:", err.message);
    } else {
        console.log("Applications table ready.");
    }
});

// --------------------------------------------------
// POST - Submit application
// --------------------------------------------------
app.post("/api/applications", (req, res) => {

    const {
        name,
        email,
        phone,
        internshipId
    } = req.body;

    // Server-side validation
    if (
        typeof name !== "string" ||
        typeof email !== "string" ||
        typeof phone !== "string"
    ) {
        return res.status(400).json({
            error: "Invalid application data."
        });
    }

    if (
        !name.trim() ||
        !email.trim() ||
        !phone.trim() ||
        !internshipId
    ) {
        return res.status(400).json({
            error: "All fields are required."
        });
    }

    if (name.trim().length < 2) {
        return res.status(400).json({
            error: "Name must contain at least 2 characters."
        });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return res.status(400).json({
            error: "Please enter a valid email."
        });
    }

    if (!/^[0-9]{10}$/.test(phone.trim())) {
        return res.status(400).json({
            error: "Phone number must contain 10 digits."
        });
    }

    const internshipID = Number(internshipId);

    if (!Number.isInteger(internshipID) || internshipID < 1) {
        return res.status(400).json({
            error: "Invalid internship ID."
        });
    }

    // Parameterized query
    const sql = `
        INSERT INTO applications
        (name, email, phone, internship_id)
        VALUES (?, ?, ?, ?)
    `;

    db.run(
        sql,
        [
            name.trim(),
            email.trim(),
            phone.trim(),
            internshipID
        ],
        function (err) {

            if (err) {
                console.error("Application error:", err.message);

                return res.status(500).json({
                    error: "Failed to submit application."
                });
            }

            res.status(201).json({
                message: "Application submitted successfully.",
                id: this.lastID
            });
        }
    );
});

// --------------------------------------------------
// GET - View applications
// --------------------------------------------------
app.get("/api/applications", (req, res) => {

    const sql = `
        SELECT
            id,
            name,
            email,
            phone,
            internship_id,
            created_at
        FROM applications
        ORDER BY id DESC
    `;

    db.all(sql, [], (err, rows) => {

        if (err) {
            return res.status(500).json({
                error: "Failed to load applications."
            });
        }

        res.json(rows);
    });
});

// --------------------------------------------------
// Start server
// --------------------------------------------------
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});