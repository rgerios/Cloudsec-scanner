import { RadialBar, RadialBarChart, PolarAngleAxis, ResponsiveContainer } from 'recharts'

const SecurityScore = ({ score, breakdown }) => {
  const data = [
    {
      name: 'score',
      value: score,
      fill: score >= 80 ? '#4ade80' : score >= 50 ? '#fde047' : '#f87171'
    }
  ]

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Security Score</h2>
          <p className="text-sm text-slate-400">Resumo baseado na severidade dos findings.</p>
        </div>
        <div className="text-3xl font-bold text-white">{score}</div>
      </div>
      <div className="mt-6 h-48">
        <ResponsiveContainer>
          <RadialBarChart
            innerRadius="60%"
            outerRadius="100%"
            data={data}
            startAngle={180}
            endAngle={0}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              tick={false}
            />
            <RadialBar
              dataKey="value"
              background
              cornerRadius={30}
              clockWise
            />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <dt className="text-xs uppercase tracking-wide text-red-300">High</dt>
          <dd className="text-lg font-semibold text-white">{breakdown.High}</dd>
        </div>
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <dt className="text-xs uppercase tracking-wide text-amber-200">Medium</dt>
          <dd className="text-lg font-semibold text-white">{breakdown.Medium}</dd>
        </div>
        <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-3">
          <dt className="text-xs uppercase tracking-wide text-sky-200">Low</dt>
          <dd className="text-lg font-semibold text-white">{breakdown.Low}</dd>
        </div>
      </dl>
    </div>
  )
}

SecurityScore.defaultProps = {
  score: 100,
  breakdown: { High: 0, Medium: 0, Low: 0 }
}

export default SecurityScore
