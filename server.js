import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import connectDB from './config/db.js';
import consoleRoutes from './routes/consoleRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import { initSocket } from './socket.js';
import { startLiveTimerEmitter } from './utils/sessionTimer.js';
import statsRoutes from './routes/statsRoutes.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/consoles', consoleRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/auth', authRoutes);

app.use('/uploads', express.static('uploads'));



const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      initSocket(server); 
      startLiveTimerEmitter(); 
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB:', err);
    process.exit(1);
  });
