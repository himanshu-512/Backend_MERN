import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponce} from "../utils/ApiResponce.js"
import jwt from "jsonwebtoken"


const generateAccessAndRefreshTokens = async(userId)=> {
   // console.log(userId)
//   try {
//     const user = await User.findById(userId)
//     //console.log(user)

    try {
        const user = await User.findById(userId)
        let accessToken;
        let refreshToken;
        accessToken = user.generateAccessToken()
        refreshToken =user.generateRefreshToken()
        console.log("Access Token generated:", accessToken);
        console.log("refresh Token generated:", refreshToken);
        user.refreshToken =refreshToken
        user.save({validateBeforeSave : false})

   return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(400 ,"nottttttt")
    }

//    const accessToken = user.generateAccessToken()
//    console.log(accessToken,refreshToken)
//    const refreshToken = user.generateRefreshToken()
//    user.refreshToken =refreshToken
//    user.save({validateBeforeSave : false})

//    return {accessToken,refreshToken}
//   } catch (error) {
//     throw new ApiError(500 , "Somthing wrong")
//   }
}

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
    // console.log(username,email)
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

const loginUser = asyncHandler(async (req, res) =>{
   // console.log(req.body); // Log the request body to see what is coming in.
  // req body -> data
  // username or email
  //find the user
  //password check
  //access and referesh token
  //send cookie
  const {email, username, password} = req.body
 // console.log(email,username,password)
  if (!username && !email) {
      throw new ApiError(400, "username or email is required")
  }
  const user = await User.findOne({
      $or: [{username}, {email}]
  })
  if (!user) {
      throw new ApiError(404, "User does not exist")
  }
 const isPasswordValid = await user.isPasswordCorrect(password)
 if (!isPasswordValid) {
  throw new ApiError(401, "Invalid user credentials")
  }
  console.log("user id hai ye",user._id)
 const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
  const options = {
      httpOnly: true,
      secure: true
  }
  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
      new ApiResponce(
          200, 
          {
              user: loggedInUser, accessToken, refreshToken
          },
          "User logged In Successfully"
      )
  )
})
const logoutUser = asyncHandler(async(req, res) => {
  await User.findByIdAndUpdate(
      req.user._id,
      {
          $set: {
              refreshToken: undefined
          }
      },
      {
          new: true
      }
  )
  const options = {
      httpOnly: true,
      secure: true
  }
  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponce(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponce(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async (req,res)=> {
   const {oldPassword , newPassword} = req.body
   
   const user = await User.findById(req.user?._id)
 const isPasswordCorrect = await User.isPasswordCorrect(oldPassword)

 if (!isPasswordCorrect) {
    throw new ApiError(400,"Invalid ald Password")
 }

 user.password = new password
 await user.save({validateBeforeSave : false})
 return res
 .status(200)
 .json(new ApiResponce(200,"password change seccc"))
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponce(200,req.user,"curr user mil gyA"))
})

const updateAccountDetails = asyncHandler(async(req,res)=> {
    const {fullName,email} = req.body

    if (!fullName || !email) { 
        throw new ApiError(400,"all fiels are requierd")
    }
 const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
         $set : {
            fullName,
            email,

         }
        },
        {new : true}
    ).select("-password")
    return res
    .status(200)
    .json(new ApiResponce(200,"Acc details update seccc"))
})

const updateUserAvatar =asyncHandler(async(req,res)=> {
  const avatarLocalPath =  req.file?.path
  if (!avatarLocalPath) {
    throw new ApiError(400 ,"Avatar file missing")    
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  if (!avatar.url) {
    throw new ApiError(400 ,"Avatar url missing")
  }

 const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set : {
            avatar : avatar.url,


        }
    },
    {new : true}
  ).select("-password")
  return res
  .status(200)
  .json(
      new ApiResponce(200 , "Avatar update secc")
  )
})


const updateUserCoverImage =asyncHandler(async(req,res)=> {
    const coverImageLocalPath =  req.file?.path
    if (!coverImageLocalPath) {
      throw new ApiError(400 ,"coverImage file missing")    
    }
  
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage.url) {
      throw new ApiError(400 ,"coverImage url missing")
    }
  
  const user =  await User.findByIdAndUpdate(
      req.user?._id,
      {
          $set : {
            coverImage : coverImage.url,
  
  
          }
      },
      {new : true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponce(200 , "coverImage update secc")
    )
  })

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage
}