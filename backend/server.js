const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();

// Configure CORS to allow all connections
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));

// Handle preflight requests
app.options('*', cors());

app.use(bodyParser.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  next();
});

// Test endpoint
app.get("/test", (req, res) => {
  res.json({ message: "Server is running and accessible!" });
});

// Test login endpoint (for testing only)
app.get("/test-login", (req, res) => {
  res.json({ 
    message: "Login endpoint is accessible",
    note: "This is a test endpoint. The actual login endpoint only accepts POST requests."
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// JWT Secret Key
const JWT_SECRET = "your-secret-key-here";

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "flutter_crud",
});

db.connect((err) => {
    if (err) {
        console.error('MySQL connection error:', err);
        return;
    }
    console.log("MySQL Connected...");
});

// Get All Users
app.get("/users", (req, res) => {
    db.query("SELECT * FROM users", (err, results) => {
      if (err) {
        console.error('Error fetching users:', err);
        return res.status(500).json({ error: "Server error" });
      }
      res.json(results);
    });
});

// Add User
app.post("/users", (req, res) => {
    const { name, email } = req.body;
    
    db.query("INSERT INTO users (name, email) VALUES (?, ?)", [name, email], (err, result) => {
      if (err) throw err;
      res.json({ message: "User added", id: result.insertId });
    });
  });

// Update User
app.put("/users/:id", (req, res) => {
    const { name, email } = req.body;
    db.query("UPDATE users SET name = ?, email = ? WHERE id = ?", [name, email, req.params.id], (err) => {
      if (err) throw err;
      res.json({ message: "User updated" });
    });
  });

// Delete User
app.delete("/users/:id", (req, res) => {
    db.query("DELETE FROM users WHERE id = ?", [req.params.id], (err) => {
      if (err) throw err;
      res.json({ message: "User deleted" });
    });
  });
  
// Login endpoint
app.post("/login", async (req, res) => {
  console.log('Login attempt received');
  console.log('Request body:', req.body);

  const { email, password } = req.body;

  if (!email || !password) {
    console.log('Missing email or password');
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: "Server error" });
      }
      
      if (results.length === 0) {
        console.log('User not found:', email);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const user = results[0];
      console.log('User found:', user.email);

      try {
        const validPassword = await bcrypt.compare(password, user.password);
        console.log('Password validation result:', validPassword);

        if (!validPassword) {
          return res.status(401).json({ error: "Invalid credentials" });
        }

        // Generate JWT token
        const token = jwt.sign(
          { id: user.id, email: user.email },
          JWT_SECRET,
          { expiresIn: "1h" }
        );

        console.log('Login successful for user:', user.email);
        res.json({ 
          token, 
          user: { 
            id: user.id, 
            name: user.name, 
            email: user.email 
          } 
        });
      } catch (bcryptError) {
        console.error('Password comparison error:', bcryptError);
        return res.status(500).json({ error: "Server error" });
      }
    });
  } catch (error) {
    console.error('Login process error:', error);
    return res.status(500).json({ error: "Server error" });
  }
});

// Register endpoint
app.post("/register", async (req, res) => {
  console.log('Registration attempt received');
  console.log('Request body:', req.body);

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    console.log('Missing required fields');
    return res.status(400).json({ error: "Name, email and password are required" });
  }

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword],
      (err, result) => {
        if (err) {
          console.error('Database error:', err);
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ error: "Email already exists" });
          }
          return res.status(500).json({ error: "Server error" });
        }
        console.log('User registered successfully:', email);
        res.json({ message: "User registered successfully", id: result.insertId });
      }
    );
  } catch (error) {
    console.error('Registration process error:', error);
    return res.status(500).json({ error: "Server error" });
  }
});

// Update the listen call to be more explicit
const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Server is listening on all interfaces");
  console.log(`Access the server at http://localhost:${PORT} or http://YOUR_IP:${PORT}`);
});

