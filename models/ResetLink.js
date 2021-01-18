const mongoose = require("mongoose");
const { Schema } = mongoose;

const resetLinkSchema = new Schema({
  from: String,
  to: String,
  subject: String,
  dateSent: Date,
  html: String,
  _user: { type: Schema.Types.String, ref: "users" },
});

module.exports = resetLinkSchema;
