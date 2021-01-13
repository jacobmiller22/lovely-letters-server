const mongoose = require("mongoose");
const { Schema } = mongoose;
const ResetLinkSchema = require("./ResetLink");

const userSchema = new Schema({
  _id: String,
  username: String,
  h_password: String,
  contacts: [String],
  resetLink: ResetLinkSchema,
});

mongoose.model("users", userSchema);
