const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "robots.txt");

try {
  const stats = fs.statSync(filePath);
  if (stats.size === 0) {
    console.error("Error: robots.txt exists but is empty.");
    process.exit(1);
  }
  console.log("Success: robots.txt exists and is not empty.");
} catch (err) {
  if (err.code === "ENOENT") {
    console.error("Error: robots.txt does not exist.");
  } else {
    console.error(`Error: Could not read robots.txt - ${err.message}`);
  }
  process.exit(1);
}
