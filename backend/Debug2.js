// Run: node debug2.js from your backend folder

console.log('Detailed check...\n');

const authRoute = require('./routes/auth');
const projectRoute = require('./routes/projects');
const taskRoute = require('./routes/tasks');
const userRoute = require('./routes/users');

console.log('routes/auth     typeof:', typeof authRoute, '| is function?', typeof authRoute === 'function');
console.log('routes/projects typeof:', typeof projectRoute, '| is function?', typeof projectRoute === 'function');
console.log('routes/tasks    typeof:', typeof taskRoute, '| is function?', typeof taskRoute === 'function');
console.log('routes/users    typeof:', typeof userRoute, '| is function?', typeof userRoute === 'function');

console.log('\nroutes/auth keys:', Object.keys(authRoute));
console.log('routes/auth value:', authRoute);

// Simulate what Express does
const express = require('express');
const app = express();

try {
  app.use('/api/auth', authRoute);
  console.log('\n✅ /api/auth registered OK');
} catch(e) {
  console.log('\n❌ /api/auth FAILED:', e.message);
}

try {
  app.use('/api/projects', projectRoute);
  console.log('✅ /api/projects registered OK');
} catch(e) {
  console.log('❌ /api/projects FAILED:', e.message);
}

try {
  app.use('/api/tasks', taskRoute);
  console.log('✅ /api/tasks registered OK');
} catch(e) {
  console.log('❌ /api/tasks FAILED:', e.message);
}

try {
  app.use('/api/users', userRoute);
  console.log('✅ /api/users registered OK');
} catch(e) {
  console.log('❌ /api/users FAILED:', e.message);
}