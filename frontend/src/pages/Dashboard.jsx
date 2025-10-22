import { useMemo, useState } from 'react'
import axios from 'axios'
import Header from '../components/Header'
import ScanButton from '../components/ScanButton'
import SecurityScore from '../components/SecurityScore'
import ResultsTable from '../components/ResultsTable'
import ExportButton from '../components/ExportButton'

const getApiUrl = () => {
  const explicit = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL
  if (explicit) {
    return explicit.replace(/\/$/, '')
  }

  if (typeof window !== 'undefined' && window.__CLOUDSEC_API_URL__) {
    return window.__CLOUDSEC_API_URL__.replace(/\/$/, '')
  }

  if (import.meta.env.REACT_APP_API_URL) {
    return import.meta.env.REACT_APP_API_URL.replace(/\/$/, '')
  }

  return 'http://localhost:8000'
}

const Dashboard = () => {
  const [accountId, setAccountId] = useState('')
  const [roleName, setRoleName] = useState('')
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState({ findings: [], score: 100, severity_breakdown: { High: 0, Medium: 0, Low: 0 } })

  const apiBaseUrl = useMemo(() => getApiUrl(), [])

  const handleScan = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await axios.post(`${apiBaseUrl}/scan`, {
        account_id: accountId,
        role_name: roleName
      })
      setResults(response.data)
    } catch (err) {
      console.error(err)
      setError('Não foi possível executar o scan. Verifique as credenciais e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    setError('')
    try {
      const response = await axios.get(`${apiBaseUrl}/export`, {
        responseType: 'blob'
      })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.setAttribute('download', 'cloudsec_report.pdf')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      console.error(err)
      setError('Não foi possível exportar o relatório. Execute um novo scan e tente novamente.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
        <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-200" htmlFor="account-id">Account ID</label>
            <input
              id="account-id"
              type="text"
              placeholder="123456789012"
              value={accountId}
              onChange={(event) => setAccountId(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-200" htmlFor="role-name">Role name</label>
            <input
              id="role-name"
              type="text"
              placeholder="CloudSecScannerRole"
              value={roleName}
              onChange={(event) => setRoleName(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="flex items-end gap-3">
            <ScanButton onClick={handleScan} loading={loading} />
            <ExportButton onClick={handleExport} disabled={!results.findings.length || exporting} />
          </div>
          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200 md:col-span-2">
              {error}
            </div>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-[350px_minmax(0,1fr)]">
          <SecurityScore score={results.score} breakdown={results.severity_breakdown || { High: 0, Medium: 0, Low: 0 }} />
          <ResultsTable findings={results.findings} />
        </section>
      </main>
    </div>
  )
}

export default Dashboard
