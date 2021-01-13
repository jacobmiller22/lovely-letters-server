const mongoose = require("mongoose");
const { Schema } = mongoose;

const letterSchema = new Schema({
  _id: String,
  title: String,
  dateSent: Date,
  dateRead: Date,
  _sender: { type: Schema.Types.String, ref: "users" },
  _receiver: { type: Schema.Types.String, ref: "users" },
  content: String,
  isDraft: Boolean,
});

mongoose.model("letters", letterSchema);
