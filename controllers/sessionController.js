import Session from '../models/Session.js';
import GameConsole from '../models/Console.js';
import { scheduleAutoStop } from '../utils/sessionTimer.js';
import { getIO } from '../socket.js';

// 🔹 Start session
export const startSession = async (req, res) => {
  try {
    const { consoleId, type, plannedMinutes } = req.body;

    const gameConsole = await GameConsole.findById(consoleId);
    if (!gameConsole || gameConsole.status !== 'free') {
      return res.status(400).json({ message: 'Console not available or already in use.' });
    }

    const session = new Session({
      console: consoleId,
      type,
      plannedMinutes: type === 'planned' ? plannedMinutes : null
    });

    await session.save();

    // Link console to this session
    gameConsole.status = 'playing';
    gameConsole.currentSession = session._id;
    await gameConsole.save();

    // Emit real-time update
    const io = getIO();
    io.emit('consoleStatusChanged', {
      consoleId: gameConsole._id,
      status: 'playing',
      sessionId: session._id
    });

    if (type === 'planned' && plannedMinutes) {
      scheduleAutoStop(session._id.toString(), plannedMinutes);
    }

    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ message: 'Failed to start session.', error: err.message });
  }
};

// 🔹 Pause session
export const pauseSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session || session.status !== 'active') {
      return res.status(400).json({ message: 'Session not active.' });
    }

    session.status = 'paused';
    session.pauseStartTime = new Date();
    await session.save();

    await GameConsole.findByIdAndUpdate(session.console, { status: 'paused' });

    // Emit
    const io = getIO();
    io.emit('consoleStatusChanged', {
      consoleId: session.console,
      status: 'paused',
      sessionId: session._id
    });

    res.json({ message: 'Session paused.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to pause session.', error: err.message });
  }
};

// 🔹 Resume session
export const resumeSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session || session.status !== 'paused') {
      return res.status(400).json({ message: 'Session not paused.' });
    }

    const pausedMs = new Date() - new Date(session.pauseStartTime);
    session.pausedDuration += Math.floor(pausedMs / 60000);
    session.status = 'active';
    session.pauseStartTime = null;
    await session.save();

    await GameConsole.findByIdAndUpdate(session.console, { status: 'playing' });

    const io = getIO();
    io.emit('consoleStatusChanged', {
      consoleId: session.console,
      status: 'playing',
      sessionId: session._id
    });

    res.json({ message: 'Session resumed.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to resume session.', error: err.message });
  }
};

// 🔹 Stop session
export const stopSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).populate('console');
    if (!session || session.status === 'stopped') {
      return res.status(400).json({ message: 'Session already stopped or invalid.' });
    }

    session.endTime = new Date();
    session.status = 'stopped';

    const activeMs = session.endTime - session.startTime;
    const totalMs = activeMs - session.pausedDuration * 60000;
    session.totalMinutes = Math.ceil(totalMs / 60000);

    const ratePerMinute = session.console.hourlyRate / 60;
    session.totalPrice = parseFloat((session.totalMinutes * ratePerMinute).toFixed(2));

    await session.save();

    await GameConsole.findByIdAndUpdate(session.console._id, {
      status: 'free',
      currentSession: null
    });

    const io = getIO();
    io.emit('consoleStatusChanged', {
      consoleId: session.console._id,
      status: 'free'
    });

    res.json({
      message: 'Session stopped.',
      totalMinutes: session.totalMinutes,
      totalPrice: session.totalPrice
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to stop session.', error: err.message });
  }
};
