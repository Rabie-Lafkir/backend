import Session from '../models/Session.js';
import GameConsole from '../models/Console.js';
import { getIO } from '../socket.js';

const activeTimers = new Map();

export const scheduleAutoStop = (sessionId, minutes) => {
    const timeout = setTimeout(async () => {
        try {
            const session = await Session.findById(sessionId).populate('console');

            if (!session || session.status !== 'active') return;

            const endTime = new Date();
            const activeMs = endTime - session.startTime;
            const totalMs = activeMs - session.pausedDuration * 60000;
            const totalMinutes = Math.ceil(totalMs / 60000);

            const ratePerMinute = session.console.hourlyRate / 60;
            const totalPrice = parseFloat((totalMinutes * ratePerMinute).toFixed(2));

            session.endTime = endTime;
            session.status = 'expired';
            session.totalMinutes = totalMinutes;
            session.totalPrice = totalPrice;

            await session.save();

            await GameConsole.findByIdAndUpdate(session.console._id, {
                status: 'free',
                currentSession: null
            });

            console.log(`⏱️ Auto-stopped session ${sessionId} (${totalMinutes} mins, $${totalPrice})`);

            // Remove from active timers
            activeTimers.delete(sessionId);
        } catch (err) {
            console.error('❌ Auto-stop error:', err.message);
        }
    }, minutes * 60 * 1000);

    activeTimers.set(sessionId, timeout);
};

export const clearAutoStop = (sessionId) => {
    if (activeTimers.has(sessionId)) {
        clearTimeout(activeTimers.get(sessionId));
        activeTimers.delete(sessionId);
    }
};

export const startLiveTimerEmitter = () => {
    setInterval(async () => {
        const sessions = await Session.find({ status: 'active' });

        const io = getIO();
        const now = new Date();

        sessions.forEach(session => {
            const elapsedMs = now - session.startTime - session.pausedDuration * 60000;
            const elapsedMinutes = Math.floor(elapsedMs / 60000);
            const remainingMinutes = session.plannedMinutes
                ? Math.max(0, session.plannedMinutes - elapsedMinutes)
                : null;

            io.emit('sessionTimerTick', {
                sessionId: session._id,
                consoleId: session.console,
                type: session.type,
                elapsedMinutes,
                remainingMinutes
            });
        });
    }, 1000); // every second
};

