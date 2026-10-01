const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI must be configured with a MongoDB Atlas connection string");
  }

  const authority = mongoUri.match(/^mongodb(?:\+srv)?:\/\/([^/?#]+)/i)?.[1];
  const hosts = authority?.slice(authority.lastIndexOf("@") + 1).split(",") ?? [];
  const isAtlasUri = hosts.length > 0 && hosts.every((host) =>
    host.replace(/:\d+$/, "").toLowerCase().endsWith(".mongodb.net")
  );

  if (!isAtlasUri) {
    throw new Error("MONGO_URI must use MongoDB Atlas hosts (*.mongodb.net)");
  }

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log(`Connected to MongoDB Atlas (${mongoose.connection.name})`);
  } catch (error) {
    throw new Error(`Could not connect to MongoDB Atlas: ${error.message}`);
  }
};

module.exports = connectDB;