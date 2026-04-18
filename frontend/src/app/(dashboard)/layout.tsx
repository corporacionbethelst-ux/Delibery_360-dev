"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import Link from "next/link"

// Layout principal del dashboard con sidebar y header
export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { user, logout } = useAuth()
  const router = useRouter()

  // Manejar cierre de sesión
  const handleLogout = () => {
    logout()
    router.push("/auth/login")
  }

  // Navegación según rol del usuario
  const getMenuItems = () => {
    if (!user) return []
    
    switch (user.role) {
      case "gerente":
        return [
          { name: "Dashboard", href: "/manager" },
          { name: "Repartidores", href: "/manager/riders" },
          { name: "Órdenes", href: "/manager/orders" },
          { name: "Financiero", href: "/manager/financial" },
          { name: "Reportes", href: "/manager/reports" },
          { name: "Configuración", href: "/manager/settings" },
        ]
      case "operador":
        return [
          { name: "Dashboard", href: "/operator" },
          { name: "Mapa en Vivo", href: "/operator/live-map" },
          { name: "Entregas", href: "/operator/deliveries" },
          { name: "Órdenes", href: "/operator/orders" },
          { name: "Turnos", href: "/operator/shifts" },
          { name: "Alertas", href: "/operator/alerts" },
        ]
      case "repartidor":
        return [
          { name: "Dashboard", href: "/rider" },
          { name: "Mis Órdenes", href: "/rider/my-orders" },
          { name: "Ganancias", href: "/rider/earnings" },
          { name: "Productividad", href: "/rider/productivity" },
          { name: "Perfil", href: "/rider/profile" },
        ]
      default:
        return []
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-blue-900 text-white transition-all duration-300`}>
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold">Delivery360</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-blue-800 rounded">
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>
        
        <nav className="mt-4">
          {getMenuItems().map((item) => (
            <Link key={item.href} href={item.href} className="block px-4 py-2 hover:bg-blue-800">
              {sidebarOpen ? item.name : item.name.charAt(0)}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-blue-800">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center">
              {user?.name?.charAt(0) || "U"}
            </div>
            {sidebarOpen && (
              <div className="ml-3">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-blue-300">{user?.role}</p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button onClick={handleLogout} className="mt-2 text-sm text-red-300 hover:text-red-200">
              Cerrar Sesión
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow">
          <div className="px-6 py-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800">Dashboard</h2>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </span>
            </div>
          </div>
        </header>

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
