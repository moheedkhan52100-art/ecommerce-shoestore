const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

const connectDB = require("./config/db");
const Admin = require("./config/models/Admin");

dotenv.config();

const createAdmin = async () => {
  try {
    await connectDB();

    const email = "admin@example.com";
    const password = "Admin12345";

    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      console.log("Admin already exists");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    await Admin.create({
      name: "Administrator",
      email: email,
      password: hashedPassword
    });

    console.log("Admin created successfully");

    process.exit();

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

createAdmin();