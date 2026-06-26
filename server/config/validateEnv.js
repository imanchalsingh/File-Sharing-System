import dotenv from "dotenv";

dotenv.config();

/**
 * Simple environment variable validation without external dependencies
 * Checks only required variables for basic functionality
 */
export const validateEnv = () => {
  console.log("🔍 Checking required environment variables...");
  
  // Required variables for basic functionality
  const required = [
    'MONGO_URI', 
    'JWT_SECRET', 
    'JWT_TOKEN'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error("\n❌ Missing required environment variables:");
    missing.forEach(key => {
      console.log(`  - ${key} is required`);
    });
    console.log("\n👉 Please check your .env file and add the missing variables.\n");
    process.exit(1);
  }
  
  // Optional: Check JWT secret length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn("\n⚠️ Warning: JWT_SECRET should be at least 32 characters long for security.");
  }
  
  if (process.env.JWT_TOKEN && process.env.JWT_TOKEN.length < 32) {
    console.warn("⚠️ Warning: JWT_TOKEN should be at least 32 characters long for security.");
  }
  
  console.log("✅ All required environment variables are present");
  return true;
};

export default validateEnv;