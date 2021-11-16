const mongoose = require('mongoose');

const MeetingSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    topic: {
        type: String,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    agenda: {
        type: String,
        required: true
    },
    startUrl: {
        type: String,
        required: true
    },
    joinUrl: {
        type: String,
        required: true
    },
    hostId: {
        type: String,
        required: true
    },
    hostEmail: {
        type: String,
        required: true
    },
    timezone: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
}, { timestamps: true });
module.exports = mongoose.model('meeting', MeetingSchema);