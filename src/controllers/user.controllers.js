import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponce} from "../utils/ApiResponce.js"

const registerUser = asyncHandler(async(req,res)=>{
    //get user details from frontend
    //validation-not empty
    //cheack if user already exists : username ,email
    //cheack for img,chake for avtear
    //upload them to cloudunary
    //create user object -create entry in db
    //remove pass and refresh token field from response
    //cheack for user creation
    //return res


    const {fullName, email, username, password } = req.body
    console.log("email: ", email);
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }
    console.log(username,email)
    const existedUser =await User.findOne({
        $or: [{ username }, { email }]
    })
    console.log('Existed user:', existedUser); // Add this for debugging
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    // console.log(req.files)
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }
    return res.status(201).json(
        new ApiResponce(200, createdUser, "User registered Successfully")
    )
} )




export  {registerUser}