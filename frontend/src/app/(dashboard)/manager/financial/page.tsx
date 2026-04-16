"use client"

import { useState, useEffect } from "react"
import { useFinancial } from "@/stores/financialStore"

// Página financiera para managers con resumen de ingresos, gastos y liquidaciones
export default function ManagerFinancialPage() {
  const { financialData, loadFinancialData } = useFinancial()
  const [period, setPeriod] = useState("current_month")
  const [loading, setLoading] = useState(true)

  // Cargar datos financieros al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      await loadFinancialData(period)
      setLoading(false)
    }
    fetchData()
  }, [period])

  // Calcular totales del período seleccionado
  const totals = {
    ingresos: financialData.reduce((sum, item) => sum + item.ingresos, 0),
    gastos: financialData.reduce((sum, item) => sum + item.gastos, 0),
    neto: financialData.reduce((sum, item) => sum + (item.ingresos - item.gastos), 0),
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando datos financieros...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header de la página */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestión Financiera</h1>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="border rounded-md px-3 py-2"
        >
          <option value="current_month">Este Mes</option>
          <option value="last_month">Mes Anterior</option>
          <option value="current_quarter">Este Trimestre</option>
          <option value="current_year">Este Año</option>
        </select>
      </div>

      {/* Tarjetas de resumen financiero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600">Ingresos Totales</p>
          <p className="text-3xl font-bold text-green-600">
            ${totals.ingresos.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600">Gastos Totales</p>
          <p className="text-3xl font-bold text-red-600">
            ${totals.gastos.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600">Balance Neto</p>
          <p className={`text-3xl font-bold ${totals.neto >= 0 ? "text-blue-600" : "text-orange-600"}`}>
            ${totals.neto.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Tabla de movimientos financieros */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Movimientos Financieros</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {financialData.map((item, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.fecha}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.concepto}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${item.tipo === 'ingreso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {item.tipo}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                  ${item.monto.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Botones de acción */}
      <div className="flex space-x-4">
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          Exportar Reporte
        </button>
        <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
          Nueva Liquidación
        </button>
      </div>
    </div>
  )
}
