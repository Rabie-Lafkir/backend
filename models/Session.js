import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
    console: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Console',
        required: true
    },
    type: {
        type: String,
        enum: ['planned', 'unplanned'],
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'paused', 'stopped', 'expired'],
        default: 'active'
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: Date,
    plannedMinutes: Number,
    pausedDuration: {
        type: Number,
        default: 0
    },
    pauseStartTime: Date,
    totalMinutes: Number,
    totalPrice: Number
}, {
    timestamps: true
});

const Session = mongoose.model('Session', sessionSchema);
export default Session;
