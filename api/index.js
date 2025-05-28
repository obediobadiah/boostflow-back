// This file is the entry point for Vercel serverless function
const app = require('../dist/index.js');

// Export the Express app as a serverless function
module.exports = app; 