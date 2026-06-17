import User from "../models/UserSchema.js";
import bcrypt from "bcryptjs";

// Function to seed a demo user

const seedDemoUser = async () => {
  try {
    const existingUser = await User.findOne({
        email: "demo@secureshare.com",
        });

    if (existingUser) {
      console.log("Demo user already exists");
      return;
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash("demo123", salt);

    await User.create({
        username: "demo_user",
        email: "demo@secureshare.com",
        password: hashedPassword,
    });

    console.log("Demo user seeded successfully");
    } catch (error) {
    console.error("Error seeding demo user:", error.message);
    }
};

export default seedDemoUser;