import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

export default function Dashboard() {
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      navigate("/login")
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-3xl font-bold">
        Welcome to Accident Road Safety Dashboard 🚦
      </h1>

      <button
  onClick={() => {
    localStorage.removeItem("token")
    navigate("/login")
  }}
  className="mt-6 px-6 py-2 bg-red-500 text-white rounded"
>
  Logout
</button>

    </div>

    
  )
}
