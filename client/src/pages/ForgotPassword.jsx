import { useState } from "react"
import { useNavigate } from "react-router-dom"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch(
        "http://localhost:5000/api/auth/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message)
      }

      setMessage("OTP sent to your email")

      // redirect to reset page after short delay
      setTimeout(() => {
  navigate("/reset-password", {
    state: { email }
  })
}, 1500)

    } catch (err) {
      setMessage(err.message || "Failed to send OTP")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-80 border p-6 rounded"
      >
        <h2 className="text-2xl font-semibold mb-4">
          Forgot Password
        </h2>

        <input
          type="email"
          placeholder="Enter your registered email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-2 rounded mb-4"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-500 text-white py-2 rounded"
        >
          {loading ? "Sending OTP..." : "Send OTP"}
        </button>

        {message && (
          <p className="text-sm mt-4 text-center">{message}</p>
        )}
      </form>
    </div>
  )
}
