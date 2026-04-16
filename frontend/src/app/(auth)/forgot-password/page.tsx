"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"

// Página de recuperación de contraseña con formulario de validación
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  // Manejar envío del formulario de recuperación
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validar formato de email antes de enviar
    if (!email || !email.includes("@")) {
      setError("Por favor ingresa un email válido")
      return
    }

    try {
      // Simular envío de email de recuperación
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSubmitted(true)
    } catch (err) {
      setError("Error al enviar el email. Inténtalo nuevamente.")
    }
  }

  // Redirigir al login si ya está autenticado
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <h2 className="text-3xl font-bold text-green-600">¡Email enviado!</h2>
          <p className="text-gray-600">
            Hemos enviado un enlace de recuperación a <strong>{email}</strong>
          </p>
          <button
            onClick={() => router.push("/auth/login")}
            className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Volver al Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header de la página */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-900">Delivery360</h1>
          <h2 className="mt-6 text-2xl font-semibold text-gray-900">Recuperar Contraseña</h2>
          <p className="mt-2 text-sm text-gray-600">
            Ingresa tu email y te enviaremos instrucciones para restablecer tu contraseña
          </p>
        </div>

        {/* Formulario de recuperación */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="tu@email.com"
            />
          </div>

          {/* Mostrar error si existe */}
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Enviar Enlace de Recuperación
          </button>
        </form>

        {/* Enlace para volver al login */}
        <div className="text-center">
          <button
            onClick={() => router.push("/auth/login")}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            ← Volver al inicio de sesión
          </button>
        </div>
      </div>
    </div>
  )
}
