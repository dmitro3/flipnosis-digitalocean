const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('🚀 Starting server with debug information...');

// List files in the current directory
echoDirectoryContents(__dirname);

// Start the server
exec('node server/server.js', (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Error starting server: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`❌ Server stderr: ${stderr}`);
    return;
  }
  console.log(`✅ Server stdout: ${stdout}`);
});

function echoDirectoryContents(dir) {
  console.log(`📂 Listing contents of directory: ${dir}`);
  fs.readdir(dir, (err, files) => {
    if (err) {
      console.error(`❌ Error reading directory: ${err.message}`);
      return;
    }
    files.forEach(file => {
      const filePath = path.join(dir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error(`❌ Error stating file: ${err.message}`);
          return;
        }
        console.log(`${stats.isDirectory() ? '📁' : '📄'} ${file}`);
      });
    });
  });
} 