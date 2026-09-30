const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

const connectDB = require("./config/db");
const User = require("./config/models/User");

dotenv.config();

const createUser = async () => {
  try {
    await connectDB();

    const email = "user@example.com";
    const password = "User12345";

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log("User already exists");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name: "Test User",
      email,
      password: hashedPassword
    });

    console.log("User created successfully");

    process.exit();

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

createUser();