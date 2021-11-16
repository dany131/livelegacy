const mongoose = require('mongoose');

const StatusSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    }
}, { timestamps: true });
module.exports = mongoose.model('status', StatusSchema);