const ExportButton = ({ onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500"
  >
    Exportar PDF
  </button>
)

export default ExportButton
