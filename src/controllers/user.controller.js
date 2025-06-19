import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudnary } from "../utils/cloudnary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
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
  const avatorImage = await uploadOnCloudnary(avatorLocalPath);

  // Creating User Object
  const user = await User.create({
    fullName,
    email: email.toLowerCase(),
    password,
    username: username.toLowerCase(),
    avator: avatorImage?.url || "default.jpeg"
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
  const { email, password } = req.body;

  // Validating All Fields
  if (!email) {
    throw new ApiError(404, 'Email or UserName is Required')
  }

  // Cheaking is User exist
  const user = await User.findOne({
    $or: [
      { email }
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

// Referace Token Generation Method...
const generateReferanceToken = (async (req, res) => {
  // Retrive the refresh token from the cookie
  const incomingRefreshToken = req.cookies?.refreshToken;

  // Validating the refresh token
  if (!incomingRefreshToken) {
    return res
      .status(401)
      .json(
        new ApiResponse(
          401,
          {},
          "Refresh Token Not Found"
        )
      )
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // Finding User by ID
    const user = await User.findById(decodedToken?._id)

    // Validating the user...
    if (!user) {
      throw new ApiError(401, "Unauthorized Request");
    }

    // Validating the refresh token with the user
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired or Used")
    }

    const options = {
      httpOnly: true,
      secure: true,
    }

    const { accessToken, refreshToken } = await generrateToken(user._id)

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken: accessToken,
            refreshToken: refreshToken,
            user: user
          },
          "Access Token Refreshed"
        )
      )

  } catch (error) {
    // console.error("Error in generateReferanceToken:", error);
    return res
      .status(400)
      .json(
        new ApiResponse(
          400,
          {},
          `Error in generating refresh token: ${error.message}`
        )
      );
  }
});

// Logout Methode...
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

// Forgate Password Methode...
const forgotPassword = asyncHandler(async (req, res) => {
  const { email, username, newPassword } = req.body;

  // Validating is all Fields is Given
  if (!email && !username && !newPassword) {
    throw new ApiError(404, "All Fields are Required");
  }

  // Validating is user exist
  const user = await User.findOne({
    $and: [
      { email }, { username }
    ]
  })
  if (!user) {
    throw new ApiError(404, "User Not Found");
  }

  // changing Password
  user.password = newPassword
  await user.save({ validateBeforeSave: false })

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
  const user = await User.findById(req.user._id).populate("followers following").select("-password -refreshToken")

  // Cheaking is User Exist
  if (!user) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          [],
          "User Profile"
        )
      )
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

// Update user Detail Methode...
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

// Update User Profile Methode...
const updateUserProfile = asyncHandler(async (req, res) => {
  const avatorLocalPath = req.file?.path

  // Validating is avator is Present or Not
  if (!avatorLocalPath) {
    throw new ApiError(400, "Please Upload Avator")
  }
  const avator = await uploadOnCloudnary(avatorLocalPath)

  if (!avator) {
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

// Delete User Profile Methode...
const deleteUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findOneAndDelete(req.user._id).select("-refreshToken -password")
  if (!user) {
    throw new ApiError(404, "User Not Found")
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user,
        "User Profile Deleted"
      )
    )
})

// Follow and Folling User Methode...
const followAndFollingUser = asyncHandler(async (req, res) => {
  const { userId } = req.params
  const owner = req.user._id

  // Validating is User is Exist or not...
  const user = await User.findById(userId)
  if (!user)
    throw new ApiError(404, "User Not Found or Invalid UserId")

  // Validating is Owner is Exist or Not...
  const ownerUser = await User.findById(owner)
  if (!ownerUser)
    throw new ApiError(404, "User Not Found")

  ownerUser.following.push(userId)
  await ownerUser.save()
  user.followers.push(owner)
  await user.save()

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "User Followed"
      )
    )
})

// UnFollow User Methode...
const unFollowUser = asyncHandler(async (req, res) => {
  const { userId } = req.params
  const owner = req.user._id

  // Validating is User is Exist or not...
  const user = await User.findById(userId)
  if (!user)
    throw new ApiError(404, "User Not Found or Invalid UserId")

  // Validating is Owner is Exist or Not...
  const ownerUser = await User.findById(owner)
  if (!ownerUser)
    throw new ApiError(404, "User Not Found")

  // Validating is User is Following or Not...
  if (!ownerUser.following.includes(userId)) {
    throw new ApiError(404, "You are not following this user")
  }

  // Removing Following and Followers
  ownerUser.following.pull(userId)
  await ownerUser.save()
  user.followers.pull(owner)
  await user.save()

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "User UnFollowed"
      )
    )
})

// Displaying All Following user Methode...
const displayFollowingUser = asyncHandler(async (req, res) => {
  const id = req.user._id

  // Validating is User is Exist or not...
  const user = await User.findById(id)
  if (!user)
    throw new ApiError(404, "User Not Found or Invalid UserId")

  // Populating Following User
  const followingUsers = await User.find({ _id: { $in: user.following } })
    .select("-password -refreshToken")
    .populate("followers following")

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        followingUsers,
        "Following Users"
      )
    )

})

// Display Other User Profile Methode...
const displayOtherUserProfile = asyncHandler(async (req, res) => {
  const { username } = req.params

  // Validating is User is Exist or not...
  const user = await User.findOne({ username })

  if ( !user ) {
    throw new ApiError(404, "User Not Found or Invalid Username")
  }
  
  // Populating Followers and Following
  const userWithFollowersAndFollowing = await User.findById(user._id).select("-password -refreshToken").populate("followers following")

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        userWithFollowersAndFollowing,
        "User Profile"
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
  updateUserProfile,
  deleteUserProfile,
  generateReferanceToken,
  followAndFollingUser,
  displayFollowingUser,
  unFollowUser,
  displayOtherUserProfile
}
