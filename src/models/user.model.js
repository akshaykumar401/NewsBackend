import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const userSchima = new Schema(
  {
    username: {
      type: String,
      required: [true, "Username is Required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      index: true
    },
    avator: {
      type: String,
    },
    password: {
      type: String,
      require: [true, "Password is required"],
    },
    post: [
      {
        type: Schema.Types.ObjectId,
        ref: "post",
      }
    ],
    refreshToken: {
      type: String,
    }
  },
  { timestamps: true }
);

// Password Hashing Using Bcrypt.
userSchima.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  }
})

// Password Verification
userSchima.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
}

// JWT Token Generation
userSchima.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
  )
}
userSchima.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,

    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
  )
}

export const User = mongoose.model('User', userSchima);