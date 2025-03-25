import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudnary } from "../utils/cloudnary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generrateToken = async (id) => {
  try {
    const user = await User.findById(id)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    return { accessToken, refreshToken }
  } catch (error) {
    throw new ApiError(500, "SomeThing Went Wrong While Generating Access and Rreferesh Token");
  }
}

// Sigin Method...
const sigIn = asyncHandler(async (req, res) => {
  const { fullName, username, email, password } = req.body;

  // Validating the request
  if (!fullName && !username && !email && !password) {
    throw new ApiError(400, 'All Field are Required!')
  }

  // Cheaking for is Already Exist or Not
  const existingEmail = await User.findOne({ username })
  if (existingEmail) {
    throw new ApiError(401, 'Email is Already Exist')
  }
  const existingUsername = await User.findOne({ username })
  if (existingUsername) {
    throw new ApiError(401, 'Username is Already Exist')
  }

  // Avator Image
  let avatorLocalPath
  if (req.files && Array.isArray(req.files.avator) && req.files.avator.length > 0) {
    avatorLocalPath = req.files.avator[0].path;
  }

  // Uploading them to Cloudinary if avatorLocalPath exists.
  
  const coverImage = await uploadOnCloudnary(avatorLocalPath);

  // Creating User Object
  const user = await User.create({
    fullName,
    email: email.toLowerCase(),
    password,
    username: username.toLowerCase(),
    avator: coverImage?.url || "default.jpeg"
  })

  // Removing Password and Refresh Token field from response.
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if (!createdUser) {
    throw new ApiError(503, "SomeThing Went Wrong While Creating User")
  }

  // Returning API Response.
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        createdUser,
        "User Created Successfully"
      )
    )

})

// Login Method...
const login = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  // Validating All Fields
  if (!(email || username)) {
    throw new ApiError(404, 'Email or UserName is Required')
  }

  // Cheaking is User exist
  const user = await User.findOne({
    $or: [
      { username }, { email }
    ]
  })
  if (!user) {
    throw new ApiError(404, 'User Not Found!')
  }

  // Validating The password
  const isPasswordCorrectHere = await user.isPasswordCorrect(password)
  if (!isPasswordCorrectHere) {
    throw new ApiError(404, 'Invalid Password')
  }

  // Generating Access and Rreferace token
  const { accessToken, refreshToken } = await generrateToken(user._id)

  // Sending Cookies
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  // Securing From Frontend
  const option = {
    httpOnly: true,
    secure: true,
  }

  return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser, accessToken, refreshToken
        },
        "User Login Successfully"
      )
    )
})

// Logout
const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1
      }
    },
    {
      new: true
    }
  )

  // Securing From Frontend
  const option = {
    httpOnly: true,
    secure: true,
  }

  return res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(
      new ApiResponse(
        200,
        {},
        "User Logout Successfully"
      )
    )
})

// Forgate Password....
const forgotPassword = asyncHandler(async (req, res) => {
  const { email, username, newPassword } = req.body;

  // Validating is all Fields is Given
  if (!email && !username && !newPassword) {
    throw new ApiError(404, "All Fields are Required");
  }

  // Validating is user exist
  const user = await User.findOne({
    $and: [
      {email}, {username}
    ]
  })
  if (!user) {
    throw new ApiError(404, "User Not Found");
  }

  // changing Password
  user.password = newPassword
  await user.save({validateBeforeSave: false})

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Password Changed Successfully"
      )
    )
})

// Get user Profile
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password -refreshToken")

  // Cheaking is User Exist
  if (!user) {
    throw new ApiError(404, "User Not Found");
  }


  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user,
        "User Profile"
      )
    )
})

// Update user Detail
const updateUserDetail = asyncHandler(async (req, res) => {
  const { username, fullName } = req.body;

  // Validating User Input
  if (!username && !fullName) {
    throw new ApiError(400, "Please Provide Username and Full Name");
  }

  // Validating Username
  const isUsernameExist = await User.findOne({ username });
  if (isUsernameExist) {
    throw new ApiError(404, "Username Already Exist");
  }

  // Finding User and Update
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName: fullName,
        username: username.toLowerCase()
      }
    },
    {
      new: true
    }
  ).select("-password -refreshToken")

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user,
        "User Profile Updated"
      )
    )
})

// Update User Profile
const updateUserProfile = asyncHandler(async (req, res) => {
  const avatorLocalPath = req.file?.path

  // Validating is avator is Present or Not
  if(!avatorLocalPath) {
    throw new ApiError(400, "Please Upload Avator")
  }
  const avator = await uploadOnCloudnary(avatorLocalPath)
  
  if(!avator){
    throw new ApiError(401, "Avator Upload Failed")
  }

  const user = await User.findOneAndUpdate(
    req.user._id,
    {
      $set: {
        avator: avator.url
      }
    },
    {
      new: true
    }
  ).select("-password -refreshToken")

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user,
        "User Avator Updated"
      )
    )
})

export {
  sigIn,
  login,
  logout,
  forgotPassword,
  getUserProfile,
  updateUserDetail,
  updateUserProfile
}