const mongoose = require("mongoose");
const { Schema } = mongoose;

const letterSchema = new Schema({
  _id: String,
  title: String,
  date: Date,
  sender: String,
  receiver: String,
  content: String,
  isDraft: Boolean,
});

mongoose.model("letters", letterSchema);
