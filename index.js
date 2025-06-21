// server.js (Cleaned & Updated)
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const twilio = require("twilio");

const app = express();
const PORT = process.env.PORT || 5000;

// Twilio Credentials (store these in .env for production)
const accountSid = "AC2386df8e3b1afeae7dad935f23b51ab0";
const authToken = "76b1d1984df91680aa99a778653fc462";
const twilioNumber = "+12178035187";
const client = twilio(accountSid, authToken);

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MySQL DB Connection
const db = mysql.createConnection({
  host: "sql8.freesqldatabase.com",
  user: "sql8785241",
  password: "TY4g55mxyW", // Your MySQL password
  database: "child_development",
  port: 3306,
});

db.connect((err) => {
  if (err) console.error("❌ Database connection error:", err);
  else console.log("✅ Connected to MySQL");
});

// In-memory store for OTP
const otpStore = {};

// ================= Routes =================

// Send OTP
app.post("/send-otp", async (req, res) => {
  const { mobileNumber } = req.body;
  if (!mobileNumber)
    return res
      .status(400)
      .json({ success: false, message: "Mobile number required" });

  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  console.log(`Generated OTP for ${mobileNumber}: ${otp}`);

  try {
    await client.messages.create({
      body: `Your OTP is: ${otp}`,
      from: twilioNumber,
      to: `+91${mobileNumber}`,
    });
    otpStore[mobileNumber] = otp;
    res.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("Twilio Error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to send OTP",
        error: error.message,
      });
  }
});

// Verify OTP
app.post("/verify-otp", (req, res) => {
  const { mobileNumber, otp } = req.body;
  if (!mobileNumber || !otp)
    return res
      .status(400)
      .json({ success: false, message: "Mobile number and OTP required" });

  if (otpStore[mobileNumber] === otp) {
    delete otpStore[mobileNumber];
    return res.json({ success: true, message: "OTP verified successfully" });
  }

  return res.status(400).json({ success: false, message: "Invalid OTP" });
});

// Store Mobile Number (If Not Exists)
app.post("/store-mobile", (req, res) => {
  const { mobileNumber } = req.body;
  if (!mobileNumber)
    return res
      .status(400)
      .json({ success: false, message: "Mobile number is required" });

  const checkQuery = `SELECT * FROM user_details WHERE mobile_number = ?`;
  db.query(checkQuery, [mobileNumber], (err, results) => {
    if (err)
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    if (results.length > 0)
      return res
        .status(200)
        .json({
          success: false,
          message: "Mobile already exists",
          userExists: true,
        });

    const insertQuery = `INSERT INTO user_details (mobile_number, status) VALUES (?, 'pending')`;
    db.query(insertQuery, [mobileNumber], (err2) => {
      if (err2)
        return res
          .status(500)
          .json({ success: false, message: "Insert error" });
      res
        .status(200)
        .json({ success: true, message: "Mobile number stored successfully" });
    });
  });
});

// Delete all pending users
app.delete("/delete-pending-users", (req, res) => {
  const deleteQuery = `DELETE FROM user_details WHERE LOWER(TRIM(status)) = 'pending'`;
  db.query(deleteQuery, (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    console.log(`🗑️ Deleted ${result.affectedRows} pending users`);
    res.status(200).json({ 
      success: true, 
      message: `Deleted ${result.affectedRows} pending users`,
      deletedCount: result.affectedRows
    });
  });
});

// Delete specific user if status is pending
app.delete("/delete-pending-user", (req, res) => {
  const { mobileNumber } = req.body;
  if (!mobileNumber) return res.status(400).json({ success: false, message: "Mobile number required" });

  const deleteQuery = `DELETE FROM user_details WHERE mobile_number = ? AND LOWER(TRIM(status)) = 'pending'`;
  db.query(deleteQuery, [mobileNumber], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "Database error" });
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "No pending user found" });
    res.status(200).json({ success: true, message: `User ${mobileNumber} deleted` });
  });
});

// Store user details
app.post("/store-user-details", (req, res) => {
  const {
    mobileNumber,
    fullName,
    gender,
    dob,
    verifiedProof,
    schoolId,
    aadharNumber,
    ageCategory,
  } = req.body;
  if (!mobileNumber)
    return res
      .status(400)
      .json({ success: false, message: "Mobile number is required" });

  const sql = `UPDATE user_details SET full_name = ?, gender = ?, dob = ?, verified_proof = ?, school_id = ?, aadhar_number = ?, age_category = ? WHERE mobile_number = ?`;
  const values = [
    fullName,
    gender,
    dob,
    verifiedProof,
    schoolId || null,
    aadharNumber || null,
    ageCategory,
    mobileNumber,
  ];

  db.query(sql, values, (err, result) => {
    if (err)
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    if (result.affectedRows === 0)
      return res
        .status(404)
        .json({ success: false, message: "Mobile number not found" });
    res.json({ success: true, message: "User details updated successfully" });
  });
});

