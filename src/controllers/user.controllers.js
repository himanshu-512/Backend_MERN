import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOncloudinary} from "../utils/cloudunary.js"
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


   const{fullName,email,username,password} = req.body
   console.log(email)

   if (
      [fullName,email,username,password].some((field)=> field?.trim()==="")
   ) {
     throw new ApiError(400,"All are required");
     
   }

 const existeduser =   User.findOne({
    $or : [{username},{email}]
   })

   if (existeduser) {
    throw new ApiError(409,"alerady exist")
   }
  const avatarlocalpath = req.files?.avatar[0]?.path;
  const coverImagelocalpath = req.file?.coverImage[0].path;
if (!avatarlocalpath) {
   throw new ApiError(400,"Avatar")
}
 
const avatar = await uploadOncloudinary(avatarlocalpath)
const coverImage = await uploadOncloudinary(coverImagelocalpath)
if (!avatar) {
  throw new ApiError(400,"Avatar")
}

const user = await User.create({
  fullName,
  avatar : avatar.url,
  coverImage : coverImage?.url || "",
  email,
  password,
  username : username.toLowerCase()
})

const createduser =  await user.findById(user._id).select(
  "-password -refreshToken"
)
if(!createduser) {
  throw new ApiError(400 , "somthingo wrong")
}

return res.status(201).json(
  new ApiResponce(200,createduser,"Done")
)
})



export  {registerUser}