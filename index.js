const express = require("express");
const keys = require("./config/keys");
const mongoose = require("mongoose");
require("./models/Letter");
require("./models/User");
const cors = require("cors");
mongoose.connect(keys.mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const app = express();
app.use(express.json());
app.use(cors());

const db = mongoose.connection;
db.on("error", console.error.bind(console, "\n\nMongoDB Connect Error\n\n"));

require("./routes/letterRoutes")(app);
require("./routes/authRoutes")(app);

const PORT = process.env.PORT || 5000;
app.listen(PORT);
