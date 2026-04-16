"use client"

import { useState, useEffect } from "react"
import { useDeliveries } from "@/stores/deliveriesStore"

// Página de gestión de configuraciones para managers
export default function ManagerSettingsPage() {
  const [activeTab, setActiveTab] = useState("general")
  const [saving, setSaving] = useState(false)

  // Estado para configuración general
  const [settings, setSettings] = useState({
    companyName: "Delivery360",
    email: "contacto@delivery360.com",
    phone: "+1234567890",
    currency: "USD",
    timezone: "America/Bogota",
    maxDeliveryRadius: 10,
    autoAssignOrders: true,
  })

  // Manejar guardado de configuración
  const handleSave = async () => {
    setSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(false)
    alert("Configuración guardada exitosamente")
  }

  return (
    <div className="space-y-6">
      {/* Header de la página */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h1>
      </div>

      {/* Pestañas de configuración */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("general")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "general"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "notifications"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Notificaciones
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "payments"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Pagos
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "security"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Seguridad
          </button>
        </nav>
      </div>

      {/* Contenido de pestaña General */}
      {activeTab === "general" && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre de la Empresa</label>
            <input
              type="text"
              value={settings.companyName}
              onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email de Contacto</label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Teléfono</label>
            <input
              type="tel"
              value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Moneda</label>
            <select
              value={settings.currency}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="USD">USD - Dólar Americano</option>
              <option value="EUR">EUR - Euro</option>
              <option value="COP">COP - Peso Colombiano</option>
              <option value="MXN">MXN - Peso Mexicano</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Radio Máximo de Entrega (km)</label>
            <input
              type="number"
              value={settings.maxDeliveryRadius}
              onChange={(e) => setSettings({ ...settings, maxDeliveryRadius: parseInt(e.target.value) })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={settings.autoAssignOrders}
              onChange={(e) => setSettings({ ...settings, autoAssignOrders: e.target.checked })}
              className="h-4 w-4 text-blue-600"
            />
            <label className="ml-2 text-sm text-gray-700">Asignación Automática de Órdenes</label>
          </div>
        </div>
      )}

      {/* Contenido de otras pestañas (placeholder) */}
      {activeTab !== "general" && (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          <p>Configuración de {activeTab} en desarrollo</p>
        </div>
      )}

      {/* Botón de guardar */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {saving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </div>
  )
}
