const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const twilio = require("twilio");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: "sql8.freesqldatabase.com",
  user: "sql8785241",
  password: "TY4g55mxyW", // Your MySQL password
  database: "sql8785241",
  port: 3306,
});

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection error:", err);
  } else {
    console.log("✅ Connected to MySQL");
  }
});

// Twilio Configuration
const accountSid = "AC2386df8e3b1afeae7dad935f23b51ab0";
const authToken = "76b1d1984df91680aa99a778653fc462";
const twilioNumber = "+12178035187";
const client = twilio(accountSid, authToken);

// Temporary stores
const otpStore = {}; // { "mobileNumber": "1234" }
const registeredMobiles = new Set(); // [ "9876543210" ]

// ==================== AUTHENTICATION ROUTES ====================

// Send OTP
app.post("/send-otp", async (req, res) => {
  const { mobileNumber } = req.body;

  if (!mobileNumber) {
    return res
      .status(400)
      .json({ success: false, message: "Mobile number required" });
  }

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

  if (!mobileNumber || !otp) {
    return res
      .status(400)
      .json({ success: false, message: "Mobile number and OTP required" });
  }

  if (otpStore[mobileNumber] === otp) {
    delete otpStore[mobileNumber];
    return res.json({ success: true, message: "OTP verified successfully" });
  }

  return res.status(400).json({ success: false, message: "Invalid OTP" });
});

// Verify Security PIN
app.post("/api/verify-pin", (req, res) => {
  const { mobileNumber, securityPIN } = req.body;

  if (!mobileNumber || !securityPIN) {
    return res
      .status(400)
      .json({ success: false, message: "Mobile number and PIN required" });
  }

  const query = "SELECT security_pin FROM user_details WHERE mobile_number = ?";
  db.query(query, [mobileNumber], (err, results) => {
    if (err) {
      console.error("DB error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const storedPin = results[0].security_pin;
    if (securityPIN === storedPin) {
      return res.json({ success: true, message: "PIN verified" });
    } else {
      return res.json({ success: false, message: "Incorrect PIN" });
    }
  });
});

// ==================== USER MANAGEMENT ROUTES ====================

// Store Mobile Number
app.post("/store-mobile", (req, res) => {
  const { mobileNumber } = req.body;

  if (!mobileNumber) {
    return res
      .status(400)
      .json({ success: false, message: "Mobile number is required" });
  }

  const checkQuery = `SELECT * FROM user_details WHERE mobile_number = ?`;

  db.query(checkQuery, [mobileNumber], (err, results) => {
    if (err) {
      console.error("❌ Database check error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    if (results.length > 0) {
      return res.status(200).json({
        success: false,
        message: "Mobile number already exists. Please login.",
        userExists: true,
      });
    }

    const insertQuery = `INSERT INTO user_details (mobile_number, status) VALUES (?, 'pending')`;

    db.query(insertQuery, [mobileNumber], (insertErr) => {
      if (insertErr) {
        console.error("❌ Insert error:", insertErr);
        return res
          .status(500)
          .json({ success: false, message: "Insert error" });
      }

      return res.status(200).json({
        success: true,
        message: "Mobile number stored successfully",
      });
    });
  });
});

// Update User Details
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

  if (!mobileNumber) {
    return res
      .status(400)
      .json({ success: false, message: "Mobile number is required" });
  }

  const sql = `
    UPDATE user_details
    SET 
      full_name = ?, 
      gender = ?, 
      dob = ?, 
      verified_proof = ?, 
      school_id = ?, 
      aadhar_number = ?, 
      age_category = ?
    WHERE mobile_number = ?
  `;

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
    if (err) {
      console.error("❌ Update Error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Mobile number not found" });
    }

    res.json({ success: true, message: "User details updated successfully" });
  });
});

// Set Security PIN
app.post("/set-security-pin", (req, res) => {
  const { mobileNumber, pin } = req.body;

  if (!mobileNumber || !pin) {
    return res
      .status(400)
      .json({ success: false, message: "Mobile number and PIN are required" });
  }

  const sql = `UPDATE user_details SET security_pin = ?, status = 'completed' WHERE mobile_number = ?`;

  db.query(sql, [pin, mobileNumber], (err, result) => {
    if (err) {
      console.error("❌ PIN update error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Mobile number not found" });
    }

    res.json({
      success: true,
      message: "Security PIN saved successfully (plain text)",
    });
  });
});

// Get All Users
app.get("/api/all-users", (req, res) => {
  const query = "SELECT * FROM user_details ORDER BY id ASC";
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json(results);
  });
});

// Delete Pending Users
app.delete("/delete-pending-users", (req, res) => {
  const deleteQuery = `DELETE FROM user_details WHERE LOWER(TRIM(status)) = 'pending'`;

  db.query(deleteQuery, (deleteErr, deleteResult) => {
    if (deleteErr) {
      console.error("❌ Delete error:", deleteErr);
      return res
        .status(500)
        .json({
          success: false,
          message: "Database error while deleting pending users",
        });
    }

    console.log(`🗑️ Deleted ${deleteResult.affectedRows} pending users`);
    return res.status(200).json({
      success: true,
      message: `${deleteResult.affectedRows} pending users deleted successfully`,
    });
  });
});

// ==================== QUESTIONNAIRE ROUTES ====================

