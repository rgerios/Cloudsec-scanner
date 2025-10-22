import ResultsTable from './ResultsTable'

const HistoryPanel = ({
  history,
  onSelectScan,
  selectedScanId,
  loading,
  detail,
  detailLoading
}) => {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Histórico de scans</h3>
          {loading && <span className="text-xs text-slate-400">Carregando...</span>}
        </div>
        {history.length === 0 && !loading ? (
          <p className="mt-4 text-sm text-slate-400">Nenhum histórico disponível para esta credencial.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {history.map((scan) => (
              <li key={scan.id} className={`rounded-lg border px-4 py-3 transition ${selectedScanId === scan.id ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-slate-800 bg-slate-900/50 hover:border-slate-600'}`}>
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-200">Score {scan.score}</p>
                    <p className="text-xs text-slate-500">Executado em {new Date(scan.executed_at).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="rounded border border-red-500/40 bg-red-500/10 px-2 py-1 text-red-300">High: {scan.high_count}</span>
                    <span className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-amber-200">Medium: {scan.medium_count}</span>
                    <span className="rounded border border-sky-500/40 bg-sky-500/10 px-2 py-1 text-sky-200">Low: {scan.low_count}</span>
                    <button
                      type="button"
                      onClick={() => onSelectScan(scan.id)}
                      className="rounded border border-emerald-500/50 px-2 py-1 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/10"
                    >
                      Ver detalhes
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedScanId && detail && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Detalhes do scan #{selectedScanId}</h3>
            {detailLoading && <span className="text-xs text-slate-400">Carregando...</span>}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-4 text-sm">
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-center">
              <p className="text-xs uppercase tracking-wide text-red-200">High</p>
              <p className="text-lg font-semibold text-white">{detail.high_count}</p>
            </div>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-center">
              <p className="text-xs uppercase tracking-wide text-amber-200">Medium</p>
              <p className="text-lg font-semibold text-white">{detail.medium_count}</p>
            </div>
            <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-3 text-center">
              <p className="text-xs uppercase tracking-wide text-sky-200">Low</p>
              <p className="text-lg font-semibold text-white">{detail.low_count}</p>
            </div>
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-center">
              <p className="text-xs uppercase tracking-wide text-emerald-200">Score</p>
              <p className="text-lg font-semibold text-white">{detail.score}</p>
            </div>
          </div>
          <div className="mt-4">
            <ResultsTable findings={detail.findings || []} />
          </div>
        </div>
      )}
    </div>
  )
}

export default HistoryPanel
