// server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/expense-splitter';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Expense Schema
const expenseSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Amount must be positive']
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: [1, 'Description cannot be empty']
  },
  paid_by: {
    type: String,
    required: true,
    trim: true,
    minlength: [1, 'Paid by cannot be empty']
  },
  split_type: {
    type: String,
    enum: ['equal', 'percentage', 'exact'],
    default: 'equal'
  },
  split_details: {
    type: Map,
    of: Number,
    default: new Map()
  },
  category: {
    type: String,
    enum: ['Food', 'Travel', 'Utilities', 'Entertainment', 'Other'],
    default: 'Other'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

const Expense = mongoose.model('Expense', expenseSchema);

// Utility Functions
class ExpenseCalculator {
  static calculateBalances(expenses) {
    const balances = new Map();
    
    expenses.forEach(expense => {
      const { amount, paid_by, split_type, split_details } = expense;
      
      // Initialize balance for payer if not exists
      if (!balances.has(paid_by)) {
        balances.set(paid_by, 0);
      }
      
      // Add the amount paid by the person
      balances.set(paid_by, balances.get(paid_by) + amount);
      
      // Calculate how much each person owes for this expense
      let splits;
      
      if (split_type === 'equal') {
        // Get all unique people involved in expenses
        const allPeople = this.getAllPeople(expenses);
        const splitAmount = amount / allPeople.length;
        splits = new Map();
        allPeople.forEach(person => {
          splits.set(person, splitAmount);
        });
      } else if (split_type === 'percentage') {
        splits = new Map();
        for (const [person, percentage] of split_details) {
          splits.set(person, (amount * percentage) / 100);
        }
      } else if (split_type === 'exact') {
        splits = split_details;
      }
      
      // Subtract what each person owes
      for (const [person, owedAmount] of splits) {
        if (!balances.has(person)) {
          balances.set(person, 0);
        }
        balances.set(person, balances.get(person) - owedAmount);
      }
    });
    
    return balances;
  }
  
  static getAllPeople(expenses) {
    const people = new Set();
    expenses.forEach(expense => {
      people.add(expense.paid_by);
      if (expense.split_details && expense.split_details.size > 0) {
        for (const person of expense.split_details.keys()) {
          people.add(person);
        }
      }
    });
    return Array.from(people);
  }
  
  static calculateSettlements(balances) {
    const settlements = [];
    const debtors = []; // People who owe money (negative balance)
    const creditors = []; // People who are owed money (positive balance)
    
    // Separate debtors and creditors
    for (const [person, balance] of balances) {
      const roundedBalance = Math.round(balance * 100) / 100; // Round to 2 decimal places
      if (roundedBalance > 0.01) {
        creditors.push({ person, amount: roundedBalance });
      } else if (roundedBalance < -0.01) {
        debtors.push({ person, amount: Math.abs(roundedBalance) });
      }
    }
    
    // Sort by amount (descending) for optimal settlement
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);
    
    // Calculate minimal settlements
    let i = 0, j = 0;
    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];
      
      const settleAmount = Math.min(creditor.amount, debtor.amount);
      
      if (settleAmount > 0.01) {
        settlements.push({
          from: debtor.person,
          to: creditor.person,
          amount: Math.round(settleAmount * 100) / 100
        });
      }
      
      creditor.amount -= settleAmount;
      debtor.amount -= settleAmount;
      
      if (creditor.amount < 0.01) i++;
      if (debtor.amount < 0.01) j++;
    }
    
    return settlements;
  }
}

// API Routes

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Expense Splitter API is running!',
    version: '1.0.0',
    endpoints: {
      expenses: '/expenses',
      settlements: '/settlements',
      balances: '/balances',
      people: '/people'
    }
  });
});

app.get('/test', (req, res) => {
  res.send("Test route working");
});


// Get all expenses
app.get('/expenses', async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ created_at: -1 });
    res.json({
      success: true,
      data: expenses,
      message: `Found ${expenses.length} expenses`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching expenses',
      error: error.message
    });
  }
});

// Add new expense
app.post('/expenses', async (req, res) => {
  try {
    const { amount, description, paid_by, split_type = 'equal', split_details = {}, category = 'Other' } = req.body;
    
    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number'
      });
    }
    
    if (!description || description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Description is required and cannot be empty'
      });
    }
    
    if (!paid_by || paid_by.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Paid by is required and cannot be empty'
      });
    }
    
    // Create expense
    const expense = new Expense({
      amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
      description: description.trim(),
      paid_by: paid_by.trim(),
      split_type,
      split_details: new Map(Object.entries(split_details)),
      category
    });
    
    await expense.save();
    
    res.status(201).json({
      success: true,
      data: expense,
      message: 'Expense added successfully'
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error adding expense',
        error: error.message
      });
    }
  }
});

// Update expense
app.put('/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body, updated_at: new Date() };
    
    // Validation for amount if provided
    if (updates.amount !== undefined && updates.amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number'
      });
    }
    
    // Round amount if provided
    if (updates.amount !== undefined) {
      updates.amount = Math.round(updates.amount * 100) / 100;
    }
    
    const expense = await Expense.findByIdAndUpdate(id, updates, { 
      new: true, 
      runValidators: true 
    });
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    res.json({
      success: true,
      data: expense,
      message: 'Expense updated successfully'
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    } else if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        message: 'Invalid expense ID format'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error updating expense',
        error: error.message
      });
    }
  }
});

// Delete expense
app.delete('/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findByIdAndDelete(id);
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    res.json({
      success: true,
      data: expense,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        message: 'Invalid expense ID format'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error deleting expense',
        error: error.message
      });
    }
  }
});

// Get all people
app.get('/people', async (req, res) => {
  try {
    const expenses = await Expense.find();
    const people = ExpenseCalculator.getAllPeople(expenses);
    
    res.json({
      success: true,
      data: people,
      message: `Found ${people.length} people`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching people',
      error: error.message
    });
  }
});

// Get balances
app.get('/balances', async (req, res) => {
  try {
    const expenses = await Expense.find();
    
    if (expenses.length === 0) {
      return res.json({
        success: true,
        data: {},
        message: 'No expenses found'
      });
    }
    
    const balances = ExpenseCalculator.calculateBalances(expenses);
    const balanceData = {};
    
    for (const [person, balance] of balances) {
      const roundedBalance = Math.round(balance * 100) / 100;
      balanceData[person] = {
        balance: roundedBalance,
        status: roundedBalance > 0.01 ? 'owed' : roundedBalance < -0.01 ? 'owes' : 'settled'
      };
    }
    
    res.json({
      success: true,
      data: balanceData,
      message: 'Balances calculated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error calculating balances',
      error: error.message
    });
  }
});

// Get settlements
app.get('/settlements', async (req, res) => {
  try {
    const expenses = await Expense.find();
    
    if (expenses.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No expenses found'
      });
    }
    
    const balances = ExpenseCalculator.calculateBalances(expenses);
    const settlements = ExpenseCalculator.calculateSettlements(balances);
    
    res.json({
      success: true,
      data: settlements,
      message: `${settlements.length} settlements needed`,
      summary: {
        total_settlements: settlements.length,
        total_amount: settlements.reduce((sum, s) => sum + s.amount, 0)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error calculating settlements',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Documentation: http://localhost:${PORT}/`);
});

module.exports = app;