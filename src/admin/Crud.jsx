import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react'
import { folderIdFrom, imageFrom, supabase } from './client'

export function Panel({ titulo, ajuda, acao, children }) {
  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold uppercase sm:text-3xl">{titulo}</h1>
          {ajuda && <p className="mt-1 max-w-xl text-sm text-ink/60">{ajuda}</p>}
        </div>
        {acao}
      </div>
      {children}
    </section>
  )
}

export function Toast({ msg }) {
  if (!msg) return null
  return <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-[fadeUp_.3s_ease-out] rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-xl">{msg}</div>
}

export function useToast() {
  const [msg, setMsg] = useState('')
  const show = (m) => {
    setMsg(m)
    setTimeout(() => setMsg(''), 2500)
  }
  return [msg, show]
}

// datetime-local ⇄ ISO no fuso de Cuiabá (UTC-4, sem horário de verão)
const toLocal = (iso) => (iso ? new Date(new Date(iso).getTime() - 4 * 3600e3).toISOString().slice(0, 16) : '')
const fromLocal = (v) => (v ? `${v}:00-04:00` : null)

function Field({ c, value, onChange }) {
  const base = 'field'
  if (c.type === 'textarea') return <textarea rows={3} className={base} value={value ?? ''} onChange={(e) => onChange(e.target.value)} required={c.req} />
  if (c.type === 'select')
    return (
      <select className={base} value={value ?? c.def ?? ''} onChange={(e) => onChange(c.opts.some((o) => typeof o.value === 'number') ? Number(e.target.value) : e.target.value)} required={c.req}>
        {c.opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    )
  if (c.type === 'datetime-local') return <input type="datetime-local" className={base} value={toLocal(value)} onChange={(e) => onChange(fromLocal(e.target.value))} />
  return (
    <>
      <input type={c.type === 'time' ? 'time' : 'text'} className={base} value={value ?? ''} onChange={(e) => onChange(e.target.value)} required={c.req} />
      {c.type === 'image' && value && <img src={value} alt="" className="mt-2 h-28 rounded-xl object-cover" />}
    </>
  )
}

export default function Crud({ table, titulo, ajuda, campos, resumo }) {
  const [rows, setRows] = useState(null)
  const [edit, setEdit] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [toast, showToast] = useToast()

  const load = () =>
    supabase.from(table).select('*').order('ordem').then(({ data, error }) => {
      if (error) showToast('Erro ao carregar')
      setRows(data || [])
    })
  useEffect(() => { load() }, [table])

  const novo = () => setEdit(Object.fromEntries(campos.map((c) => [c.k, c.def ?? (c.type === 'datetime-local' ? null : '')])))

  async function salvar(e) {
    e.preventDefault()
    setSalvando(true)
    const row = { ...edit }
    for (const c of campos) {
      if (c.type === 'drive') row[c.k] = folderIdFrom(row[c.k])
      if (c.type === 'image') row[c.k] = imageFrom(row[c.k])
    }
    if (!row.id) row.ordem = (rows.at(-1)?.ordem ?? 0) + 1
    const { error } = await supabase.from(table).upsert(row)
    setSalvando(false)
    if (error) return showToast('Erro: ' + error.message)
    setEdit(null)
    showToast('Salvo! Já está no site.')
    load()
  }

  async function remover(r) {
    if (!confirm(`Remover “${r.nome || r.titulo}”?`)) return
    await supabase.from(table).delete().eq('id', r.id)
    showToast('Removido')
    load()
  }

  async function toggle(r) {
    await supabase.from(table).update({ ativo: !r.ativo }).eq('id', r.id)
    load()
  }

  async function mover(i, dir) {
    const a = rows[i], b = rows[i + dir]
    if (!b) return
    await Promise.all([
      supabase.from(table).update({ ordem: b.ordem }).eq('id', a.id),
      supabase.from(table).update({ ordem: a.ordem === b.ordem ? a.ordem + dir : a.ordem }).eq('id', b.id),
    ])
    load()
  }

  return (
    <Panel titulo={titulo} ajuda={ajuda} acao={<button onClick={novo} className="btn-red"><Plus size={18} /> Adicionar</button>}>
      {rows === null ? (
        <Loader2 className="animate-spin text-ink/40" />
      ) : (
        <ul className="space-y-2">
          {rows.length === 0 && <li className="rounded-2xl bg-white p-6 text-ink/50">Nada cadastrado ainda.</li>}
          {rows.map((r, i) => (
            <li key={r.id} className={`flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ${r.ativo ? '' : 'opacity-50'}`}>
              <div className="flex flex-col">
                <button onClick={() => mover(i, -1)} className="text-ink/30 hover:text-ink" aria-label="Subir"><ArrowUp size={16} /></button>
                <button onClick={() => mover(i, 1)} className="text-ink/30 hover:text-ink" aria-label="Descer"><ArrowDown size={16} /></button>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{r.nome || r.titulo}</p>
                <p className="truncate text-sm text-ink/55">{resumo?.(r)}</p>
              </div>
              <button onClick={() => toggle(r)} title={r.ativo ? 'Ocultar do site' : 'Mostrar no site'} className="grid h-10 w-10 place-items-center rounded-full hover:bg-mist">{r.ativo ? <Eye size={18} /> : <EyeOff size={18} />}</button>
              <button onClick={() => setEdit(r)} title="Editar" className="grid h-10 w-10 place-items-center rounded-full hover:bg-mist"><Pencil size={18} /></button>
              <button onClick={() => remover(r)} title="Remover" className="grid h-10 w-10 place-items-center rounded-full text-brand hover:bg-brand-soft"><Trash2 size={18} /></button>
            </li>
          ))}
        </ul>
      )}

      {edit && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-ink/60 backdrop-blur-sm sm:place-items-center sm:p-6" onClick={() => setEdit(null)}>
          <form onSubmit={salvar} onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl sm:p-8">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-xl font-extrabold uppercase">{edit.id ? 'Editar' : 'Adicionar'}</h2>
              <button type="button" onClick={() => setEdit(null)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-mist"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              {campos.map((c) => (
                <label key={c.k} className="block">
                  <span className="mb-1.5 block text-sm font-semibold">{c.label}</span>
                  <Field c={c} value={edit[c.k]} onChange={(v) => setEdit({ ...edit, [c.k]: v })} />
                </label>
              ))}
            </div>
            <button className="btn-red mt-6 w-full" disabled={salvando}>{salvando && <Loader2 size={18} className="animate-spin" />} Salvar</button>
          </form>
        </div>
      )}
      <Toast msg={toast} />
    </Panel>
  )
}
