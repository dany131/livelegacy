const express = require('express');
const router = express.Router();
const auth = require("../../utils/auth");
const User = require("../../models/user");
const helper = require("../../utils/Helper");
const { nanoid } = require("nanoid");
const fs = require('fs');
const mime = require('mime');
const Photo = require("../../models/photos");
const Video = require("../../models/videos");
const Status = require("../../models/status");
// const Comment = require("../../models/comments");

// Upload pictures
router.post("/upload-photo/:userId", auth, async (req, res) => {
    await User.findById(req.params.userId).then(async user => {
        if (user) {
            if (!req.body.image) {
                res.status(400).json({ message: "Image can't be empty" });
                return;
            }
            // if (!req.body.caption) {
            //     res.status(400).json({ message: "Caption can't be empty" });
            //     return;
            // }
            try {
                let userImageID = "";
                var matches = req.body.image.match(/^data:([A-Za-z-+/]+);base64,(.+)$/), response = {};
                if (matches.length !== 3) {
                    res.status(400).json({ message: "Invalid input string for image" });
                    return;
                }
                response.type = matches[1];
                response.data = new Buffer.from(matches[2], 'base64');
                let decodedImg = response;
                let imageBuffer = decodedImg.data;
                let type = decodedImg.type;
                let extension = mime.extension(type);
                let fileName = `${nanoid()}.` + extension;
                userImageID = fileName;
                try {
                    fs.writeFileSync(process.env.IMAGE_PATH + fileName, imageBuffer, 'utf8');
                    const photo = new Photo({
                        userId: req.params.userId,
                        imageName: userImageID,
                        caption: req.body.caption,
                        status: "Pending"
                    }).save();
                    res.status(200).json({ message: "Photo uploaded successfully with pending status" });
                    return;
                } catch (e) {
                    res.status(400).json({ message: e.message });
                    return;
                }
            } catch (error) {
                res.status(400).json({ message: error.message });
                return;
            }
        }
        res.status(404).json({ message: "User was not found" });
    }).catch((error) => {
        console.log(error);
        res.status(500).json({ message: "Something went wrong" });
    })
});

// Delete pictures
router.post("/delete-photo/:userId", auth, async (req, res) => {
    await User.findById(req.params.userId).then(async user => {
        if (user) {
            if (!req.body.imageName) {
                res.status(400).json({ message: "Fields are required" });
                return;
            }
            // Check if image exists
            const findImage = await Photo.findOne({ userId: req.params.userId, imageName: req.body.imageName });
            if (!findImage) {
                res.status(400).json({ message: "Image not found" });
                return;
            }
            try {
                await Photo.findByIdAndRemove(findImage._doc._id);
                fs.unlink(`${process.env.IMAGE_PATH}${req.body.imageName}`, (error) => {
                    // console.log(error);
                });
                // await Comment.deleteMany({ postId: findImage._doc._id });
                res.status(200).json({ message: "Photo deleted successfully" });
                return;
            } catch (error) {
                res.status(400).json({ message: error.message });
                return;
            }
        }
        res.status(404).json({ message: "User was not found" });
    }).catch((error) => {
        res.status(500).json({ message: "Something went wrong" });
    })
});

// Upload videos
router.post('/upload-video/:userId', auth, helper.videoUpload.single('video'), (req, res) => {
    if (!req.file) {
        res.status(400).json({ message: "File can't be empty" });
        return;
    }
    // if (!req.body.caption) {
    //     res.status(400).json({ message: "Caption can't be empty" });
    //     return;
    // }
    const video = new Video({
        userId: req.params.userId,
        videoName: req.file.filename,
        caption: req.body.caption,
        status: "Pending"
    }).save();
    res.status(200).json({ message: "Video uploaded successfully with pending status" });
}, (error, req, res, next) => {
    res.status(400).send({ message: error.message });
});

