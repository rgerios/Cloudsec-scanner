const ScanButton = ({ onClick, loading }) => {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-700/40 disabled:text-slate-400"
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
          Escaneando...
        </>
      ) : (
        <>Iniciar Scan</>
      )}
    </button>
  )
}

export default ScanButton
