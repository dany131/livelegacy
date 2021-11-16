const mongoose = require('mongoose');

// Admin Schema
const AdminSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true,
        minlength: 7
    }
}, { timestamps: true });


module.exports = mongoose.model('admin', AdminSchema);