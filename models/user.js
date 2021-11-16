const mongoose = require('mongoose');

// User Schema
const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 20
    },
    lastName: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 20
    },
    email: {
        type: String,
        required: true,
        minlength: 3
    },
    password: {
        type: String,
        required: true,
        minlength: 7
    },
    // isApproved: {
    //     type: Boolean
    // },
    verificationCode: {
        type: String
    },
    phoneNumber: {
        type: String,
        required: true
    },
    profilePicture: {
        type: String
    },
    galleryPage: {
        type: String
    },
    galleryDescription: {
        type: String
    }
}, { timestamps: true });


module.exports = mongoose.model('user', UserSchema);