const mongoose = require('mongoose');
require('dotenv').config();

const testAPI = async () => {
  console.log('🧪 Starting API Tests...\n');
  
  try {
    // Test MongoDB connection
    console.log('1. Testing MongoDB connection...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/expense-splitter');
    console.log('✅ MongoDB connected successfully\n');
    
    // Test API endpoints (would require server to be running)
    console.log('2. API Endpoint Tests:');
    console.log('   - Start server with: npm run dev');
    console.log('   - Test with Postman collection');
    console.log('   - Or use curl commands:\n');
    
    console.log('   Health Check:');
    console.log('   curl http://localhost:3000/\n');
    
    console.log('   Add Expense:');
    console.log('   curl -X POST http://localhost:3000/expenses \\');
    console.log('        -H "Content-Type: application/json" \\');
    console.log('        -d \'{"amount": 100, "description": "Test", "paid_by": "John"}\'\n');
    
    console.log('   Get All Expenses:');
    console.log('   curl http://localhost:3000/expenses\n');
    
    console.log('✅ All tests configured. Start your server and run the endpoints!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run tests
testAPI();
