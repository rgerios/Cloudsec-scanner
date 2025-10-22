const severityStyles = {
  High: 'text-red-400 bg-red-500/10 border-red-500/30',
  Medium: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
  Low: 'text-sky-300 bg-sky-500/10 border-sky-500/30'
}

const ResultsTable = ({ findings }) => {
  if (!findings.length) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-center text-slate-400">
        Nenhum finding encontrado no último scan.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
      <table className="min-w-full divide-y divide-slate-800">
        <thead className="bg-slate-900/80 text-left text-slate-300">
          <tr>
            <th className="px-6 py-3 text-sm font-semibold uppercase tracking-wide">Categoria</th>
            <th className="px-6 py-3 text-sm font-semibold uppercase tracking-wide">Descrição</th>
            <th className="px-6 py-3 text-sm font-semibold uppercase tracking-wide">Severidade</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 text-sm text-slate-200">
          {findings.map((finding, index) => (
            <tr key={`${finding.category}-${index}`} className="hover:bg-slate-800/60">
              <td className="px-6 py-3 font-medium text-slate-100">{finding.category}</td>
              <td className="px-6 py-3 text-slate-300">{finding.description}</td>
              <td className="px-6 py-3">
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${severityStyles[finding.severity] || 'border-slate-700 text-slate-300'}`}>
                  {finding.severity}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

ResultsTable.defaultProps = {
  findings: []
}

export default ResultsTable
