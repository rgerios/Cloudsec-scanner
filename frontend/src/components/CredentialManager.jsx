import { useState } from 'react'

const initialForm = {
  name: '',
  account_id: '',
  role_name: '',
  description: ''
}

const CredentialManager = ({
  credentials,
  selectedCredentialId,
  onSelect,
  onCreate,
  onDelete,
  loading,
  creating,
  deletingId
}) => {
  const [form, setForm] = useState(initialForm)

  const handleSelect = (event) => {
    const value = event.target.value
    const id = value ? Number(value) : null
    const credential = credentials.find((cred) => cred.id === id) || null
    onSelect(credential)
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.name || !form.account_id || !form.role_name) {
      return
    }
    const payload = { ...form }
    const created = await onCreate(payload)
    if (created) {
      setForm(initialForm)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-200" htmlFor="credential-select">Credencial salva</label>
        <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center">
          <select
            id="credential-select"
            value={selectedCredentialId ?? ''}
            onChange={handleSelect}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none md:w-64"
          >
            <option value="">-- Selecionar --</option>
            {credentials.map((credential) => (
              <option key={credential.id} value={credential.id}>
                {credential.name} · {credential.account_id}
              </option>
            ))}
          </select>
          {selectedCredentialId && (
            <button
              type="button"
              onClick={async () => onDelete(selectedCredentialId)}
              disabled={Boolean(deletingId) && deletingId === selectedCredentialId}
              className="inline-flex items-center gap-2 rounded-lg border border-red-500/60 px-3 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:border-red-900 disabled:text-red-400"
            >
              Remover
            </button>
          )}
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
          >
            Limpar seleção
          </button>
        </div>
        {loading && <p className="mt-2 text-xs text-slate-500">Carregando credenciais...</p>}
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Cadastrar nova credencial</h3>
          {creating && <span className="text-xs text-slate-400">Salvando...</span>}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400" htmlFor="credential-name">Nome</label>
            <input
              id="credential-name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Prod-Account"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400" htmlFor="credential-account">Account ID</label>
            <input
              id="credential-account"
              name="account_id"
              type="text"
              value={form.account_id}
              onChange={handleChange}
              placeholder="123456789012"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400" htmlFor="credential-role">Role name</label>
            <input
              id="credential-role"
              name="role_name"
              type="text"
              value={form.role_name}
              onChange={handleChange}
              placeholder="CloudSecScannerRole"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400" htmlFor="credential-description">Descrição</label>
            <input
              id="credential-description"
              name="description"
              type="text"
              value={form.description}
              onChange={handleChange}
              placeholder="Ambiente de produção"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!form.name || !form.account_id || !form.role_name || creating}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-700/40 disabled:text-slate-400"
          >
            Salvar credencial
          </button>
        </div>
      </form>
    </div>
  )
}

export default CredentialManager
