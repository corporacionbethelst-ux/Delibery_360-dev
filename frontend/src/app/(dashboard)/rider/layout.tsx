"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"

// Layout específico para sección de repartidores con navegación especializada
export default function RiderLayout({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState("dashboard")
  const { user } = useAuth()

  // Definir pestañas de navegación para repartidores
  const tabs = [
    { id: "dashboard", name: "Dashboard", href: "/rider" },
    { id: "orders", name: "Mis Órdenes", href: "/rider/my-orders" },
    { id: "earnings", name: "Ganancias", href: "/rider/earnings" },
    { id: "productivity", name: "Productividad", href: "/rider/productivity" },
    { id: "profile", name: "Perfil", href: "/rider/profile" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header de navegación para repartidores */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-blue-900">Delivery360 Rider</h1>
              {user && (
                <span className="text-sm text-gray-600">
                  {user.name} • {user.email}
                </span>
              )}
            </div>
            
            {/* Navegación por pestañas */}
            <nav className="flex space-x-2">
              {tabs.map((tab) => (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-100 text-blue-900"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Contenido principal de la página */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  )
}
