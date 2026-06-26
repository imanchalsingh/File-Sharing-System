import bcrypt from "bcryptjs";
import { updateProfile, updatePassword } from "./controllers/userController.js";
import User from "./models/UserSchema.js";
import * as redisModule from "./config/redis.js";

async function runTests() {
  console.log("Starting Mock Tests for Profile and Password Updates...");

  // Mock res
  const createRes = () => {
    const res = {};
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data) => {
      res.data = data;
      return res;
    };
    return res;
  };

  // Mock next
  const next = (err) => {
    throw err;
  };

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("password123", salt);

  const mockUsers = [
    { _id: "user1", username: "testuser1", email: "test1@example.com", password: hashedPassword },
    { _id: "user2", username: "testuser2", email: "test2@example.com", password: hashedPassword },
  ];

  // MOCK USER MODEL METHODS
  User.findOne = async (query) => {
    const normalizedEmail = query.$or[0].email;
    const username = query.$or[1].username;
    const neId = query._id.$ne;

    return mockUsers.find(u => 
      u._id !== neId && (u.email === normalizedEmail || u.username === username)
    );
  };

  User.findByIdAndUpdate = async (id, update, options) => {
    const userIndex = mockUsers.findIndex(u => u._id === id);
    if (userIndex === -1) return null;
    mockUsers[userIndex] = { ...mockUsers[userIndex], ...update };
    return mockUsers[userIndex];
  };

  User.findById = async (id) => {
    const user = mockUsers.find(u => u._id === id);
    if (!user) return null;
    return {
      ...user,
      save: async function() {
        const index = mockUsers.findIndex(u => u._id === this._id);
        mockUsers[index] = this;
      }
    };
  };


  try {
    console.log("\\n--- Test 1: Update Profile Successfully ---");
    let req = { user: { id: "user1" }, body: { username: "updateduser1", email: "updated1@example.com" } };
    let res = createRes();
    await updateProfile(req, res, next);
    console.log("Status:", res.statusCode, res.data);
    if (!res.data.success || res.data.user.username !== "updateduser1") throw new Error("Test 1 Failed");

    console.log("\\n--- Test 2: Update Profile - Email already in use ---");
    req.body = { username: "updateduser1", email: "test2@example.com" };
    res = createRes();
    await updateProfile(req, res, next);
    console.log("Status:", res.statusCode, res.data);
    if (res.statusCode !== 400 || !res.data.error.includes("Email")) throw new Error("Test 2 Failed");

    console.log("\\n--- Test 3: Update Profile - Username already taken ---");
    req.body = { username: "testuser2", email: "updated1@example.com" };
    res = createRes();
    await updateProfile(req, res, next);
    console.log("Status:", res.statusCode, res.data);
    if (res.statusCode !== 400 || !res.data.error.includes("Username")) throw new Error("Test 3 Failed");

    console.log("\\n--- Test 4: Update Profile - Missing fields ---");
    req.body = { username: "updateduser1" }; // missing email
    res = createRes();
    await updateProfile(req, res, next);
    console.log("Status:", res.statusCode, res.data);
    if (res.statusCode !== 400) throw new Error("Test 4 Failed");

    console.log("\\n--- Test 5: Update Password Successfully ---");
    req = { user: { id: "user1" }, body: { currentPassword: "password123", newPassword: "newpassword123" } };
    res = createRes();
    await updatePassword(req, res, next);
    console.log("Status:", res.statusCode, res.data);
    if (!res.data.success) throw new Error("Test 5 Failed");

    console.log("\\n--- Test 6: Update Password - Incorrect Old Password ---");
    req.body = { currentPassword: "password123", newPassword: "newpassword1234" }; // current is now newpassword123
    res = createRes();
    await updatePassword(req, res, next);
    console.log("Status:", res.statusCode, res.data);
    if (res.statusCode !== 401) throw new Error("Test 6 Failed");

    console.log("\\n--- Test 7: Update Password - New password too short ---");
    req.body = { currentPassword: "newpassword123", newPassword: "short" };
    res = createRes();
    await updatePassword(req, res, next);
    console.log("Status:", res.statusCode, res.data);
    if (res.statusCode !== 400) throw new Error("Test 7 Failed");

    console.log("\\nAll tests passed successfully!");
  } catch (error) {
    console.error("Test execution error:", error);
    process.exit(1);
  }
}

runTests();
