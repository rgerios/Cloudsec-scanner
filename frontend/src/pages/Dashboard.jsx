import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import Header from '../components/Header'
import ScanButton from '../components/ScanButton'
import SecurityScore from '../components/SecurityScore'
import ResultsTable from '../components/ResultsTable'
import ExportButton from '../components/ExportButton'
import CredentialManager from '../components/CredentialManager'
import HistoryPanel from '../components/HistoryPanel'

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
  const [info, setInfo] = useState('')
  const [results, setResults] = useState({ findings: [], score: 100, severity_breakdown: { High: 0, Medium: 0, Low: 0 } })
  const [credentials, setCredentials] = useState([])
  const [selectedCredential, setSelectedCredential] = useState(null)
  const [credentialsLoading, setCredentialsLoading] = useState(false)
  const [creatingCredential, setCreatingCredential] = useState(false)
  const [deletingCredentialId, setDeletingCredentialId] = useState(null)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [selectedHistoryId, setSelectedHistoryId] = useState(null)
  const [historyDetail, setHistoryDetail] = useState(null)
  const [historyDetailLoading, setHistoryDetailLoading] = useState(false)

  const apiBaseUrl = useMemo(() => getApiUrl(), [])

  const fetchCredentials = useCallback(async () => {
    setCredentialsLoading(true)
    try {
      const response = await axios.get(`${apiBaseUrl}/credentials`)
      setCredentials(response.data)
      if (selectedCredential) {
        const updated = response.data.find((cred) => cred.id === selectedCredential.id) || null
        setSelectedCredential(updated)
        if (!updated) {
          setHistory([])
          setHistoryDetail(null)
          setSelectedHistoryId(null)
        }
      }
    } catch (err) {
      console.error(err)
      setError('Não foi possível carregar as credenciais salvas.')
    } finally {
      setCredentialsLoading(false)
    }
  }, [apiBaseUrl, selectedCredential?.id])

  useEffect(() => {
    fetchCredentials()
  }, [fetchCredentials])

  const fetchHistory = useCallback(
    async (credentialId) => {
      if (!credentialId) {
        return []
      }
      setHistoryLoading(true)
      setHistory([])
      setHistoryDetail(null)
      setSelectedHistoryId(null)
      try {
        const response = await axios.get(`${apiBaseUrl}/credentials/${credentialId}/history`)
        setHistory(response.data)
        return response.data
      } catch (err) {
        console.error(err)
        setError('Não foi possível carregar o histórico para esta credencial.')
        return []
      } finally {
        setHistoryLoading(false)
      }
    },
    [apiBaseUrl]
  )

  const handleCreateCredential = async (payload) => {
    setCreatingCredential(true)
    setError('')
    setInfo('')
    try {
      await axios.post(`${apiBaseUrl}/credentials`, payload)
      setInfo('Credencial salva com sucesso.')
      await fetchCredentials()
      return true
    } catch (err) {
      console.error(err)
      const message = err.response?.data?.detail || 'Não foi possível salvar a credencial.'
      setError(message)
      return false
    } finally {
      setCreatingCredential(false)
    }
  }

  const handleDeleteCredential = async (credentialId) => {
    if (!credentialId) return
    setDeletingCredentialId(credentialId)
    setError('')
    setInfo('')
    try {
      await axios.delete(`${apiBaseUrl}/credentials/${credentialId}`)
      if (selectedCredential?.id === credentialId) {
        setSelectedCredential(null)
        setAccountId('')
        setRoleName('')
        setHistory([])
        setHistoryDetail(null)
        setSelectedHistoryId(null)
      }
      await fetchCredentials()
      setInfo('Credencial removida.')
    } catch (err) {
      console.error(err)
      setError('Não foi possível remover a credencial.')
    } finally {
      setDeletingCredentialId(null)
    }
  }

  const handleSelectCredential = async (credential) => {
    setSelectedCredential(credential)
    setError('')
    setInfo('')
    if (credential) {
      setAccountId(credential.account_id)
      setRoleName(credential.role_name)
      const historyData = await fetchHistory(credential.id)
      if (historyData.length) {
        await handleSelectHistory(historyData[0].id)
      }
    } else {
      setAccountId('')
      setRoleName('')
      setHistory([])
      setHistoryDetail(null)
      setSelectedHistoryId(null)
    }
  }

  const handleSelectHistory = async (scanId) => {
    if (!scanId) return
    setSelectedHistoryId(scanId)
    setHistoryDetail(null)
    setHistoryDetailLoading(true)
    setError('')
    try {
      const response = await axios.get(`${apiBaseUrl}/history/${scanId}`)
      setHistoryDetail(response.data)
    } catch (err) {
      console.error(err)
      setError('Não foi possível carregar os detalhes do histórico selecionado.')
    } finally {
      setHistoryDetailLoading(false)
    }
  }

  const handleScan = async () => {
    setLoading(true)
    setError('')
    setInfo('')

    const payload = selectedCredential
      ? { credential_id: selectedCredential.id }
      : { account_id: accountId, role_name: roleName }

    if (!payload.credential_id && (!payload.account_id || !payload.role_name)) {
      setLoading(false)
      setError('Informe account ID e role name ou selecione uma credencial salva.')
      return
    }

    try {
      const response = await axios.post(`${apiBaseUrl}/scan`, payload)
      setResults(response.data)
      if (selectedCredential && response.data.scan_id) {
        await fetchHistory(selectedCredential.id)
        await handleSelectHistory(response.data.scan_id)
      }
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
    setInfo('')
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
        {(error || info) && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm">
            {error && <p className="text-red-300">{error}</p>}
            {info && <p className="text-emerald-300">{info}</p>}
          </div>
        )}

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <CredentialManager
            credentials={credentials}
            selectedCredentialId={selectedCredential?.id ?? null}
            onSelect={handleSelectCredential}
            onCreate={handleCreateCredential}
            onDelete={handleDeleteCredential}
            loading={credentialsLoading}
            creating={creatingCredential}
            deletingId={deletingCredentialId}
          />
        </section>

        <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-200" htmlFor="account-id">Account ID</label>
            <input
              id="account-id"
              type="text"
              placeholder="123456789012"
              value={accountId}
              onChange={(event) => setAccountId(event.target.value)}
              disabled={Boolean(selectedCredential)}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-900/40"
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
              disabled={Boolean(selectedCredential)}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-900/40"
            />
          </div>
          <div className="flex items-end gap-3">
            <ScanButton onClick={handleScan} loading={loading} />
            <ExportButton onClick={handleExport} disabled={!results.findings.length || exporting} />
          </div>
          {selectedCredential && (
            <p className="text-xs text-slate-400 md:col-span-2">
              Usando credencial salva: <span className="text-emerald-300">{selectedCredential.name}</span> ({selectedCredential.account_id} · {selectedCredential.role_name})
            </p>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-[350px_minmax(0,1fr)]">
          <SecurityScore score={results.score} breakdown={results.severity_breakdown || { High: 0, Medium: 0, Low: 0 }} />
          <ResultsTable findings={results.findings} />
        </section>

        {selectedCredential && (
          <HistoryPanel
            history={history}
            onSelectScan={handleSelectHistory}
            selectedScanId={selectedHistoryId}
            loading={historyLoading}
            detail={historyDetail}
            detailLoading={historyDetailLoading}
          />
        )}
      </main>
    </div>
  )
}

export default Dashboard
