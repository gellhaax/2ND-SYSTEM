const multer = require("multer");
const path = require("path");
const fs = require("fs");

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ===================== MIDDLEWARE =====================
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// ===================== AUTO CREATE UPLOADS FOLDER =====================
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// ===================== MULTER CONFIG =====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// ===================== DATABASE =====================
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err.message);
    return;
  }
  console.log("Connected to Railway MySQL!");
});

// ===================== TABLES =====================
db.query(`CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(100),
  contact VARCHAR(20),
  address VARCHAR(255),
  dob VARCHAR(20),
  age INT,
  gender VARCHAR(20),
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM("admin", "treasurer") NOT NULL,
  status VARCHAR(20) DEFAULT "active",
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`);

db.query(`CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  studentId VARCHAR(50) UNIQUE NOT NULL,
  firstName VARCHAR(100),
  middleName VARCHAR(100),
  lastName VARCHAR(100),
  course VARCHAR(50),
  year VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`);

db.query(`CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  studentId VARCHAR(50),
  fee VARCHAR(100),
  amount DECIMAL(10,2),
  balance DECIMAL(10,2),
  status VARCHAR(20),
  method VARCHAR(50),
  date VARCHAR(30),
  receipt VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (studentId) REFERENCES students(studentId)
)`);

db.query(`CREATE TABLE IF NOT EXISTS approval_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  requestedBy VARCHAR(100) NOT NULL,
  studentId VARCHAR(50) NOT NULL,
  studentName VARCHAR(200),
  requestedData JSON,
  originalData JSON,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (studentId) REFERENCES students(studentId) ON DELETE CASCADE
)`);

db.query(`CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipientRole ENUM('admin', 'treasurer') NOT NULL,
  message TEXT NOT NULL,
  isRead TINYINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`);

// ===================== TEST =====================
app.get("/", (req, res) => {
  res.json({ message: "Server is running!" });
});

// ===================== AUTH =====================
app.post("/api/register", (req, res) => {
  const {
    first_name, last_name, email, contact, address,
    dob, age, gender, username, password, role
  } = req.body;

  const sql = `INSERT INTO users 
  (first_name, last_name, email, contact, address, dob, age, gender, username, password, role)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.query(sql,
    [first_name, last_name, email, contact, address, dob, age, gender, username, password, role],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Registration successful!" });
    }
  );
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE username = ? AND password = ?",
    [username, password],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!results.length) return res.status(401).json({ error: "Invalid login!" });
      res.json({ user: results[0] });
    }
  );
});

// ===================== STUDENTS =====================
app.get("/api/students", (req, res) => {
  db.query("SELECT * FROM students", (err, students) => {
    if (err) return res.status(500).json({ error: err.message });

    db.query("SELECT * FROM transactions", (err2, transactions) => {
      if (err2) return res.status(500).json({ error: err2.message });

      const result = students.map(s => ({
        ...s,
        transactions: transactions
          .filter(t => t.studentId === s.studentId)
          .map(t => ({ ...t, receipt: t.receipt || "" }))
      }));

      res.json(result);
    });
  });
});

// ===================== ADD STUDENT =====================
app.post("/api/students", (req, res) => {
  const { studentId, firstName, middleName, lastName, course, year, transactions } = req.body;

  db.query(
    `INSERT INTO students (studentId, firstName, middleName, lastName, course, year)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [studentId, firstName, middleName, lastName, course, year],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });

      if (transactions?.length) {
        transactions.forEach(t => {
          db.query(
            `INSERT INTO transactions 
            (studentId, fee, amount, balance, status, method, date, receipt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              studentId,
              t.fee,
              t.amount,
              t.balance,
              t.status,
              t.method,
              t.date,
              t.receipt || ""
            ]
          );
        });
      }

      res.json({ message: "Student added successfully!" });
    }
  );
});

// ===================== TRANSACTIONS (MULTER UPLOAD) ===================== //UPDATED
app.post("/api/transactions", upload.single("receipt"), (req, res) => {
  const { studentId, fee, amount, balance, status, method, date } = req.body;

  const receiptPath = req.file ? `/uploads/${req.file.filename}` : "";

  db.query(
    `INSERT INTO transactions 
    (studentId, fee, amount, balance, status, method, date, receipt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      studentId,
      fee,
      amount,
      balance,
      status,
      method,
      date,
      receiptPath
    ],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });

      // ?? TRIGGER NOTIFICATION FOR ADMIN
      db.query(
        "INSERT INTO notifications (recipientRole, message) VALUES (?, ?)",
        ['admin', `New payment: ?${amount} for ${studentId} - ${fee}`],
        (notifErr) => { 
          if (notifErr) console.error('Notification error:', notifErr); 
          // Don't fail the main request if notification fails
        }
      );

      res.json({
        message: "Transaction added successfully!",
        receipt: receiptPath
      });
    }
  );
});

// ===================== DELETE TRANSACTION =====================
app.delete("/api/transactions/:id", (req, res) => {
  db.query("DELETE FROM transactions WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Deleted!" });
  });
});

// RECEIPT VIEW 
app.get("/api/receipt/:id", (req, res) => {
  db.query(
    "SELECT receipt FROM transactions WHERE id = ?",
    [req.params.id],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (!results.length) return res.status(404).json({ error: "Not found" });

      const file = results[0].receipt;
      if (!file) return res.status(404).json({ error: "No receipt" });

      const filePath = path.join(__dirname, "..", file.replace("/uploads", "uploads"));
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found on server" });
      }
      
      const ext = path.extname(file).toLowerCase();
      const contentType = {
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
        '.gif': 'image/gif', '.pdf': 'application/pdf'
      }[ext] || 'application/octet-stream';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${path.basename(file)}"`);
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    }
  );
});

//LIST ALL RECEIPTS//
app.get("/api/receipts", (req, res) => {
  db.query(
    "SELECT id, studentId, receipt, date FROM transactions WHERE receipt IS NOT NULL AND receipt != ''",
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      const receipts = results.map(r => ({
        ...r,
        receiptUrl: `${req.protocol}://${req.get('host')}${r.receipt}`
      }));
      res.json(receipts);
    }
  );
});
// NOTIFICATIONS - GET BY ROLE 
app.get("/api/notifications/:role", (req, res) => {
  db.query(
    "SELECT * FROM notifications WHERE recipientRole = ?",
    [req.params.role],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

//  NOTIFICATIONS - CREATE 
app.post("/api/notifications", (req, res) => {
  const { recipientRole, message } = req.body;
  
  if (!recipientRole || !message) {
    return res.status(400).json({ error: "recipientRole and message required" });
  }

  db.query(
    "INSERT INTO notifications (recipientRole, message) VALUES (?, ?)",
    [recipientRole, message],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Notification sent!", id: result.insertId });
    }
  );
});

//NOTIFICATIONS - MARK AS READ 
app.put("/api/notifications/:id/read", (req, res) => {
  db.query(
    "UPDATE notifications SET isRead = 1 WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Notification marked as read" });
    }
  );
});

// NOTIFICATIONS - GET UNREAD COUNT 
app.get("/api/notifications/:role/unread-count", (req, res) => {
  db.query(
    "SELECT COUNT(*) as count FROM notifications WHERE recipientRole = ? AND isRead = 0",
    [req.params.role],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ unreadCount: results[0].count });
    }
  );
});

// START SERVER 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});