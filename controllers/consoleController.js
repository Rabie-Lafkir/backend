import GameConsole from '../models/Console.js';
import Session from '../models/Session.js';

// GET all consoles with embedded session info
export const getAllConsoles = async (req, res) => {
    try {
        const consoles = await GameConsole.find().sort({ createdAt: 1 });

        const consolesWithSession = await Promise.all(
            consoles.map(async (console) => {
                const session = console.currentSession
                    ? await Session.findById(console.currentSession).select(
                        'startTime pausedDuration pauseStartTime type plannedMinutes'
                    )
                    : null;

                return {
                    _id: console._id,
                    name: console.name,
                    hourlyRate: console.hourlyRate,
                    status: console.status,
                    currentSession: session?._id ?? null,
                    session: session
                        ? {
                            startTime: session.startTime,
                            pausedDuration: session.pausedDuration,
                            pauseStartTime: session.pauseStartTime,
                            type: session.type,
                            plannedMinutes: session.plannedMinutes
                        }
                        : null
                };
            })
        );

        res.json(consolesWithSession);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch consoles.', error: err.message });
    }
};


// POST create new console
export const createConsole = async (req, res) => {
    try {
        const { name, hourlyRate } = req.body;

        const newConsole = new GameConsole({
            name,
            hourlyRate
        });

        await newConsole.save();
        res.status(201).json(newConsole);
    } catch (err) {
        res.status(400).json({ message: 'Failed to create console.', error: err.message });
    }
};

// PUT update console
export const updateConsole = async (req, res) => {
    try {
        const updated = await GameConsole.findByIdAndUpdate(req.params.id,req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: 'Update failed', error: err.message });
    }
};

// DELETE console
export const deleteConsole = async (req, res) => {
    try {
        await GameConsole.findByIdAndDelete(req.params.id);
        res.json({ message: 'Console deleted' });
    } catch (err) {
        res.status(400).json({ message: 'Delete failed', error: err.message });
    }
};
