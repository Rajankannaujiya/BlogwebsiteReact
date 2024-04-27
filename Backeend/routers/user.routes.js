import express from 'express';
import { changePassword, 
    changeUserDetails,
    getWatchHistory, 
    logoutFunction, 
    registrationFuction, 
    updateUserAvatar } from '../controllers/userAuth.controller.js';
import { loginFunction } from '../controllers/userAuth.controller.js';
import { upload } from '../middleware/multer.middleware.js';
import userMiddleware from '../middleware/user.middleware.js';

const router=express.Router();

router.route("/register").post(upload.fields([
    {
        name: "avatar",
        maxCount: 1
    }
]), registrationFuction)
router.route("/login").post(loginFunction)


// secured route
router.route("/logout").post(userMiddleware,logoutFunction)

router.route("/change-password").post(userMiddleware, changePassword)

router.route("/update-account").patch(userMiddleware, changeUserDetails)

router.route("/avatar").patch(userMiddleware, upload.single("avatar"), updateUserAvatar)

router.route("/history").get(userMiddleware, getWatchHistory)


export default router
