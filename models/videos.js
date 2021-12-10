const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    videoName: {
        type: String,
        required: true
    },
    caption: {
        type: String,
        // required: true
    },
    status: {
        type: String,
        required: true
    }
}, { timestamps: true });
module.exports = mongoose.model('video', VideoSchema);