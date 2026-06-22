import { z } from "zod";

/**
 * Environment Variable Validation Schema
 * Validates all required and optional env vars on server startup.
 * Reference: .env.example
 */
const envSchema = z.object({
  // Server
  PORT: z.coerce.number().int().positive().default(5000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // MongoDB
  MONGO_URI: z
    .string({ required_error: "MONGO_URI is required" })
    .min(1, "MONGO_URI cannot be empty")
    .refine(
      (val) => val.startsWith("mongodb://") || val.startsWith("mongodb+srv://"),
      { message: "MONGO_URI must be a valid MongoDB connection string" }
    ),

  // Cloudinary
  CLOUD_NAME: z
    .string({ required_error: "CLOUD_NAME is required" })
    .min(1, "CLOUD_NAME cannot be empty"),
  CLOUD_API_KEY: z
    .string({ required_error: "CLOUD_API_KEY is required" })
    .min(1, "CLOUD_API_KEY cannot be empty"),
  CLOUD_API_SECRET: z
    .string({ required_error: "CLOUD_API_SECRET is required" })
    .min(1, "CLOUD_API_SECRET cannot be empty"),
  CLOUDINARY_UPLOAD_FOLDER: z
    .string({ required_error: "CLOUDINARY_UPLOAD_FOLDER is required" })
    .min(1, "CLOUDINARY_UPLOAD_FOLDER cannot be empty"),

  // JWT
  JWT_SECRET: z
    .string({ required_error: "JWT_SECRET is required" })
    .min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_TOKEN: z
    .string({ required_error: "JWT_TOKEN is required" })
    .min(32, "JWT_TOKEN must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  // Email Notifications (optional - validate format only if provided)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z
    .string()
    .email("SMTP_USER must be a valid email address")
    .optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z
    .string()
    .email("SMTP_FROM must be a valid email address")
    .optional(),

  // Share Links
  SHARE_BASE_URL: z
    .string({ required_error: "SHARE_BASE_URL is required" })
    .url("SHARE_BASE_URL must be a valid URL"),

  // Chunked / resumable uploads
  MAX_FILE_SIZE_BYTES: z.coerce
    .number()
    .int()
    .positive("MAX_FILE_SIZE_BYTES must be a positive integer")
    .default(5368709120),
  UPLOAD_CHUNK_SIZE_BYTES: z.coerce
    .number()
    .int()
    .positive("UPLOAD_CHUNK_SIZE_BYTES must be a positive integer")
    .default(5242880),
  UPLOAD_SESSION_TTL_HOURS: z.coerce
    .number()
    .positive("UPLOAD_SESSION_TTL_HOURS must be a positive number")
    .default(24),
  UPLOAD_TEMP_DIR: z
    .string({ required_error: "UPLOAD_TEMP_DIR is required" })
    .min(1, "UPLOAD_TEMP_DIR cannot be empty"),
});

/**
 * Validates process.env against the schema.
 * Exits the process with a clear error message if validation fails.
 * Call this at the very top of server.js, before any DB/service initialization.
 */
export default function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("\n❌ Invalid or missing environment variables:\n");

    result.error.errors.forEach((err) => {
      console.error(`   • ${err.path.join(".")}: ${err.message}`);
    });

    console.error(
      "\n👉 Please check your .env file against .env.example and fix the above.\n"
    );

    process.exit(1);
  }

  console.log("✅ Environment variables validated successfully.");
  return result.data;
}