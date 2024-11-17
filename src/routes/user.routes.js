import {Router} from "express"
import { loginUser, logoutUser, registerUser,refreshaccessToken } from "../controllers/user.controllers.js";
import {upload} from "../middlewares/multer.middleware.js"
import {verifyJWT} from "../middlewares/auth.middlewares.js"
const router = Router()



router.route("/register").post(
    upload.fields([
         {
            name : "avatar",
            maxcount : 1
         },
         {
            name : "coverImage",
            maxcount : 1
         }
    ]),
    registerUser
)
 router.route("/login").post(loginUser)
 //secured route
 router.route("/logout").post(verifyJWT,logoutUser)

 router.route("/refresh-token").post(refreshaccessToken)
export default router