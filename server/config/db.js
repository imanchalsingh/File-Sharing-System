const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/filesharingsystem");

mongoose.connection.on("connected", () => {
  console.log("MongoDB connection successful");
});

mongoose.connecttion.on("error", (err) => {
  console.log(`Error connnecting to MongoDB: ${err}`);
});

module.exports = mongoose;
