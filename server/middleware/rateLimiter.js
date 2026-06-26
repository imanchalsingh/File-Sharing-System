import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redisClient, { redisAvailable } from "../config/redis.js";

// Optional Redis store configuration with fallback
const getStore = () => {
  // Only return RedisStore if redis is actually available
  // If undefined is passed to store, express-rate-limit defaults to MemoryStore
  return redisAvailable
    ? new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
      })
    : undefined;
};

// General API Rate Limiter
// Limit each IP to 100 requests per 15 minutes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  store: getStore(),
});

// Stricter Rate Limiter for Downloads / Public Access
// Limit each IP to 20 requests per 1 minute
export const downloadLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 download/access requests per minute
  message: {
    success: false,
    message: "Too many download requests. Please slow down and try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore(),
});

// Stricter Rate Limiter for Password Attempts
export const passwordAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 password attempts per 15 minutes
  message: {
    success: false,
    message: "Too many password attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter Rate Limiter for Password Attempts
export const passwordAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 password attempts per 15 minutes
  message: {
    success: false,
    message: "Too many password attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
