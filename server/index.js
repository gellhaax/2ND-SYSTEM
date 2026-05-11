const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) { console.error("Database connection failed:", err.message); return; }
  console.log("Connected to Railway MySQL!");
});

db.query(`CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, first_name VARCHAR(100), last_name VARCHAR(100), email VARCHAR(100), contact VARCHAR(20), address VARCHAR(255), dob VARCHAR(20), age INT, gender VARCHAR(20), username VARCHAR(100) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL, role ENUM("admin", "treasurer") NOT NULL, status VARCHAR(20) DEFAULT "active", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`, (err) => {
  if (err) console.error("users error:", err.message);
  else console.log("users table ready");
});

db.query(`CREATE TABLE IF NOT EXISTS students (id INT AUTO_INCREMENT PRIMARY KEY, studentId VARCHAR(50) UNIQUE NOT NULL, firstName VARCHAR(100), middleName VARCHAR(100), lastName VARCHAR(100), course VARCHAR(50), year VARCHAR(20), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`, (err) => {
  if (err) console.error("students error:", err.message);
  else console.log("students table ready");
});

db.query(`CREATE TABLE IF NOT EXISTS transactions (id INT AUTO_INCREMENT PRIMARY KEY, studentId VARCHAR(50), fee VARCHAR(100), amount DECIMAL(10,2), balance DECIMAL(10,2), status VARCHAR(20), method VARCHAR(50), date VARCHAR(30), receipt LONGTEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (studentId) REFERENCES students(studentId))`, (err) => {
  if (err) console.error("transactions error:", err.message);
  else console.log("transactions table ready");
});

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
)`, (err) => {
  if (err) console.error("approval_requests error:", err.message);
  else console.log("approval_requests table ready");
});


db.query(`CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipientRole ENUM('admin', 'treasurer') NOT NULL,
  message TEXT NOT NULL,
  isRead TINYINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`, (err) => {
  if (err) console.error("notifications error:", err.message);
  else console.log("notifications table ready");
});

app.get("/", (req, res) => {
  res.json({ message: "Server is running!" });
});

// REGISTER
app.post("/api/register", (req, res) => {
  const { first_name, last_name, email, contact, address, dob, age, gender, username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ error: "Username, password and role are required" });
  }
  const sql = "INSERT INTO users (first_name, last_name, email, contact, address, dob, age, gender, username, password, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
  db.query(sql, [first_name, last_name, email, contact, address, dob, age, gender, username, password, role], (err) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") return res.status(400).json({ error: "Username already exists!" });
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: "Registration successful!" });
  });
});

// LOGIN
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  db.query("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(401).json({ error: "Invalid username or password!" });
    res.json({ user: results[0] });
  });
});

// GET ALL STUDENTS
app.get("/api/students", (req, res) => {
  db.query("SELECT * FROM students", (err, students) => {
    if (err) return res.status(500).json({ error: err.message });
    db.query("SELECT * FROM transactions", (err2, transactions) => {
      if (err2) return res.status(500).json({ error: err2.message });
      const result = students.map(s => ({
        ...s,
        transactions: transactions.filter(t => t.studentId === s.studentId)
      }));
      res.json(result);
    });
  });
});

// GET ONE STUDENT
app.get("/api/students/:studentId", (req, res) => {
  const { studentId } = req.params;
  db.query("SELECT * FROM students WHERE studentId = ?", [studentId], (err, students) => {
    if (err) return res.status(500).json({ error: err.message });
    if (students.length === 0) return res.status(404).json({ error: "Student not found" });
    db.query("SELECT * FROM transactions WHERE studentId = ?", [studentId], (err2, transactions) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ ...students[0], transactions });
    });
  });
});

// ADD STUDENT
app.post("/api/students", (req, res) => {
  const { studentId, firstName, middleName, lastName, course, year, transactions } = req.body;
  const sql = "INSERT INTO students (studentId, firstName, middleName, lastName, course, year) VALUES (?, ?, ?, ?, ?, ?)";
  db.query(sql, [studentId, firstName, middleName, lastName, course, year], (err) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") return res.status(400).json({ error: "Student already exists!" });
      return res.status(500).json({ error: err.message });
    }
    if (transactions && transactions.length > 0) {
      const tSql = "INSERT INTO transactions (studentId, fee, amount, balance, status, method, date, receipt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
      transactions.forEach(t => {
        db.query(tSql, [studentId, t.fee, t.amount, t.balance, t.status, t.method, t.date, t.receipt || ""]);
      });
    }
    res.json({ message: "Student added successfully!" });
  });
});

// UPDATE STUDENT
app.put("/api/students/:studentId", (req, res) => {
  const { studentId } = req.params;
  const { firstName, middleName, lastName, course, year } = req.body;
  const sql = "UPDATE students SET firstName=?, middleName=?, lastName=?, course=?, year=? WHERE studentId=?";
  db.query(sql, [firstName, middleName, lastName, course, year, studentId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Student updated successfully!" });
  });
});

// DELETE STUDENT
app.delete("/api/students/:studentId", (req, res) => {
  const { studentId } = req.params;
  db.query("DELETE FROM transactions WHERE studentId = ?", [studentId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    db.query("DELETE FROM students WHERE studentId = ?", [studentId], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ message: "Student deleted successfully!" });
    });
  });
});

// ADD TRANSACTION
app.post("/api/transactions", (req, res) => {
  const { studentId, fee, amount, balance, status, method, date, receipt } = req.body;
  const sql = "INSERT INTO transactions (studentId, fee, amount, balance, status, method, date, receipt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
  db.query(sql, [studentId, fee, amount, balance, status, method, date, receipt || ""], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Transaction added successfully!" });
  });
});

// DELETE TRANSACTION
app.delete("/api/transactions/:id", (req, res) => {
  db.query("DELETE FROM transactions WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Transaction deleted successfully!" });
  });
});

// SEND APPROVAL REQUEST
app.post("/api/approvals", (req, res) => {
  const { requestedBy, studentId, studentName, requestedData, originalData } = req.body;
  const sql = "INSERT INTO approval_requests (requestedBy, studentId, studentName, requestedData, originalData) VALUES (?, ?, ?, ?, ?)";
  db.query(sql, [requestedBy, studentId, studentName, JSON.stringify(requestedData), JSON.stringify(originalData)], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Approval request sent!" });
  });
});

// GET PENDING APPROVALS
app.get("/api/approvals/pending", (req, res) => {
  db.query("SELECT * FROM approval_requests WHERE status = 'pending'", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// APPROVE OR REJECT
app.put("/api/approvals/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  db.query("UPDATE approval_requests SET status = ? WHERE id = ?", [status, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    if (status === "approved") {
      db.query("SELECT * FROM approval_requests WHERE id = ?", [id], (err2, results) => {
        if (err2 || results.length === 0) return res.json({ message: "Approved but could not apply changes" });
        const data = JSON.parse(results[0].requestedData);
        const sid = results[0].studentId;
        const sql = "UPDATE students SET firstName=?, middleName=?, lastName=?, course=?, year=? WHERE studentId=?";
        db.query(sql, [data.firstName, data.middleName, data.lastName, data.course, data.year, sid], (err3) => {
          if (err3) return res.status(500).json({ error: err3.message });
          res.json({ message: "Approved and student updated!" });
        });
      });
    } else {
      res.json({ message: "Request rejected!" });
    }
  });
});

// UPDATE PASSWORD
app.put("/api/users/:id/password", (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  db.query("UPDATE users SET password = ? WHERE id = ?", [newPassword, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Password updated successfully!" });
  });
});


// GET NOTIFICATIONS FOR A ROLE
app.get("/api/notifications/:role", (req, res) => {
  const { role } = req.params;
  db.query(
    "SELECT * FROM notifications WHERE recipientRole = ?"
    [role],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

// SAVE A NOTIFICATION
app.post("/api/notifications", (req, res) => {
  const { recipientRole, message } = req.body;
  db.query(
    "INSERT INTO notifications (recipientRole, message) VALUES (?, ?)",
    [recipientRole, message],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Notification saved!" });
    }
  );
});

// MARK NOTIFICATION AS READ
app.put("/api/notifications/:id/read", (req, res) => {
  db.query(
    "UPDATE notifications SET isRead = 1 WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Marked as read!" });
    }
  );
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});