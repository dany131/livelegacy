const mongoose = require('mongoose');

// Post Media Schema - Deprecated
const PostMediaSchema = new mongoose.Schema({
    postId: {
        type: String,
        required: true
    },
    mediaName: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('postMedia', PostMediaSchema);
