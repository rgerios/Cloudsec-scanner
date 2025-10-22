const Header = () => (
  <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur">
    <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
      <div>
        <h1 className="text-2xl font-semibold text-white">CloudSec Scanner</h1>
        <p className="text-sm text-slate-400">Avaliação de segurança contínua da sua conta AWS</p>
      </div>
      <span className="rounded-full border border-emerald-500/60 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">
        Beta
      </span>
    </div>
  </header>
)

export default Header
