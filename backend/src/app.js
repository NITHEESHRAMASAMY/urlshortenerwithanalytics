const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const useragent = require('express-useragent');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const urlRoutes = require('./routes/urlRoutes');
const { redirectUrl } = require('./controllers/urlController');

const app = express();
const server = http.createServer(app);

// Configure Socket.IO for real-time channels
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Expose io on the app instance so controllers can retrieve it
app.set('io', io);

// Real-time listener tracking active socket sessions
let liveVisitorsCount = 0;
io.on('connection', (socket) => {
  liveVisitorsCount++;
  io.emit('live-visitors-update', { count: liveVisitorsCount });

  socket.on('disconnect', () => {
    liveVisitorsCount = Math.max(0, liveVisitorsCount - 1);
    io.emit('live-visitors-update', { count: liveVisitorsCount });
  });
});

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(useragent.express());

// Route Mounts
app.use('/api/auth', authRoutes);
app.use('/api/urls', urlRoutes);
app.use('/api/workspaces', require('./routes/workspaceRoutes'));
app.use('/api/activities', require('./routes/activityRoutes'));

// Redirection root wildcard handler (/:shortCode)
app.get('/:shortCode', redirectUrl);

// Server check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`NexLink Backend is running on port ${PORT}`);
});
