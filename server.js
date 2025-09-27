// import express from 'express';
// import session from 'express-session';
// import dotenv from 'dotenv';
// import cors from 'cors';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import bcrypt from 'bcrypt';
// import { pool } from './db.js';
// import authRoutes from './routes/auth.js';

// // Product
// import productsRoutes from './routes/products.js';
// import customersRoutes from './routes/customers.js';
// import orderRoutes from './routes/orders.js';
// import expensesRoutes from './routes/expenses.js';

// dotenv.config();
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const app = express();
// app.use(cors());

// // app.use(
// //   cors({
// //     origin: `http://localhost:3000`, // or whatever your frontend runs on
// //     credentials: true,               // 🔐 Allow sending cookies
// //   })
// // );

// // // 🚀 DEV-FRIENDLY CORS SETUP
// // app.use(cors({
// //   origin: true, // Reflect request origin
// //   credentials: true
// // }));

// app.use(cors({
//   origin: (origin, callback) => {
//     callback(null, true); // ✅ allow all origins dynamically
//   },
//   credentials: true
// }));

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// app.use(
//   session({
//     name: 'sid',
//     secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
//     resave: false,
//     saveUninitialized: false,
//     cookie: {
//       httpOnly: true,
//       sameSite: 'lax',
//       // secure: true, // enable if behind HTTPS
//       maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days in milliseconds
//     }
//   })
// );

// // product
// app.use('/api/products', productsRoutes);
// app.use('/api/customers', customersRoutes);
// app.use('/api/orders', orderRoutes);
// app.use('/api/expenses', expensesRoutes);

// // Ensure single admin exists (one-time bootstrap)
// async function ensureAdmin() {
//   const adminEmail = process.env.ADMIN_EMAIL;
//   const adminName = process.env.ADMIN_NAME || 'Admin';
//   const adminPass = process.env.ADMIN_PASSWORD;
//   if (!adminEmail || !adminPass) {
//     console.warn('ADMIN_EMAIL/ADMIN_PASSWORD missing — skipping admin bootstrap');
//     return;
//   }
//   const [rows] = await pool.query('SELECT id, email, role FROM users WHERE role = "admin"');
//   if (!rows.length) {
//     const hash = await bcrypt.hash(adminPass, 10);
//     await pool.query(
//       'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, "admin")',
//       [adminName, adminEmail, hash]
//     );
//     console.log('Admin user created:', adminEmail);
//   } else if (rows.length === 1 && rows[0].email !== adminEmail) {
//     // If an admin exists with a different email, lock it down by resetting to env email
//     await pool.query('DELETE FROM users WHERE id = ?', [rows[0].id]);
//     const hash = await bcrypt.hash(adminPass, 10);
//     await pool.query(
//       'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, "admin")',
//       [adminName, adminEmail, hash]
//     );
//     console.log('Re-seeded admin to match ADMIN_EMAIL');
//   }
// }

// app.use('/api', authRoutes);

// // Static files
// app.use(express.static(path.join(__dirname, 'public')));

// // Fallback to login.html for root
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'login.html'));
// });

// // Example protectors for HTML (client still checks /api/me; this just serves files)
// app.get('/admin.html', (req, res, next) => {
//   // Always serve file; the page JS will redirect if not admin
//   res.sendFile(path.join(__dirname, 'public', 'admin.html'));
// });

// app.get('/user.html', (req, res, next) => {
//   res.sendFile(path.join(__dirname, 'public', 'user.html'));
// });

// const PORT = process.env.PORT || 3000;
// ensureAdmin().then(() => {
//   app.listen(PORT, '0.0.0.0'  , () => console.log(`Server running on http://localhost:${PORT}`));
// });

// import express from "express";
// import session from "express-session";
// import dotenv from "dotenv";
// import cors from "cors";
// import path from "path";
// import { fileURLToPath } from "url";
// // import bcrypt from "bcrypt";
// import bcrypt from "bcryptjs";
// import { pool } from "./db.js";
// import authRoutes from "./routes/auth.js";
// import MySQLStore from "express-mysql-session";

// // Product routes
// import productsRoutes from "./routes/products.js";
// import customersRoutes from "./routes/customers.js";
// import orderRoutes from "./routes/orders.js";
// import expensesRoutes from "./routes/expenses.js";

// dotenv.config();
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const app = express();
// const PORT = process.env.PORT || 3000;

