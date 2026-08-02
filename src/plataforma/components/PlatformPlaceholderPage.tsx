import { Link } from "react-router-dom"

interface Props {
  title: string
}

export default function PlatformPlaceholderPage({ title }: Props) {
  return (
    <div>
      <h1 className="text-industrial-950 mb-2 text-2xl font-extrabold">{title}</h1>
      <p className="text-slate-500">Em breve.</p>
      <Link
        to="/campo"
        className="inline-flex items-center justify-center rounded-lg bg-industrial-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-industrial-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-industrial-950"
      >
        Ir para o Campo
      </Link>
    </div>
  )
}
