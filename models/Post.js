const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const PostSchema = new Schema(
  {
    title: String,
    summary: String,
    content: String,
    cover: String,
    author: { type: Schema.Types.ObjectId, ref: "employees" },
    authorname: { type: String },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    authorprofilepicture: { type: String },
    comments: [
      {
        author: { type: Schema.Types.ObjectId, ref: "employees" },
        authorname: { type: String },
        text: { type: String },
        date: { type: Date, default: Date.now() },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const PostModel = model("Post", PostSchema);

module.exports = PostModel;