// // CORS setup — allow all origins dynamically, credentials enabled
// app.use(
//   cors({
//     origin: (origin, callback) => callback(null, true),
//     credentials: true,
//   })
// );

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// app.use(
//   session({
//     name: "sid",
//     secret: process.env.SESSION_SECRET || "dev_secret_change_me",
//     resave: false,
//     saveUninitialized: false,
//     cookie: {
//       httpOnly: true,
//       sameSite: "lax",
//       // secure: true, // enable if behind HTTPS
//       maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
//     },
//   })
// );

// // Mount routes
// app.use("/api/products", productsRoutes);
// app.use("/api/customers", customersRoutes);
// app.use("/api/orders", orderRoutes);
// app.use("/api/expenses", expensesRoutes);
// app.use("/api", authRoutes);

// // Serve static files
// app.use(express.static(path.join(__dirname, "public")));

// // Route fallbacks
// app.get("/", (req, res) => {
//   res.sendFile(path.join(__dirname, "public", "login.html"));
// });

// app.get("/admin.html", (req, res) => {
//   res.sendFile(path.join(__dirname, "public", "admin.html"));
// });

// app.get("/user.html", (req, res) => {
//   res.sendFile(path.join(__dirname, "public", "user.html"));
// });

// // Ensure admin user exists or is reset to env config
// async function ensureAdmin() {
//   const adminEmail = process.env.ADMIN_EMAIL;
//   const adminName = process.env.ADMIN_NAME || "Admin";
//   const adminPass = process.env.ADMIN_PASSWORD;

//   if (!adminEmail || !adminPass) {
//     console.warn(
//       "ADMIN_EMAIL or ADMIN_PASSWORD missing — skipping admin bootstrap"
//     );
//     return;
//   }

//   const [rows] = await pool.query(
//     'SELECT id, email, role FROM users WHERE role = "admin"'
//   );

//   // If no admin or admin email mismatch, delete all admins and insert the correct one
//   if (!rows.length || rows.some((row) => row.email !== adminEmail)) {
//     await pool.query('DELETE FROM users WHERE role = "admin"');
//     const hash = await bcrypt.hash(adminPass, 10);
//     await pool.query(
//       'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, "admin")',
//       [adminName, adminEmail, hash]
//     );
//     console.log("Admin user seeded/updated:", adminEmail);
//   }
// }

// // Start the server with DB connection test & admin setup
// async function startServer() {
//   try {
//     const conn = await pool.getConnection();
//     console.log("✅ MySQL connected");
//     conn.release();

//     await ensureAdmin();

//     app.listen(PORT, "0.0.0.0", () => {
//       console.log(`Server running on http://localhost:${PORT}`);
//     });
//   } catch (err) {
//     console.error("❌ Could not start server due to DB error:", err);
//     process.exit(1);
//   }
// }

// startServer();

// import express from "express";
// import session from "express-session";
// import MySQLStore from "express-mysql-session";
// import dotenv from "dotenv";
// import cors from "cors";
// import path from "path";
// import { fileURLToPath } from "url";
// import bcrypt from "bcryptjs";
// import { pool } from "./db.js";

// import authRoutes from "./routes/auth.js";
// import productsRoutes from "./routes/products.js";
// import customersRoutes from "./routes/customers.js";
// import orderRoutes from "./routes/orders.js";
// import expensesRoutes from "./routes/expenses.js";

// dotenv.config();
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const app = express();
// const PORT = process.env.PORT || 3000;

// // CORS setup — allow all origins dynamically, credentials enabled
// app.use(
//   cors({
//     origin: (origin, callback) => callback(null, true),
//     credentials: true,
//   })
// );

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Create MySQL session store with your pool's promise wrapper
// // const sessionStore = new MySQLStore({}, pool.promise());
// const sessionStore = new MySQLStore({}, pool);

// app.use(
//   session({
//     name: "sid",
//     secret: process.env.SESSION_SECRET || "dev_secret_change_me",
//     resave: false,
//     saveUninitialized: false,
//     store: sessionStore,
//     cookie: {
//       httpOnly: true,
//       sameSite: "lax",
//       secure: process.env.NODE_ENV === "production", // Use secure cookies in production
//       maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
//     },
//   })
// );

// // Mount routes
// app.use("/api/products", productsRoutes);
// app.use("/api/customers", customersRoutes);
// app.use("/api/orders", orderRoutes);
// app.use("/api/expenses", expensesRoutes);
// app.use("/api", authRoutes);

