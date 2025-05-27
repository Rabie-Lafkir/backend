import mongoose from 'mongoose';

const consoleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    hourlyRate: {
        type: Number,
        required: true,
        default: 10
    },
    status: {
        type: String,
        enum: ['free', 'playing', 'paused'],
        default: 'free'
    },
    currentSession: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        default: null
    }
}, {
    timestamps: true
});

const GameConsole = mongoose.model('Console', consoleSchema);
export default GameConsole;
