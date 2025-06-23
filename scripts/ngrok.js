// scripts/dev.js
const { spawn } = require("child_process");

// Start ngrok using CLI
const ngrok = spawn("ngrok", ["http", "3000"], {
  stdio: "inherit",
  shell: true,
});

// Handle clean exit
const cleanup = () => {
  console.log("\n🧹 Cleaning up...");

  server.kill("SIGINT");
  ngrok.kill("SIGINT");

  process.exit();
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
