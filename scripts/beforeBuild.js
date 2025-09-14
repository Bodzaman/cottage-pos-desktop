
const fs = require('fs');
const path = require('path');

console.log('🔧 Running pre-build tasks...');

// Ensure build directory exists
const buildDir = path.join(__dirname, '..', 'build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
  console.log('✅ Created build directory');
}

// Copy assets if they exist
const assetsDir = path.join(__dirname, '..', 'assets');
if (fs.existsSync(assetsDir)) {
  console.log('✅ Assets directory found');
} else {
  console.log('⚠️  No assets directory found');
}

console.log('✅ Pre-build tasks completed');
