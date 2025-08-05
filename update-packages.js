#!/usr/bin/env node

import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";

console.log("🔄 Updating Flowtrance Finance Backend Packages...\n");

try {
  // Install updated packages
  console.log("📦 Installing updated packages...");
  execSync("npm install", { stdio: "inherit" });

  console.log("\n✅ Package updates completed successfully!");
  console.log("\n📋 Updated packages:");
  console.log("   • mongoose: 8.0.3 → 8.1.1");
  console.log("   • dotenv: 16.3.1 → 16.4.1");
  console.log("   • redis: 4.6.10 → 4.6.12");
  console.log("   • nodemon: 3.0.2 → 3.0.3");
  console.log("   • supertest: 6.3.3 → 6.3.4");

  console.log("\n🛡️  New security packages added:");
  console.log("   • express-validator: ^7.0.1 (Enhanced validation)");
  console.log("   • express-slow-down: ^2.0.1 (Rate limiting with delays)");
  console.log("   • hpp: ^0.2.3 (HTTP Parameter Pollution protection)");
  console.log(
    "   • express-mongo-sanitize: ^2.2.0 (NoSQL injection protection)"
  );
  console.log("   • xss-clean: ^0.1.4 (XSS attack prevention)");

  console.log("\n🔧 Security middleware has been added to server.js:");
  console.log("   • HPP protection");
  console.log("   • MongoDB query sanitization");
  console.log("   • XSS protection");

  console.log("\n🚀 You can now run the server with:");
  console.log("   npm run dev");

  console.log("\n📚 API Documentation available at:");
  console.log("   http://localhost:5000/api-docs");
} catch (error) {
  console.error("❌ Error updating packages:", error.message);
  process.exit(1);
}
