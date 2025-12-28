const db = require("../config/db")
const bcrypt = require("bcrypt")
const { OAuth2Client } = require("google-auth-library")
const jwt = require("jsonwebtoken")

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
const crypto = require("crypto")

const nodemailer = require("nodemailer")

exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" })
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10)

    const sql =
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)"

    db.query(sql, [name, email, hashedPassword], (err, result) => {
      if (err) {
        return res.status(500).json({
          message: "User already exists"
        })
      }

      // 🔐 GENERATE JWT HERE (IMPORTANT)
      const token = jwt.sign(
        { id: result.insertId, email },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      )

      // ✅ SEND TOKEN IN RESPONSE
      return res.status(201).json({
        message: "User registered successfully",
        token
      })
    })
  } catch (err) {
    return res.status(500).json({ message: "Registration failed" })
  }
}



exports.loginUser = (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" })
  }

  const sql = "SELECT * FROM users WHERE email = ?"

  db.query(sql, [email], async (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error" })
    }

    if (results.length === 0) {
      return res.status(401).json({ message: "User not found" })
    }

    const user = results[0]

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    )

    res.status(200).json({
      message: "Login successful",
      token
    })
  })
}



exports.googleLogin = async (req, res) => {
  const { token } = req.body

  try {
    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    })

    const payload = ticket.getPayload()
    const email = payload.email
    const name = payload.name

    // Check if user exists
    const sql = "SELECT * FROM users WHERE email = ?"

    db.query(sql, [email], async (err, results) => {
      if (err) {
        return res.status(500).json({ message: "Database error" })
      }

      let userId

      if (results.length === 0) {
        // Create new user (Google users don't need password)
        const dummyPassword = await bcrypt.hash("google_login", 10)

        const insertSql =
          "INSERT INTO users (name, email, password) VALUES (?, ?, ?)"

        db.query(insertSql, [name, email, dummyPassword], (err, result) => {
          if (err) {
            return res.status(500).json({ message: "User creation failed" })
          }

          userId = result.insertId
          sendToken()
        })
      } else {
        userId = results[0].id
        sendToken()
      }

      function sendToken() {
        const jwtToken = jwt.sign(
          { id: userId, email },
          process.env.JWT_SECRET,
          { expiresIn: "1d" }
        )

        res.json({
          message: "Google login successful",
          token: jwtToken
        })
      }
    })
  } catch (err) {
    res.status(401).json({ message: "Google authentication failed" })
  }
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

exports.forgotPassword = async (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ message: "Email is required" })
  }

  // 1️⃣ FETCH USER FIRST (for resend check)
  const findSql =
    "SELECT otp_last_sent FROM users WHERE email = ?"

  db.query(findSql, [email], async (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Server error" })
    }

    if (results.length === 0) {
      return res.status(400).json({ message: "Email not found" })
    }

    const user = results[0]

    // 2️⃣ RESEND COOLDOWN CHECK
    if (user.otp_last_sent) {
      const diff =
        (Date.now() - new Date(user.otp_last_sent).getTime()) / 1000

      if (diff < 60) {
        return res.status(429).json({
          message: `Please wait ${Math.ceil(60 - diff)} seconds before resending OTP`
        })
      }
    }

    // 3️⃣ GENERATE OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const hashedOtp = await bcrypt.hash(otp, 10)
    const expiry = new Date(Date.now() + 10 * 60 * 1000) // 10 min

    // 4️⃣ UPDATE USER WITH OTP
    const updateSql = `
      UPDATE users
      SET reset_otp = ?, 
          reset_otp_expiry = ?, 
          otp_last_sent = NOW()
      WHERE email = ?
    `

    db.query(updateSql, [hashedOtp, expiry, email], async (err) => {
      if (err) {
        console.error("OTP UPDATE ERROR:", err)
        return res.status(500).json({ message: "Failed to generate OTP" })
      }

      // 5️⃣ SEND EMAIL
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: "Password Reset OTP",
          text: `Your OTP is ${otp}. It expires in 10 minutes.`
        })
      } catch (mailErr) {
        console.error("MAIL ERROR:", mailErr)
        return res.status(500).json({
          message: "Failed to send OTP email"
        })
      }

      // 6️⃣ SUCCESS RESPONSE
      return res.json({ message: "OTP sent to your email" })
    })
  })
}



exports.verifyOtpAndReset = async (req, res) => {
  const { email, otp, password } = req.body

  const sql =
    "SELECT reset_otp, reset_otp_expiry FROM users WHERE email = ?"

  db.query(sql, [email], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(400).json({ message: "Invalid request" })
    }

    const user = results[0]

    if (new Date() > user.reset_otp_expiry) {
      return res.status(400).json({ message: "OTP expired" })
    }

    const isMatch = await bcrypt.compare(otp, user.reset_otp)
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const updateSql =
      "UPDATE users SET password = ?, reset_otp = NULL, reset_otp_expiry = NULL WHERE email = ?"

    db.query(updateSql, [hashedPassword, email], () => {
      res.json({ message: "Password reset successful" })
    })
  })
}



// exports.resetPassword = async (req, res) => {
//   const { token } = req.params
//   const { password } = req.body

//   if (!password) {
//     return res.status(400).json({ message: "Password is required" })
//   }

//   const hashedPassword = await bcrypt.hash(password, 10)

//   const sql =
//     "UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE reset_token = ? AND reset_token_expiry > NOW()"

//   db.query(sql, [hashedPassword, token], (err, result) => {
//     if (err) {
//       return res.status(500).json({ message: "Server error" })
//     }

//     if (result.affectedRows === 0) {
//       return res.status(400).json({ message: "Invalid or expired token" })
//     }

//     res.json({ message: "Password reset successful" })
//   })
// }