// Delete videos
router.post("/delete-video/:userId", auth, async (req, res) => {
    await User.findById(req.params.userId).then(async user => {
        if (user) {
            if (!req.body.videoName) {
                res.status(400).json({ message: "Fields are required" });
                return;
            }
            // Check if image exists
            const findVideo = await Video.findOne({ userId: req.params.userId, videoName: req.body.videoName });
            if (!findVideo) {
                res.status(400).json({ message: "Video not found" });
                return;
            }
            try {
                await Video.findByIdAndRemove(findVideo._doc._id);
                fs.unlink(`${process.env.VIDEO_PATH}${req.body.videoName}`, (error) => {
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
        res.status(404).json({ message: "User was not found" });
    }).catch((error) => {
        res.status(500).json({ message: "Something went wrong" });
    })
});

// Upload status
router.post("/upload-status/:userId", auth, async (req, res) => {
    await User.findById(req.params.userId).then(async user => {
        if (user) {
            if (!req.body.description) {
                res.status(400).json({ message: "Description can't be empty" });
                return;
            }
            const status = new Status({
                userId: req.params.userId,
                description: req.body.description,
                status: "Pending"
            }).save();
            res.status(200).json({ message: "Status uploaded successfully with pending status" });
            return;
        }
        res.status(404).json({ message: "User was not found" });
    }).catch((error) => {
        console.log(error);
        res.status(500).json({ message: "Something went wrong" });
    })
});

// Delete Status
router.post("/delete-status/:statusId", auth, async (req, res) => {
    await Status.findById(req.params.statusId).then(async status => {
        if (status) {
            await Status.findByIdAndRemove(req.params.statusId);
            res.status(200).json({ message: "Status deleted successfully" });
            return;
        }
        res.status(404).json({ message: "Status was not found" });
    }).catch((error) => {
        res.status(500).json({ message: "Something went wrong" });
    })
});

// Get users all uploads
router.get("/all-user-upload/:userId", async (req, res) => {
    await User.findById(req.params.userId).then(async user => {
        if (user) {
            const photos = await Photo.find({ userId: req.params.userId });
            const videos = await Video.find({ userId: req.params.userId });
            const status = await Status.find({ userId: req.params.userId });
            res.status(200).json({ message: "User's all uploads", data: { photos: photos, videos: videos, status: status } });
            return;
        }
        res.status(404).json({ message: "User was not found", data: null });
    }).catch(() => {
        res.status(500).json({ message: "Something went wrong", data: null });
    })
});

// Get all photos
router.get("/all-photos", async (req, res) => {
    await Photo.find().then(async photos => {
        if (photos) {
            let allData = [];
            for (let i = 0; i < photos.length; i++) {
                const user = await User.findById(photos[i]._doc.userId);
                user.isApproved = undefined;
                user.verificationCode = undefined;
                user.password = undefined;
                let data = {
                    photo: photos[i],
                    user: user
                }
                allData.push(data);
            }
            res.status(200).json({ message: "All photos", data: allData });
            return;
        }
        res.status(404).json({ message: "No photo found", data: null });
    }).catch(() => {
        res.status(500).json({ message: "Something went wrong", data: null });
    })
});

// Get all videos
router.get("/all-videos", async (req, res) => {
    await Video.find().then(async videos => {
        if (videos) {
            let allData = [];
            for (let i = 0; i < videos.length; i++) {
                const user = await User.findById(videos[i]._doc.userId);
                user.isApproved = undefined;
                user.verificationCode = undefined;
                user.password = undefined;
                let data = {
                    video: videos[i],
                    user: user
                }
                allData.push(data);
            }
            res.status(200).json({ message: "All videos", data: allData });
            return;
        }
        res.status(404).json({ message: "No videos found", data: null });
    }).catch(() => {
        res.status(500).json({ message: "Something went wrong", data: null });
    })
});

// Get all status
router.get("/all-status", async (req, res) => {
    await Status.find().then(async status => {
        if (status) {
            let allData = [];
            for (let i = 0; i < status.length; i++) {
                const user = await User.findById(status[i]._doc.userId);
                user.isApproved = undefined;
                user.verificationCode = undefined;
                user.password = undefined;
                let data = {
                    status: status[i],
                    user: user
                }
                allData.push(data);
            }
            res.status(200).json({ message: "All status", data: allData });
            return;
        }
        res.status(404).json({ message: "No status found", data: null });
    }).catch(() => {
        res.status(500).json({ message: "Something went wrong", data: null });
    })
});

// // Add comment
// router.post("/add-comment/:userId/:postId", auth, async (req, res) => {
//     try {
//         if (!req.body.text) {
//             res.status(400).json({ message: "Fields are required" });
//             return;
//         }
//         const user = await User.findById(req.params.userId);
//         if (!user) {
//             res.status(400).json({ message: "User not found" });
//             return;
//         }
//         const photo = await Photo.findById(req.params.postId);
//         if (!photo) {
//             const video = await Video.findById(req.params.postId);
//             if (!video) {
//                 res.status(400).json({ message: "Post not found" });
//                 return;
//             }
//         }
//         const comment = new Comment({
//             userId: req.params.userId,
//             postId: req.params.postId,
//             text: req.body.text
//         }).save();
//         res.status(200).json({ message: "Comment added successfully" });
//         return;
//     } catch (error) {
//         res.status(500).json({ message: "Something went wrong" });
//         return;
//     }
// });

// // Delete comment
// router.post("/delete-comment/:userId/:commentId", auth, async (req, res) => {
//     await User.findById(req.params.userId).then(async user => {
//         if (user) {
//             try {
//                 const comment = await Comment.findById(req.params.commentId);
//                 if (!comment) {
//                     res.status(400).json({ message: "Comment not found" });
//                     return;
//                 }
//                 post = {};
//                 const photo = await Photo.findById(comment.postId);
//                 post = photo;
//                 if (!photo) {
//                     const video = await Video.findById(comment.postId);
//                     post = video;
//                     if (!video) {
//                         res.status(400).json({ message: "Post not found" });
//                         return;
//                     }
//                 }
//                 if (Object.keys(post).length > 0) {
//                     if (req.params.userId != post.userId || req.params.userId != comment.userId) {
//                         res.status(400).json({ message: "You can't delete this comment" });
//                         return;
//                     }
//                 }

//                 await Comment.findByIdAndRemove(req.params.commentId);
//                 res.status(200).json({ message: "Comment deleted successfully" });
//                 return;
//             } catch (error) {
//                 res.status(400).json({ message: error.message });
//                 return;
//             }
//         }
//         res.status(400).json({ message: "User was not found" });
//     }).catch((error) => {
//         res.status(500).json({ message: "Something went wrong" });
//         return;
//     })
// });

// // Get all comments by postid
// router.get("/all-comments/:postId", async (req, res) => {
//     try {
//         let post = {};
//         const photo = await Photo.findById(req.params.postId);
//         post = photo;
//         if (!photo) {
//             const video = await Video.findById(req.params.postId);
//             post = video;
//             if (!video) {
//                 res.status(400).json({ message: "Post not found" });
//                 return;
//             }
//         }
//         let allData = [];
//         const comments = await Comment.find({ postId: req.params.postId });
//         for (let i = 0; i < comments.length; i++) {
//             const user = await User.findById(comments[i]._doc.userId);
//             let userData = {};
//             if (user) {
//                 userData = {
//                     firstName: user.firstName,
//                     lastName: user.lastName,
//                     profilePicture: user.profilePicture,
//                 }
//             }
//             let data = { user: userData, comment: comments[i] };
//             allData.push(data);
//         }
//         res.status(200).json({ message: "All comments", data: allData });
//         return;
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ message: "Something went wrong" });
//         return;
//     }
// });


module.exports = router;