import { Link, useNavigate } from "react-router-dom"
import { useState } from "react"
import { registerUser } from "../../services/api"
import { GoogleLogin } from "@react-oauth/google"

export default function Register() {

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")

  const [loading, setLoading] = useState(false)
const [message, setMessage] = useState("")
const navigate = useNavigate()
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))


const handleSubmit = async (e) => {
  e.preventDefault()

  setTimeout(() => {
  navigate("/dashboard", { replace: true })
}, 300)

  if (password !== confirmPassword) {
    setError("Passwords do not match")
    return
  }

  setError("")
  setMessage("")
  setLoading(true)

  try {
    const res = await registerUser({ name, email, password })

    if (res.token) {
      localStorage.setItem("token", res.token)

      // 🔥 minimum loading time (UX)
      await delay(1000)

      navigate("/dashboard")
    } else {
      setError(res.message || "Registration failed")
    }
  } catch (err) {
    setError(err.message || "Something went wrong")
  } finally {
    setLoading(false)
  }
}


  return (
    <div className="flex h-[700px] w-full">
      <div className="w-full hidden md:inline-block">
        <img
          className="h-full"
          src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/login/leftSideImage.png"
          alt="leftSideImage"
        />
      </div>

      <div className="w-full flex flex-col items-center justify-center">

        {/* ✅ onSubmit FIX IS HERE */}
        <form
          onSubmit={handleSubmit}
          className="md:w-96 w-80 flex flex-col items-center justify-center"
        >

          <h2 className="text-4xl text-gray-900 font-medium">Sign up</h2>
          <p className="text-sm text-gray-500/90 mt-3">
            Create your account to get started
            
          </p>

           {/* GOOGLE SIGN IN (UI ONLY – logic next) */}
          <GoogleLogin
  onSuccess={async (credentialResponse) => {
    const res = await fetch("http://localhost:5000/api/auth/google-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: credentialResponse.credential })
    })

    const data = await res.json()
    localStorage.setItem("token", data.token)
    navigate("/dashboard")
  }}
  onError={() => {
    setMessage("Google login failed")
  }}
/>
          <div className="flex items-center gap-4 w-full my-5">
            <div className="w-full h-px bg-gray-300/90"></div>
            <p className="w-full text-nowrap text-sm text-gray-500/90">
              or sign up with email
            </p>
            <div className="w-full h-px bg-gray-300/90"></div>
          </div>

          {/* Name */}
          <div className="flex items-center w-full border border-gray-300/60 h-12 rounded-full pl-6 gap-2">
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-transparent outline-none text-sm w-full h-full"
              required
            />
          </div>

          {/* Email */}
          <div className="flex items-center mt-6 w-full border border-gray-300/60 h-12 rounded-full pl-6 gap-2">
            <input
              type="email"
              placeholder="Email id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-transparent outline-none text-sm w-full h-full"
              required
              name="email"
  autoComplete="username"
            />
          </div>

          {/* Password */}
          <div className="flex items-center mt-6 w-full border border-gray-300/60 h-12 rounded-full pl-6 gap-2">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-transparent outline-none text-sm w-full h-full"
              required
              name="password"
  autoComplete="current-password"
            />
          </div>

          {/* Confirm Password */}
          <div className="flex items-center mt-6 w-full border border-gray-300/60 h-12 rounded-full pl-6 gap-2">
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-transparent outline-none text-sm w-full h-full"
              required
              name="confirmPassword"
  autoComplete="new-password"
            />
            
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-500 text-sm mt-4">{error}</p>
          )}

          <button
  type="submit"
  disabled={loading}
  className={`mt-8 w-full h-11 rounded-full text-white 
    ${loading ? "bg-gray-400" : "bg-indigo-500 hover:opacity-90"}`}
>
  {loading ? "Registering..." : "Register"}
</button>

{message && (
  <p className="text-green-600 text-sm mt-4">{message}</p>
)}


          <p className="text-gray-500/90 text-sm mt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-400 hover:underline">
              Sign in
            </Link>
          </p>

        </form>
      </div>
    </div>
  )
}
