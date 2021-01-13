const mongoose = require("mongoose");
const { Schema } = mongoose;

const resetLinkSchema = new Schema({
  from: String,
  to: String,
  subject: String,
  html: String,
});

module.exports = resetLinkSchema;
