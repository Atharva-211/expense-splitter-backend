const mongoose = require('mongoose');
require('dotenv').config();

const setupDatabase = async () => {
  console.log('🚀 Setting up database...\n');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/expense-splitter');
    console.log('✅ Connected to MongoDB');
    
    // Define Expense schema (same as in server.js)
    const expenseSchema = new mongoose.Schema({
      amount: { type: Number, required: true, min: 0.01 },
      description: { type: String, required: true, trim: true },
      paid_by: { type: String, required: true, trim: true },
      split_type: { type: String, enum: ['equal', 'percentage', 'exact'], default: 'equal' },
      split_details: { type: Map, of: Number, default: new Map() },
      category: { type: String, enum: ['Food', 'Travel', 'Utilities', 'Entertainment', 'Other'], default: 'Other' },
      created_at: { type: Date, default: Date.now },
      updated_at: { type: Date, default: Date.now }
    });
    
    const Expense = mongoose.model('Expense', expenseSchema);
    
    // Clear existing data (optional)
    await Expense.deleteMany({});
    console.log('🧹 Cleared existing expenses');
    
    // Insert sample data
    const sampleExpenses = [
      {
        amount: 600,
        description: "Dinner at restaurant",
        paid_by: "Shantanu",
        category: "Food"
      },
      {
        amount: 450,
        description: "Weekly groceries",
        paid_by: "Sanket",
        category: "Food"
      },
      {
        amount: 300,
        description: "Petrol for trip",
        paid_by: "Om",
        category: "Travel"
      },
      {
        amount: 500,
        description: "Movie tickets for weekend",
        paid_by: "Shantanu",
        category: "Entertainment"
      }
    ];
    
    await Expense.insertMany(sampleExpenses);
    console.log('✅ Inserted sample expenses');
    
    // Verify data
    const count = await Expense.countDocuments();
    console.log(`📊 Total expenses in database: ${count}`);
    
    console.log('\n🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run setup
setupDatabase();