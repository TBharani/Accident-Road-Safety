import { Link, useNavigate } from "react-router-dom"
import { useState } from "react"
import { loginUser } from "../../services/api"
import { GoogleLogin } from "@react-oauth/google"


export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")


  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const res = await loginUser({ email, password })

      if (res.token) {
        localStorage.setItem("token", res.token)
        setMessage("Login successful")
        navigate("/dashboard", { replace: true })

      } else {
        setMessage(res.message || "Login failed")
      }
    } catch (err) {
      setMessage("Invalid email or password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-[700px] w-full">
      {/* LEFT IMAGE */}
      <div className="w-full hidden md:inline-block">
        <img
          className="h-full"
          src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/login/leftSideImage.png"
          alt="login"
        />
      </div>

      {/* RIGHT FORM */}
      <div className="w-full flex flex-col items-center justify-center">
        <form
          onSubmit={handleSubmit}
          className="md:w-96 w-80 flex flex-col items-center justify-center"
        >
          <h2 className="text-4xl text-gray-900 font-medium">Sign in</h2>
          <p className="text-sm text-gray-500/90 mt-3">
            Welcome back! Please sign in to continue
          </p><br></br>

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


          {/* DIVIDER */}
          <div className="flex items-center gap-4 w-full my-5">
            <div className="w-full h-px bg-gray-300/90"></div>
            <p className="w-full text-nowrap text-sm text-gray-500/90">or sign in with email</p>
            <div className="w-full h-px bg-gray-300/90"></div>
          </div>

          {/* EMAIL */}
          <div className="flex items-center w-full border border-gray-300/60 h-12 rounded-full pl-6">
            <input
              type="email"
              placeholder="Email id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-transparent outline-none text-sm w-full"
              required
              name="email"
              autoComplete="username"
            />
          </div>

          {/* PASSWORD */}
          <div className="flex items-center mt-6 w-full border border-gray-300/60 h-12 rounded-full pl-6">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-transparent outline-none text-sm w-full"
              required
              name="password"
              autoComplete="current-password"
            />
          </div>

          {/* REMEMBER + FORGOT */}
          <div className="w-full flex items-center justify-between mt-8 text-gray-500/80">
          

            <a className="text-sm underline" href="/forgot-password">
              Forgot password?
            </a>
          </div>

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className={`mt-8 w-full h-11 rounded-full text-white ${
              loading
                ? "bg-gray-400"
                : "bg-indigo-500 hover:opacity-90"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {/* MESSAGE */}
          {message && (
            <p className="text-green-600 text-sm mt-4">{message}</p>
          )}

          {/* REGISTER LINK */}
          <p className="text-gray-500/90 text-sm mt-4">
            Don’t have an account?{" "}
            <Link to="/register" className="text-indigo-400 hover:underline">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
