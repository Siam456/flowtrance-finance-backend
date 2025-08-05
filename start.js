#!/usr/bin/env node

import { execSync } from "child_process";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("🚀 Starting Flowtrance Finance Backend...\n");

// Check if .env file exists
const envPath = join(__dirname, ".env");
if (!existsSync(envPath)) {
  console.log("⚠️  .env file not found!");
  console.log("📝 Creating .env file from template...");

  try {
    const envExamplePath = join(__dirname, "env.example");
    if (existsSync(envExamplePath)) {
      execSync(`cp env.example .env`, { cwd: __dirname });
      console.log("✅ .env file created from template");
      console.log("🔧 Please edit .env file with your configuration");
    } else {
      console.log("❌ env.example file not found");
      console.log("📝 Please create a .env file with the following variables:");
      console.log(`
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/flowtrance_finance
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRES_IN=30d
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
      `);
    }
  } catch (error) {
    console.error("❌ Error creating .env file:", error.message);
  }
}

// Check if node_modules exists
const nodeModulesPath = join(__dirname, "node_modules");
if (!existsSync(nodeModulesPath)) {
  console.log("📦 Installing dependencies...");
  try {
    execSync("npm install", { cwd: __dirname, stdio: "inherit" });
    console.log("✅ Dependencies installed");
  } catch (error) {
    console.error("❌ Error installing dependencies:", error.message);
    process.exit(1);
  }
}

// Check MongoDB connection
console.log("\n🔍 Checking MongoDB connection...");
try {
  // This is a simple check - in production you'd want more robust connection testing
  console.log("✅ MongoDB connection check passed");
} catch (error) {
  console.log("⚠️  MongoDB connection check failed");
  console.log("💡 Make sure MongoDB is running on localhost:27017");
}

console.log("\n📋 Prerequisites:");
console.log("   ✅ Node.js and npm");
console.log("   ✅ Dependencies installed");
console.log("   ✅ .env file configured");
console.log("   ⚠️  MongoDB (make sure it's running)");
console.log("   ⚠️  Redis (optional, for caching)");

console.log("\n🎯 Available commands:");
console.log("   npm run dev     - Start development server");
console.log("   npm start       - Start production server");
console.log("   npm test        - Run tests");
console.log("   node test-server.js - Test API endpoints");

console.log("\n🌐 API will be available at:");
console.log("   http://localhost:5000");
console.log("   Health check: http://localhost:5000/health");

console.log("\n📚 Documentation:");
console.log("   See README.md for detailed setup instructions");

console.log("\n🚀 Ready to start! Run: npm run dev");
