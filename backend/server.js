const express = require('express');
const cors = require('cors');
const db = require('./db');
const bcrypt = require('bcrypt');

require('dotenv').config();
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

app.get('/', (req, res) => {
  res.send('FitTrack backend!');
});

//MIDDLEWARES
function auth(req, res, next) {
  const header = req.headers.authorization; 
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header.' });
  }

  const token = header.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; 
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

//AUTH
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const checkSql = 'SELECT * FROM users WHERE username = ?';
  db.get(checkSql, [username], async (err, row) => {
    if (err) {
      console.error('Error checking user:', err.message);
      return res.status(500).json({ error: 'Database error.' });
    }
    if (row) {
      return res.status(409).json({ error: 'Username already taken.' });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const insertSql = 'INSERT INTO users (username, password) VALUES (?, ?)';
      db.run(insertSql, [username, hashedPassword], function (err) {
        if (err) {
          console.error('Error inserting user:', err.message);
          return res.status(500).json({ error: 'Database error.' });
        }
        res.status(201).json({ message: 'User registered successfully.' });
      });
    } catch (err) {
      console.error('Error hashing password:', err.message);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const sql = 'SELECT * FROM users WHERE username = ?';
  db.get(sql, [username], async (err, user) => {
    if (err) {
      console.error('Error during login:', err.message);
      return res.status(500).json({ error: 'Database error.' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    try {
      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return res.status(401).json({ error: 'Invalid username or password.' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role || 'user' },
        JWT_SECRET,
        { expiresIn: '2h' }
      );

      res.json({
        message: 'Login successful.',
        token
      });
    } catch (err) {
      console.error('Error comparing passwords:', err.message);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });
});

//WORKOUTS 
app.post('/api/workouts', auth, (req, res) => {
  const { date, activity, duration, intensity, notes, distance, gym_exercises } = req.body;
  const user_id = req.user.id;

  if (!date || !activity || !duration) {
    return res.status(400).json({ error: 'Date, activity and duration are required.' });
  }

  const sql =
    'INSERT INTO workouts (date, activity, duration, intensity, notes, distance, gym_exercises, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';

  db.run(sql, [date, activity, duration, intensity, notes, distance, gym_exercises, user_id], function (err) {
    if (err) {
      console.error('Error inserting workout:', err.message);
      return res.status(500).json({ error: 'Database error.' });
    }

    res.status(201).json({
      message: 'Workout saved successfully.',
      workoutId: this.lastID
    });
  });
});

app.get('/api/workouts', auth, (req, res) => {
  const userId = req.user.id;

  const sql = 'SELECT * FROM workouts WHERE user_id = ? ORDER BY date DESC';
  db.all(sql, [userId], (err, rows) => {
    if (err) {
      console.error('Error fetching workouts:', err.message);
      return res.status(500).json({ error: 'Database error.' });
    }
    res.json(rows);
  });
});

app.put('/api/workouts/:id', auth, (req, res) => {
  const workoutId = req.params.id;
  const { date, activity, duration, intensity, notes, distance, gym_exercises } = req.body;
  const user_id = req.user.id;

  if (!date || !activity || !duration) {
    return res.status(400).json({ error: 'Date, activity and duration are required.' });
  }

  const sql = `
    UPDATE workouts
    SET date = ?, activity = ?, duration = ?, intensity = ?, notes = ?, distance = ?, gym_exercises = ?
    WHERE id = ? AND user_id = ?
  `;

  db.run(
    sql,
    [date, activity, Number(duration), intensity, notes, distance, gym_exercises, workoutId, user_id],
    function (err) {
      if (err) {
        console.error('Error updating workout:', err.message);
        return res.status(500).json({ error: 'Database error.' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Workout not found (or not yours).' });
      }

      res.json({ message: 'Workout updated successfully.' });
    }
  );
});

app.delete('/api/workouts/:id', auth, (req, res) => {
  const workoutId = req.params.id;
  const user_id = req.user.id;

  const sql = 'DELETE FROM workouts WHERE id = ? AND user_id = ?';

  db.run(sql, [workoutId, user_id], function (err) {
    if (err) {
      console.error('Error deleting workout:', err.message);
      return res.status(500).json({ error: 'Database error.' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Workout not found (or not yours).' });
    }

    res.json({ message: 'Workout deleted successfully.' });
  });
});

//ADMIN 
app.get('/api/admin/users', auth, requireAdmin, (req, res) => {
  const sql = 'SELECT id, username, role FROM users ORDER BY id ASC';
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Error fetching users:', err.message);
      return res.status(500).json({ error: 'Database error.' });
    }
    res.json(rows);
  });
});

app.put('/api/admin/users/:id/role', auth, requireAdmin, (req, res) => {
  const targetUserId = req.params.id;
  const { role } = req.body;

  if (!role || !['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: "Role must be 'user' or 'admin'." });
  }

  const sql = 'UPDATE users SET role = ? WHERE id = ?';
  db.run(sql, [role, targetUserId], function (err) {
    if (err) {
      console.error('Error updating role:', err.message);
      return res.status(500).json({ error: 'Database error.' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ message: 'Role updated successfully.' });
  });
});

app.get('/api/admin/workouts', auth, requireAdmin, (req, res) => {
  const sql = `
    SELECT
      w.id,
      w.date,
      w.activity,
      w.duration,
      w.intensity,
      w.notes,
      w.distance,
      w.gym_exercises,
      w.user_id,
      u.username
    FROM workouts w
    JOIN users u ON u.id = w.user_id
    ORDER BY w.date DESC, w.id DESC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Error fetching admin workouts:', err.message);
      return res.status(500).json({ error: 'Database error.' });
    }
    res.json(rows);
  });
});

app.delete('/api/admin/workouts/:id', auth, requireAdmin, (req, res) => {
  const workoutId = req.params.id;

  const sql = 'DELETE FROM workouts WHERE id = ?';

  db.run(sql, [workoutId], function (err) {
    if (err) {
      console.error('Error deleting admin workout:', err.message);
      return res.status(500).json({ error: 'Database error.' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Workout not found.' });
    }

    res.json({ message: 'Workout deleted (admin).' });
  });
});


const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server je pokrenut na http://localhost:${PORT}`);
});
