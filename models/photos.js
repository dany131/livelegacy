const mongoose = require('mongoose');

const PhotoSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    imageName: {
        type: String,
        required: true
    },
    caption: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    }
}, { timestamps: true });
module.exports = mongoose.model('photo', PhotoSchema);