// Set Security PIN
app.post("/set-security-pin", (req, res) => {
  const { mobileNumber, pin } = req.body;
  if (!mobileNumber || !pin)
    return res
      .status(400)
      .json({ success: false, message: "Mobile number and PIN required" });

  const sql = `UPDATE user_details SET security_pin = ?, status = 'completed' WHERE mobile_number = ?`;
  db.query(sql, [pin, mobileNumber], (err, result) => {
    if (err)
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    if (result.affectedRows === 0)
      return res
        .status(404)
        .json({ success: false, message: "Mobile number not found" });
    res.json({ success: true, message: "Security PIN saved" });
  });
});

// Verify Security PIN
app.post("/api/verify-pin", (req, res) => {
  const { mobileNumber, securityPIN } = req.body;
  if (!mobileNumber || !securityPIN)
    return res
      .status(400)
      .json({ success: false, message: "Mobile number and PIN required" });

  const query = "SELECT security_pin FROM user_details WHERE mobile_number = ?";
  db.query(query, [mobileNumber], (err, results) => {
    if (err)
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    if (results.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const storedPin = results[0].security_pin;
    if (securityPIN === storedPin)
      res.json({ success: true, message: "PIN verified" });
    else res.json({ success: false, message: "Incorrect PIN" });
  });
});

// Create questions table and populate with sample data
app.post("/api/setup-questions", (req, res) => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS questions (
      question_id INT AUTO_INCREMENT PRIMARY KEY,
      month VARCHAR(50) NOT NULL,
      question_text TEXT NOT NULL,
      option_a VARCHAR(255),
      option_b VARCHAR(255),
      option_c VARCHAR(255),
      option_d VARCHAR(255),
      correct_answer CHAR(1),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  db.query(createTableQuery, (err) => {
    if (err) {
      console.error("Error creating table:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to create table", 
        error: err.message 
      });
    }
    
    // Insert sample questions
    const sampleQuestions = [
      {
        month: 'Month 1',
        question_text: 'What is the most important factor in child development?',
        option_a: 'Nutrition',
        option_b: 'Play and interaction',
        option_c: 'Sleep',
        option_d: 'All of the above',
        correct_answer: 'D'
      },
      {
        month: 'Month 1',
        question_text: 'At what age do children typically start walking?',
        option_a: '8-10 months',
        option_b: '10-12 months',
        option_c: '12-15 months',
        option_d: '15-18 months',
        correct_answer: 'C'
      },
      {
        month: 'Month 2',
        question_text: 'Which activity helps develop fine motor skills?',
        option_a: 'Running',
        option_b: 'Drawing and coloring',
        option_c: 'Jumping',
        option_d: 'Swimming',
        correct_answer: 'B'
      },
      {
        month: 'Month 2',
        question_text: 'What is the recommended screen time for children under 2?',
        option_a: '1 hour per day',
        option_b: '2 hours per day',
        option_c: 'No screen time except video calls',
        option_d: 'Unlimited',
        correct_answer: 'C'
      }
    ];
    
    const insertQuery = `
      INSERT IGNORE INTO questions (month, question_text, option_a, option_b, option_c, option_d, correct_answer) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    let insertedCount = 0;
    sampleQuestions.forEach((question, index) => {
      db.query(insertQuery, [
        question.month,
        question.question_text,
        question.option_a,
        question.option_b,
        question.option_c,
        question.option_d,
        question.correct_answer
      ], (err2) => {
        if (err2) {
          console.error("Error inserting question:", err2);
        } else {
          insertedCount++;
        }
        
        // Send response after all questions are processed
        if (index === sampleQuestions.length - 1) {
          res.status(200).json({ 
            success: true, 
            message: `Questions table created successfully. Inserted ${insertedCount} sample questions.`
          });
        }
      });
    });
  });
});

// Get questions by month
app.get("/api/questions/:month", (req, res) => {
  const { month } = req.params;
  
  // Decode the month parameter in case it's URL encoded
  const decodedMonth = decodeURIComponent(month);
  
  console.log(`📝 Fetching questions for month: ${decodedMonth}`);
  
  // Query to get questions for the specified month
  const query = `SELECT * FROM questions WHERE month = ? ORDER BY question_id`;
  
  db.query(query, [decodedMonth], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Database error", 
        error: err.message 
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: `No questions found for month: ${decodedMonth}` 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      data: results,
      count: results.length,
      month: decodedMonth
    });
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
});