// Get Questions by Month
app.get("/api/questions/:month", (req, res) => {
  const month = req.params.month;
  db.query(
    "SELECT * FROM child_development WHERE month = ?",
    [month],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (rows.length === 0)
        return res.status(404).json({ error: "No questions found" });

      const row = rows[0];
      const domains = [
        "comprehension",
        "verbal_expression",
        "non_verbal_expression",
        "physical_development",
        "cognitive_development",
        "fine_motor_skills",
        "gross_motor_skills",
        "emotional_development",
        "swallowing_development",
        "social_development",
      ];

      const questions = domains
        .map((key) => ({ domain: key, question: row[key] }))
        .filter((q) => !!q.question);

      res.json({ month, questions });
    },
  );
});

// Filter Questions
app.get("/api/questions", (req, res) => {
  const { month } = req.query;
  let query = "SELECT * FROM child_development";
  const params = [];

  if (month) {
    query += " WHERE month = ?";
    params.push(month);
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("❌ Error fetching questions:", err);
      return res.status(500).json({ error: "Failed to fetch questions" });
    }
    res.json(results);
  });
});

// Update Question
app.put("/api/questions/:id", (req, res) => {
  const { id } = req.params;
  const { field, value } = req.body;

  if (!field || typeof value !== "string") {
    return res.status(400).json({ error: "Invalid field or value" });
  }

  const query = `UPDATE child_development SET ?? = ? WHERE id = ?`;
  const values = [field, value, id];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("❌ Update error:", err);
      return res.status(500).json({ error: "Failed to update question" });
    }
    res.json({ message: "✅ Question updated successfully" });
  });
});

// Show All Questions
app.get("/api/showquestions", (req, res) => {
  const query = `SELECT * FROM child_development`;
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching questions:", err);
      return res.status(500).json({ error: "Server error" });
    }
    res.json(results);
  });
});

// Submit Answers
app.post("/submit-answers", (req, res) => {
  const { username, mobileNumber, answers } = req.body;

  const query = `
    INSERT INTO user_domain_answers (
      username, mobileNumber,
      comprehension_q, comprehension_a,
      verbal_expression_q, verbal_expression_a,
      non_verbal_expression_q, non_verbal_expression_a,
      physical_development_q, physical_development_a,
      cognitive_development_q, cognitive_development_a,
      fine_motor_skills_q, fine_motor_skills_a,
      gross_motor_skills_q, gross_motor_skills_a,
      emotional_development_q, emotional_development_a,
      swallowing_development_q, swallowing_development_a,
      social_development_q, social_development_a
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    username,
    mobileNumber,
    answers.comprehension?.question || "",
    answers.comprehension?.answer || "",
    answers.verbal_expression?.question || "",
    answers.verbal_expression?.answer || "",
    answers.non_verbal_expression?.question || "",
    answers.non_verbal_expression?.answer || "",
    answers.physical_development?.question || "",
    answers.physical_development?.answer || "",
    answers.cognitive_development?.question || "",
    answers.cognitive_development?.answer || "",
    answers.fine_motor_skills?.question || "",
    answers.fine_motor_skills?.answer || "",
    answers.gross_motor_skills?.question || "",
    answers.gross_motor_skills?.answer || "",
    answers.emotional_development?.question || "",
    answers.emotional_development?.answer || "",
    answers.swallowing_development?.question || "",
    answers.swallowing_development?.answer || "",
    answers.social_development?.question || "",
    answers.social_development?.answer || "",
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Database insert failed:", err);
      return res.status(500).json({
        success: false,
        message: "Database insert failed.",
        error: err.sqlMessage || err.message,
      });
    }

    res.json({ success: true, message: "Answers submitted successfully" });
  });
});

// Get User Domain Answers
app.get("/api/user-domain-answers/:mobile", (req, res) => {
  const { mobile } = req.params;

  const query =
    "SELECT * FROM user_domain_answers WHERE mobileNumber = ? LIMIT 1";
  db.query(query, [mobile], (err, result) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (result.length === 0) {
      return res.status(404).json({ error: "No data found" });
    }
    res.json(result[0]);
  });
});

// ==================== ADMIN ROUTES ====================

// Admin Login
app.post("/api/admin-login", (req, res) => {
  const { email, password } = req.body;

  const query = "SELECT * FROM admin_users WHERE email = ? AND password = ?";

  db.query(query, [email, password], (err, results) => {
    if (err)
      return res.status(500).json({ success: false, message: "Server error" });

    if (results.length > 0) {
      res.status(200).json({ success: true });
    } else {
      res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }
  });
});

// Admin Change Password
app.post("/api/change-password", (req, res) => {
  const { email, oldPassword, newPassword } = req.body;

  if (!email || !oldPassword || !newPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const checkUserQuery = "SELECT * FROM admin_users WHERE email = ?";
  db.query(checkUserQuery, [email], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length === 0)
      return res.status(404).json({ message: "Admin not found" });

    const admin = results[0];
    if (admin.password !== oldPassword) {
      return res.status(401).json({ message: "Incorrect old password" });
    }

    const updateQuery = "UPDATE admin_users SET password = ? WHERE email = ?";
    db.query(updateQuery, [newPassword, email], (updateErr) => {
      if (updateErr) return res.status(500).json({ message: "Update failed" });
      res.json({ message: "Password changed successfully" });
    });
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
