import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="bg-industrial-50 min-h-screen">
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="flex flex-col items-center gap-4 py-32 text-center">
          <div>
            <p className="text-industrial-700 text-5xl font-bold">404</p>
            <p className="text-industrial-500 mt-1 text-lg font-semibold">Página não encontrada</p>
          </div>
          <Link
            to="/inicio"
            className="bg-industrial-950 hover:bg-industrial-800 focus-visible:outline-industrial-950 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Voltar ao início
          </Link>
        </div>
      </main>
    </div>
  )
}
