const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
  _id: String,
  username: String,
  h_password: String,
  contacts: [String],
});

mongoose.model("users", userSchema);
