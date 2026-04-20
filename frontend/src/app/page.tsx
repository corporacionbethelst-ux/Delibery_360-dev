import Link from 'next/link'
import { ArrowRight, Truck, Users, BarChart3, Shield } from 'lucide-react'

// Página principal de landing para Delivery360
export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header con navegación */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Truck className="h-8 w-8 text-blue-500" />
            <span className="text-2xl font-bold text-white">Delivery360</span>
          </div>
          <div className="space-x-6">
            <Link href="/login" className="text-gray-300 hover:text-white transition">
              Iniciar Sesión
            </Link>
            <Link 
              href="/register" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
            >
              Registrarse
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Sistema Inteligente de Gestión de Entregas
          </h1>
          <p className="text-xl text-gray-300 mb-10">
            Optimiza tus operaciones logísticas, gestiona repartidores en tiempo real 
            y mejora la eficiencia de tu negocio de delivery con nuestra plataforma enterprise.
          </p>
          <div className="flex justify-center gap-4">
            <Link 
              href="/register" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition flex items-center"
            >
              Comenzar Gratis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link 
              href="#features" 
              className="border border-gray-600 hover:border-gray-400 text-gray-300 px-8 py-4 rounded-lg text-lg font-semibold transition"
            >
              Saber Más
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <section id="features" className="mt-32">
          <h2 className="text-3xl font-bold text-white text-center mb-16">
            Características Principales
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Truck className="h-10 w-10 text-blue-500" />}
              title="Gestión de Entregas"
              description="Control completo del ciclo de vida de cada entrega desde creación hasta finalización"
            />
            <FeatureCard
              icon={<Users className="h-10 w-10 text-green-500" />}
              title="Equipo de Repartidores"
              description="Administra, monitorea y optimiza el rendimiento de tu flota de repartidores"
            />
            <FeatureCard
              icon={<BarChart3 className="h-10 w-10 text-purple-500" />}
              title="Analíticas Avanzadas"
              description="Dashboards en tiempo real y reportes detallados para tomar mejores decisiones"
            />
            <FeatureCard
              icon={<Shield className="h-10 w-10 text-red-500" />}
              title="Seguridad Enterprise"
              description="Autenticación robusta, auditoría completa y protección de datos"
            />
          </div>
        </section>

        {/* Stats Section */}
        <section className="mt-32 bg-slate-800/50 rounded-2xl p-12">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <StatItem number="99.9%" label="Disponibilidad del Sistema" />
            <StatItem number="50K+" label="Entregas Gestionadas" />
            <StatItem number="24/7" label="Soporte Técnico" />
          </div>
        </section>

        {/* CTA Section */}
        <section className="mt-32 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            ¿Listo para optimizar tu operación?
          </h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Únete a cientos de empresas que ya confían en Delivery360 para gestionar sus entregas diarias.
          </p>
          <Link 
            href="/register" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-lg text-lg font-semibold transition inline-block"
          >
            Crear Cuenta Gratuita
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 mt-20 border-t border-slate-700">
        <div className="text-center text-gray-400">
          <p>&copy; 2024 Delivery360. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}

// Componente para mostrar características individuales
function FeatureCard({ icon, title, description }: { 
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="bg-slate-800/50 rounded-xl p-6 hover:bg-slate-800 transition border border-slate-700">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  )
}

// Componente para mostrar estadísticas
function StatItem({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <div className="text-4xl font-bold text-blue-500 mb-2">{number}</div>
      <div className="text-gray-400">{label}</div>
    </div>
  )
}
