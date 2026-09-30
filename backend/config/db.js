const mongoose = require("mongoose");

const connectDB = async () => {
  const localMongoUri = "mongodb://127.0.0.1:27017/ecommerce-admin";
  const mongoUri = process.env.MONGO_URI || localMongoUri;

  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected successfully");
  } catch (error) {
    if (mongoUri !== localMongoUri) {
      try {
        await mongoose.connect(localMongoUri);
        console.warn("MongoDB Atlas unavailable; connected to local MongoDB instead.");
        return;
      } catch (localError) {
        console.error("MongoDB connection failed:", localError.message);
      }
    } else {
      console.error("MongoDB connection failed:", error.message);
    }

    process.exit(1);
  }
};

module.exports = connectDB;