// // Serve static files
// app.use(express.static(path.join(__dirname, "public")));

// // Route fallbacks
// app.get("/", (req, res) => {
//   res.sendFile(path.join(__dirname, "public", "login.html"));
// });

// app.get("/admin.html", (req, res) => {
//   res.sendFile(path.join(__dirname, "public", "admin.html"));
// });

// app.get("/user.html", (req, res) => {
//   res.sendFile(path.join(__dirname, "public", "user.html"));
// });

// // Ensure admin user exists or is reset to env config
// async function ensureAdmin() {
//   const adminEmail = process.env.ADMIN_EMAIL;
//   const adminName = process.env.ADMIN_NAME || "Admin";
//   const adminPass = process.env.ADMIN_PASSWORD;

//   if (!adminEmail || !adminPass) {
//     console.warn(
//       "ADMIN_EMAIL or ADMIN_PASSWORD missing — skipping admin bootstrap"
//     );
//     return;
//   }

//   const [rows] = await pool.query(
//     'SELECT id, email, role FROM users WHERE role = "admin"'
//   );

//   // If no admin or admin email mismatch, delete all admins and insert the correct one
//   if (!rows.length || rows.some((row) => row.email !== adminEmail)) {
//     await pool.query('DELETE FROM users WHERE role = "admin"');
//     const hash = await bcrypt.hash(adminPass, 10);
//     await pool.query(
//       'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, "admin")',
//       [adminName, adminEmail, hash]
//     );
//     console.log("Admin user seeded/updated:", adminEmail);
//   }
// }

// // Start the server with DB connection test & admin setup
// async function startServer() {
//   try {
//     const conn = await pool.getConnection();
//     console.log("✅ MySQL connected");
//     conn.release();

//     await ensureAdmin();

//     app.listen(PORT, "0.0.0.0", () => {
//       console.log(`Server running on http://localhost:${PORT}`);
//     });
//   } catch (err) {
//     console.error("❌ Could not start server due to DB error:", err);
//     process.exit(1);
//   }
// }

// startServer();

import express from "express";
import session from "express-session";
import mysqlSession from "express-mysql-session"; // import as function
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { pool } from "./db.js";

import authRoutes from "./routes/auth.js";
import productsRoutes from "./routes/products.js";
import customersRoutes from "./routes/customers.js";
import orderRoutes from "./routes/orders.js";
import expensesRoutes from "./routes/expenses.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize MySQLStore by passing the session module
const MySQLStore = mysqlSession(session);

// Create the session store using your MySQL connection pool
const sessionStore = new MySQLStore({}, pool);

// CORS setup — allow all origins dynamically, credentials enabled
// app.use(
//   cors({
//     origin: (origin, callback) => callback(null, true),
//     credentials: true,
//   })
// );

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://printcorner.onrender.com",
      "https://printcorner.onrender.com/index.html",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET || "dev_secret_change_me",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production", // only true in HTTPS
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

// Mount routes
app.use("/api/products", productsRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/expenses", expensesRoutes);

// Ensure admin user exists or is reset to env config
async function ensureAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminName = process.env.ADMIN_NAME || "Admin";
  const adminPass = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPass) {
    console.warn(
      "ADMIN_EMAIL or ADMIN_PASSWORD missing — skipping admin bootstrap"
    );
    return;
  }

  const [rows] = await pool.query(
    'SELECT id, email, role FROM users WHERE role = "admin"'
  );

  // If no admin or admin email mismatch, delete all admins and insert the correct one
  if (!rows.length || rows.some((row) => row.email !== adminEmail)) {
    await pool.query('DELETE FROM users WHERE role = "admin"');
    const hash = await bcrypt.hash(adminPass, 10);
    await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, "admin")',
      [adminName, adminEmail, hash]
    );
    console.log("Admin user seeded/updated:", adminEmail);
  }
}

app.use("/api", authRoutes);
// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Route fallbacks
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/admin.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/user.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "user.html"));
});

// Start the server with DB connection test & admin setup
async function startServer() {
  try {
    const conn = await pool.getConnection();
    console.log("✅ MySQL connected");
    conn.release();

    await ensureAdmin();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Visit your app URL (not localhost) to access the server`);
    });
  } catch (err) {
    console.error("❌ Could not start server due to DB error:", err);
    process.exit(1);
  }
}

startServer();
