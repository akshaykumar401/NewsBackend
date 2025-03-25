import mongoose, { Schema } from "mongoose";

const postSchima = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
      required: true,
    },
    referanceImage: {
      type: String,
    },
    description: {
      type: String,
    }
  },
  {
    timestamps: true
  }
)

export const Post = mongoose.model('Post', postSchima);
