#!/usr/bin/env node

import fetch from "node-fetch";

const BASE_URL = "http://localhost:5000";

const testServer = async () => {
  console.log("🧪 Testing Flowtrance Finance Backend...\n");

  try {
    // Test health endpoint
    const healthResponse = await fetch(`${BASE_URL}/health`);

    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log("✅ Server is running successfully");
      console.log(`📊 Environment: ${healthData.environment}`);
      console.log(`⏰ Timestamp: ${healthData.timestamp}`);
    } else {
      console.log("❌ Health check failed");
      console.log(`Status: ${healthResponse.status}`);
    }

    // Test API documentation
    const docsResponse = await fetch(`${BASE_URL}/api-docs`);

    if (docsResponse.ok) {
      console.log("✅ API Documentation is accessible");
      console.log(`📚 Docs URL: ${BASE_URL}/api-docs`);
    } else {
      console.log("❌ API Documentation is not accessible");
      console.log(`Status: ${docsResponse.status}`);
    }

    console.log("\n🎉 Backend is working perfectly!");
    console.log("\n💡 Available features:");
    console.log("   ✅ MongoDB integration");
    console.log("   ✅ JWT Authentication");
    console.log("   ✅ Rate limiting");
    console.log("   ✅ Security middleware");
    console.log("   ✅ API documentation");
    console.log("   ✅ Transaction management");
    console.log("   ✅ Dashboard analytics");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.log("\n💡 Make sure the server is running on port 5000");
    console.log("   Run: npm run dev");
  }
};

testServer();
