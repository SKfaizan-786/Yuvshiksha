// Quick diagnostic script to check if all imports exist
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking mobile app structure...\n');

const filesToCheck = [
  'App.js',
  'TestApp.js',
  'src/contexts/AuthContext.js',
  'src/contexts/SocketContext.js',
  'src/contexts/NotificationContext.js',
  'src/navigation/RootNavigator.js',
  'src/navigation/AuthStack.js',
  'src/navigation/StudentStack.js',
  'src/navigation/TeacherStack.js',
  'src/config/api.js',
];

let allGood = true;

filesToCheck.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ MISSING: ${file}`);
    allGood = false;
  }
});

console.log(allGood ? '\n✅ All required files exist!' : '\n❌ Some files are missing!');
