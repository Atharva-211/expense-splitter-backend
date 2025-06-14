# 💸 Expense Splitter Backend API

A backend system for splitting expenses among groups of people with automatic settlement calculations and optimizations.

---

## 🚀 Live Demo

**API Base URL:**  
https://expense-splitter-backend-production.up.railway.app

**Here’s the collection with test data:** 
👉 [Postman Gist]([https://gist.github.com/your-gist-link](https://gist.github.com/Atharva-211/b909d07bb48c1ffd960feaf2bfaaba58))

---

## 📋 Features

### Core Features (MUST HAVE)

✅ Expense Tracking: Add, view, edit, and delete expenses  
✅ Automatic Person Management: People are added automatically when mentioned  
✅ Settlement Calculations: Optimized settlement suggestions with minimal transactions  
✅ Data Validation: Comprehensive input validation and error handling  
✅ Multiple Split Types: Equal split, percentage-based, and exact amount splits  

### Bonus Features (OPTIONAL)

✅ Expense Categories: Food, Travel, Utilities, Entertainment, Other  
✅ Enhanced Error Handling: Detailed error messages and proper HTTP status codes  
✅ Settlement Optimization: Minimizes the number of transactions needed  

---

## 🛠 Tech Stack

- **Backend**: Node.js with Express.js  
- **Database**: MongoDB with Mongoose ODM  
- **Deployment**: Railway.app  
- **Database Hosting**: MongoDB Atlas  

---

## 📚 API Documentation

### Base Response Format

```json
{
  "success": true,
  "data": {...},
  "message": "Descriptive message"
}
```

### 📂 Endpoints

#### Expense Management

- **GET /expenses** – Returns all expenses sorted by newest first  
- **POST /expenses** – Creates a new expense  
  - Required: `amount`, `description`, `paid_by`  
  - Optional: `split_type`, `split_details`, `category`
- **PUT /expenses/:id** – Updates an expense by ID  
- **DELETE /expenses/:id** – Deletes an expense by ID  

#### Settlement & People

- **GET /people** – Returns all people mentioned in expenses  
- **GET /balances** – Shows how much each person owes or is owed  
- **GET /settlements** – Shows optimized settlement suggestions  

---

## 🧠 Settlement Calculation Logic

1. **Balance Calculation**  
   Total paid - Fair share = Net balance

2. **Creditor/Debtor Separation**  
   Split people into those who are owed and those who owe

3. **Settlement Optimization**  
   Use greedy matching to minimize number of payments needed

### Example

- Shantanu: Paid ₹1100, Owes ₹710 → Balance: +₹390  
- Sanket: Paid ₹730, Owes ₹710 → Balance: +₹20  
- Om: Paid ₹300, Owes ₹710 → Balance: -₹410  

👉 Optimized Settlement:  
Om pays ₹390 to Shantanu and ₹20 to Sanket

---

## 🚀 Deployment Instructions

### 1. Deploy to Railway

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

- Connect your GitHub repo to Railway
- Railway will auto-deploy

### 2. Set Environment Variables

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/expense-splitter
PORT=3000
NODE_ENV=production
```

### 3. MongoDB Atlas Setup

- Create free MongoDB Atlas account
- Set up cluster and user
- Whitelist IP or allow access from anywhere
- Use connection string from "Connect your application"

---

## 🧪 Postman Collection

Test your API with a public Postman collection:  
👉 Include realistic test data like:

- Dinner (₹600, Shantanu)
- Groceries (₹450, Sanket)
- Petrol (₹300, Om) → Update to ₹350
- Movie (₹500, Shantanu)
- Pizza (₹280, Sanket) → Deleted

Also includes:
- Validation tests (negative amount, missing fields)
- Optimized settlement demo

---

## ✅ Submission Checklist

- [x] Working backend (Railway)
- [x] Connected to MongoDB Atlas
- [x] Postman collection (with test data)
- [x] README with API and logic
