const express = require('express');
const router = express.Router();
const auth = require("../../utils/auth");
const fs = require('fs');
const Photo = require("../../models/photos");
const Video = require("../../models/videos");
const Status = require("../../models/status");
// const Comment = require("../../models/comments");

// Delete pictures
router.post("/delete-photo/:photoId", auth, async (req, res) => {
    await Photo.findById(req.params.photoId).then(async photo => {
        if (photo) {
            try {
                await Photo.findByIdAndRemove(req.params.photoId);
                fs.unlink(`${process.env.IMAGE_PATH}${photo.imageName}`, (error) => {
                    // console.log(error);
                });
                // Delete all comments
                // await Comment.deleteMany({ postId: req.params.photoId });
                res.status(200).json({ message: "Photo deleted successfully" });
                return;
            } catch (error) {
                res.status(400).json({ message: error.message });
                return;
            }
        }
        res.status(404).json({ message: "Photo was not found" });
    }).catch((error) => {
        res.status(500).json({ message: "Something went wrong" });
    })
});

// Delete videos
router.post("/delete-video/:videoId", auth, async (req, res) => {
    await Video.findById(req.params.videoId).then(async video => {
        if (video) {
            try {
                await Video.findByIdAndRemove(req.params.videoId);
                fs.unlink(`${process.env.VIDEO_PATH}${video.videoName}`, (error) => {
                    // console.log(error);
                });
                // await Comment.deleteMany({ postId: req.params.videoId });
                res.status(200).json({ message: "Video deleted successfully" });
                return;
            } catch (error) {
                res.status(400).json({ message: error.message });
                return;
            }
        }
        res.status(404).json({ message: "Video was not found" });
    }).catch((error) => {
        res.status(500).json({ message: "Something went wrong" });
    })
});

// Delete status
router.post("/delete-status/:statusId", auth, async (req, res) => {
    await Status.findById(req.params.statusId).then(async status => {
        if (status) {
            try {
                await Status.findByIdAndRemove(req.params.statusId);
                res.status(200).json({ message: "Status deleted successfully" });
                return;
            } catch (error) {
                res.status(400).json({ message: error.message });
                return;
            }
        }
        res.status(404).json({ message: "Status was not found" });
    }).catch((error) => {
        res.status(500).json({ message: "Something went wrong" });
    })
});

// Update post status (Approved, Declined)
router.post("/update-status/:postId", auth, async (req, res) => {
    try {
        if (!req.body.status) {
            res.status(400).json({ message: "Fields are required" });
            return;
        }
        let post = {};
        let isPhoto = true;
        const photo = await Photo.findById(req.params.postId);
        post = photo;
        if (!photo) {
            isPhoto = false;
            const video = await Video.findById(req.params.postId);
            post = video;
            if (!video) {
                res.status(400).json({ message: "Post not found" });
                return;
            }
        }
        if (post.status !== "Pending") {
            res.status(400).json({ message: "Status already updated" });
            return;
        }
        if (req.body.status === "Approved") {
            if (isPhoto) {
                Photo.findByIdAndUpdate(req.params.postId, { status: req.body.status },
                    function (err, docs) {
                        if (err) {
                            res.status(400).json({ message: err.message });
                            return;
                        }
                        else {
                            res.status(200).json({ message: `Post ${req.body.status} Successfully` });
                            return;
                        }
                    });
            } else {
                Video.findByIdAndUpdate(req.params.postId, { status: req.body.status },
                    function (err, docs) {
                        if (err) {
                            res.status(400).json({ message: err.message });
                            return;
                        }
                        else {
                            res.status(200).json({ message: `Post ${req.body.status} Successfully` });
                            return;
                        }
                    });
            }
        } else if (req.body.status === "Declined") {
            if (isPhoto) {
                await Photo.findByIdAndRemove(req.params.postId);
                fs.unlink(`${process.env.IMAGE_PATH}${post.imageName}`, (error) => {
                    // console.log(error);
                });
                res.status(200).json({ message: `Post ${req.body.status} Successfully` });
                return;
            } else {
                await Video.findByIdAndRemove(req.params.postId);
                fs.unlink(`${process.env.VIDEO_PATH}${post.videoName}`, (error) => {
                    // console.log(error);
                });
                res.status(200).json({ message: `Post ${req.body.status} Successfully` });
                return;
            }
        }
    } catch (error) {
        res.status(500).json({ message: "Something went wrong" });
        return;
    }
});

// Update status information (Approved, Declined)
router.post("/update-status-information/:statusId", auth, async (req, res) => {
    try {
        if (!req.body.status) {
            res.status(400).json({ message: "Fields are required" });
            return;
        }
        const post = await Status.findById(req.params.statusId);
        if (post.status !== "Pending") {
            res.status(400).json({ message: "Status already updated" });
            return;
        }
        if (req.body.status === "Approved") {
            Status.findByIdAndUpdate(req.params.statusId, { status: req.body.status },
                function (err, docs) {
                    if (err) {
                        res.status(400).json({ message: err.message });
                        return;
                    }
                    else {
                        res.status(200).json({ message: `Post ${req.body.status} Successfully` });
                        return;
                    }
                });
        } else if (req.body.status === "Declined") {
            await Status.findByIdAndRemove(req.params.statusId);
            res.status(200).json({ message: `Post ${req.body.status} Successfully` });
            return;
        } else {
            res.status(400).json({ message: "Status must be Approved or Declined" });
            return;
        }
    } catch (error) {
        res.status(500).json({ message: "Something went wrong" });
        return;
    }
});

module.exports = router;