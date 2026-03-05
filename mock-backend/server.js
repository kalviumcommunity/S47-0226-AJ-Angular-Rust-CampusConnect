const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = 'your-secret-key';

// In-memory data storage
const users = [];
const courses = [];
const enrollments = [];
const transactions = [];
const rooms = [];
const books = [];
const employees = [];

// Unified backend on single port
const unifiedApp = express();
unifiedApp.use(cors());
unifiedApp.use(express.json());

// Mount all services on the unified app
unifiedApp.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'unified-backend' });
});

// Auth routes
unifiedApp.post('/api/auth/register', async (req, res) => {
  const { username, password, role, campus_id, email, full_name } = req.body;
  
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }
  
  const password_hash = await bcrypt.hash(password, 10);
  users.push({ username, password_hash, role, campus_id, email, full_name });
  
  res.json({ message: 'User registered successfully' });
});

unifiedApp.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = jwt.sign(
    { sub: user.username, role: user.role, campus_id: user.campus_id },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  res.json({
    token,
    user: {
      username: user.username,
      role: user.role,
      campus_id: user.campus_id,
      email: user.email,
      full_name: user.full_name
    }
  });
});

unifiedApp.get('/api/auth/validate', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ valid: false, error: 'No token provided' });
  }
  
  try {
    const claims = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, claims });
  } catch (error) {
    res.status(401).json({ valid: false, error: 'Invalid token' });
  }
});

// Academics routes
unifiedApp.get('/api/academics/courses', (req, res) => res.json(courses));
unifiedApp.post('/api/academics/courses', (req, res) => {
  const course = { id: Date.now().toString(), ...req.body, created_at: new Date() };
  courses.push(course);
  res.json(course);
});
unifiedApp.get('/api/academics/enrollments', (req, res) => res.json(enrollments));
unifiedApp.post('/api/academics/enrollments', (req, res) => {
  const enrollment = { id: Date.now().toString(), ...req.body, enrolled_at: new Date() };
  enrollments.push(enrollment);
  res.json(enrollment);
});

// Finance routes
unifiedApp.get('/api/finance/transactions', (req, res) => res.json(transactions));
unifiedApp.post('/api/finance/transactions', (req, res) => {
  const transaction = { id: Date.now().toString(), ...req.body, created_at: new Date() };
  transactions.push(transaction);
  res.json(transaction);
});

// Hostel routes
unifiedApp.get('/api/hostel/rooms', (req, res) => res.json(rooms));
unifiedApp.post('/api/hostel/rooms', (req, res) => {
  const room = { id: Date.now().toString(), ...req.body, created_at: new Date() };
  rooms.push(room);
  res.json(room);
});

// Library routes
unifiedApp.get('/api/library/books', (req, res) => res.json(books));
unifiedApp.post('/api/library/books', (req, res) => {
  const book = { id: Date.now().toString(), ...req.body, created_at: new Date() };
  books.push(book);
  res.json(book);
});

// HR routes
unifiedApp.get('/api/hr/employees', (req, res) => res.json(employees));
unifiedApp.post('/api/hr/employees', (req, res) => {
  const employee = { id: Date.now().toString(), ...req.body, created_at: new Date() };
  employees.push(employee);
  res.json(employee);
});

// Start unified backend
unifiedApp.listen(3000, () => {
  console.log('🚀 CampusConnect Unified Backend running on http://localhost:3000');
  console.log('📡 All services available at http://localhost:3000/api/*');
});
