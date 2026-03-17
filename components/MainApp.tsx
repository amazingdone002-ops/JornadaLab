'use client'

import { useState, useEffect, useCallback } from 'react'
import type { AppData, Worker, Entry } from '@/lib/types'

// ─── helpers ─────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function fmtDate(iso: string) {
  const d = new Date(iso + 'T00:00:00Z')
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${days[d.getUTCDay()]} ${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

function fmtHours(h: number) {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  if (mm === 0) return `${hh}h`
  return `${hh}h ${mm}min`
}

function fmtEuro(n: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)
}

function hoursInputToDecimal(val: string): number | null {
  const s = val.trim().replace(',', '.')
  if (!s) return null
  const parts = s.split('.')
  if (parts.length === 2) {
    const h = parseInt(parts[0])
    const m = parseInt(parts[1])
    if (parts[1].length === 2 && m < 60) return h + m / 60
  }
  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

function decimalToDisplay(h: number) {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  if (mm === 0) return `${hh}`
  return `${hh}.${mm.toString().padStart(2, '0')}`
}

// ─── types ────────────────────────────────────────────────────────────────────

type Role = 'admin' | 'viewer'

type Modal =
  | { type: 'addEntry'; workerId: string }
  | { type: 'editEntry'; entry: Entry }
  | { type: 'addWorker' }
  | { type: 'editWorker'; worker: Worker }
  | { type: 'confirmDelete'; label: string; onConfirm: () => void }
  | null

// ─── root ─────────────────────────────────────────────────────────────────────

export default function MainApp() {
  const [role, setRole] = useState<Role | null | 'loading'>('loading')

  useEffect(() => {
    fetch('/api/auth')
      .then(r => r.json())
      .then(d => setRole(d.role ?? null))
  }, [])

  if (role === 'loading') return <FullScreenLoader />
  if (!role) return <LoginPage onLogin={setRole} />
  return <Dashboard role={role} onLogout={() => setRole(null)} />
}

// ─── login page ───────────────────────────────────────────────────────────────

function LoginPage({ onLogin }: { onLogin: (r: Role) => void }) {
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  async function submit() {
    if (!user.trim() || !pass) { setErr('Completa todos los campos'); return }
    setLoading(true)
    setErr('')
    try {
      const r = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.trim(), password: pass }),
      })
      const data = await r.json()
      if (r.ok) onLogin(data.role)
      else setErr(data.error ?? 'Usuario o contraseña incorrectos')
    } catch {
      setErr('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 52, height: 52,
            background: 'var(--text-1)',
            borderRadius: 16,
            margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="16" rx="2" stroke="white" strokeWidth="1.8"/>
              <path d="M3 9h18" stroke="white" strokeWidth="1.8"/>
              <path d="M8 2v4M16 2v4" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M7 13h4M7 16h6" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.03em' }}>
            Jornada Laboral
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--text-3)' }}>
            Control de horas y pagos
          </p>
        </div>

        <div style={{
          background: 'white',
          borderRadius: 20,
          border: '1.5px solid var(--border)',
          padding: '28px 24px 24px',
        }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600, color: 'var(--text-1)' }}>
            Iniciar sesión
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <Label>Usuario</Label>
              <input
                className="input"
                type="text"
                autoComplete="username"
                placeholder="Tu nombre de usuario"
                value={user}
                onChange={e => { setUser(e.target.value); setErr('') }}
                onKeyDown={e => e.key === 'Enter' && submit()}
              />
            </div>

            <div>
              <Label>Contraseña</Label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
                  value={pass}
                  style={{ paddingRight: 44 }}
                  onChange={e => { setPass(e.target.value); setErr('') }}
                  onKeyDown={e => e.key === 'Enter' && submit()}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-3)', display: 'flex', alignItems: 'center', padding: 0,
                  }}
                >
                  {showPass ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {err && (
              <div style={{
                background: 'var(--red-bg)', color: 'var(--red)',
                fontSize: 13, padding: '9px 12px', borderRadius: 8, fontWeight: 500,
              }}>
                {err}
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '13px', marginTop: 4, fontSize: 15 }}
              onClick={submit}
              disabled={loading}
            >
              {loading ? <LoadingSpinner small light /> : 'Entrar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── dashboard ────────────────────────────────────────────────────────────────

function Dashboard({ role, onLogout }: { role: Role; onLogout: () => void }) {
  const isAdmin = role === 'admin'
  const [data, setData] = useState<AppData | null>(null)
  const [openCard, setOpenCard] = useState<string | null>(null)
  const [modal, setModal] = useState<Modal>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(setData)
  }, [])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }, [])

  const save = useCallback(async (next: AppData) => {
    setData(next)
    setSaving(true)
    try {
      const r = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      })
      if (!r.ok) showToast('Error al guardar')
      else showToast('Guardado')
    } catch {
      showToast('Error de conexión')
    } finally {
      setSaving(false)
    }
  }, [showToast])

  async function logout() {
    await fetch('/api/auth', { method: 'DELETE' })
    onLogout()
  }

  function workerEntries(wid: string) {
    return (data?.entries ?? [])
      .filter(e => e.workerId === wid)
      .sort((a, b) => b.date.localeCompare(a.date))
  }
  function workerTotalHours(wid: string) {
    return workerEntries(wid).reduce((s, e) => s + e.hours, 0)
  }
  function workerTotalPay(wid: string) {
    const w = data?.workers.find(x => x.id === wid)
    return w ? workerTotalHours(wid) * w.rate : 0
  }
  function grandTotal() {
    return (data?.workers ?? []).reduce((s, w) => s + workerTotalPay(w.id), 0)
  }

  if (!data) return <FullScreenLoader />

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>

      <header style={{
        background: 'var(--text-1)',
        color: 'white',
        height: 56,
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em' }}>Jornada Laboral</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: -1 }}>
            {isAdmin ? 'Administrador' : 'Trabajador'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {saving && <LoadingSpinner small light />}
          <button
            className="btn"
            style={{ background: 'rgba(255,255,255,0.12)', color: 'white', padding: '7px 14px', fontSize: 13 }}
            onClick={logout}
          >
            Salir
          </button>
        </div>
      </header>

      <div style={{ background: 'white', borderBottom: '1px solid var(--border)', padding: '14px 16px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Total acumulado
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.03em', marginTop: 2 }}>
              {fmtEuro(grandTotal())}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>{data.workers.length} trabajadores</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>{data.entries.length} registros</div>
          </div>
        </div>
      </div>

      <main style={{ maxWidth: 600, margin: '0 auto', padding: '16px 12px 40px' }}>
        {data.workers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-3)' }}>
            No hay trabajadores registrados
          </div>
        )}

        {data.workers.map(worker => {
          const entries = workerEntries(worker.id)
          const totalH = workerTotalHours(worker.id)
          const totalPay = workerTotalPay(worker.id)
          const isOpen = openCard === worker.id

          return (
            <div key={worker.id} style={{
              background: 'white',
              borderRadius: 16,
              border: `1.5px solid ${isOpen ? 'var(--border-2)' : 'var(--border)'}`,
              marginBottom: 10,
              overflow: 'hidden',
              transition: 'border-color 0.2s',
            }}>
              <button
                onClick={() => setOpenCard(isOpen ? null : worker.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  padding: '14px 16px', background: 'none', border: 'none',
                  cursor: 'pointer', gap: 12, textAlign: 'left',
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: 'var(--accent-bg)', color: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 17, flexShrink: 0,
                }}>
                  {worker.name[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-1)', lineHeight: 1.2 }}>
                    {worker.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                    {worker.rate}€/h &middot; {entries.length} {entries.length === 1 ? 'día' : 'días'}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-1)' }}>{fmtEuro(totalPay)}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{fmtHours(totalH)}</div>
                </div>
                <svg
                  className={`chevron${isOpen ? ' open' : ''}`}
                  width="16" height="16" viewBox="0 0 16 16" fill="none"
                  style={{ flexShrink: 0, color: 'var(--text-3)' }}
                >
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              <div className={`accordion-body${isOpen ? ' open' : ''}`}>
                <div style={{ borderTop: '1px solid var(--border)' }}>
                  {entries.length === 0 ? (
                    <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 14 }}>
                      Sin registros de horas
                    </div>
                  ) : (
                    <>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: isAdmin ? '1fr 72px 84px 60px' : '1fr 72px 84px',
                        padding: '8px 16px', gap: 8,
                        background: 'var(--bg)', borderBottom: '1px solid var(--border)',
                      }}>
                        {['Fecha', 'Horas', 'Total', ...(isAdmin ? [''] : [])].map((h, i) => (
                          <div key={i} style={{
                            fontSize: 11, fontWeight: 600, color: 'var(--text-3)',
                            textTransform: 'uppercase', letterSpacing: '0.05em',
                            textAlign: i > 0 ? 'right' : 'left',
                          }}>{h}</div>
                        ))}
                      </div>
                      {entries.map((entry, idx) => (
                        <div key={entry.id} style={{
                          display: 'grid',
                          gridTemplateColumns: isAdmin ? '1fr 72px 84px 60px' : '1fr 72px 84px',
                          padding: '11px 16px', gap: 8, alignItems: 'center',
                          borderBottom: idx < entries.length - 1 ? '1px solid var(--border)' : 'none',
                          background: idx % 2 === 0 ? 'white' : 'var(--bg)',
                        }}>
                          <div style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: 500 }}>
                            {fmtDate(entry.date)}
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--text-2)', textAlign: 'right' }}>
                            {fmtHours(entry.hours)}
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', textAlign: 'right' }}>
                            {fmtEuro(entry.hours * worker.rate)}
                          </div>
                          {isAdmin && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                              <IconBtn title="Editar" onClick={() => setModal({ type: 'editEntry', entry })}>
                                <PencilIcon />
                              </IconBtn>
                              <IconBtn title="Eliminar" danger onClick={() => setModal({
                                type: 'confirmDelete',
                                label: `el registro del ${fmtDate(entry.date)}`,
                                onConfirm: () => save({ ...data, entries: data.entries.filter(e => e.id !== entry.id) })
                              })}>
                                <TrashIcon />
                              </IconBtn>
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  )}

                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 16px', background: 'var(--text-1)',
                  }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</span>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{fmtHours(totalH)}</span>
                    </div>
                    <span style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>{fmtEuro(totalPay)}</span>
                  </div>

                  {isAdmin && (
                    <div style={{ display: 'flex', gap: 8, padding: '12px 16px', background: 'white', borderTop: '1px solid var(--border)' }}>
                      <button className="btn btn-ghost" style={{ flex: 1, fontSize: 13, padding: '9px 12px' }}
                        onClick={() => setModal({ type: 'addEntry', workerId: worker.id })}>
                        + Añadir día
                      </button>
                      <button className="btn btn-ghost" style={{ fontSize: 13, padding: '9px 14px' }}
                        onClick={() => setModal({ type: 'editWorker', worker })}>
                        Editar
                      </button>
                      <button className="btn btn-danger" style={{ fontSize: 13, padding: '9px 14px' }}
                        onClick={() => setModal({
                          type: 'confirmDelete',
                          label: `a ${worker.name} y todos sus registros`,
                          onConfirm: () => {
                            save({
                              workers: data.workers.filter(w => w.id !== worker.id),
                              entries: data.entries.filter(e => e.workerId !== worker.id),
                            })
                            setOpenCard(null)
                          }
                        })}>
                        Borrar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {isAdmin && (
          <button
            className="btn"
            style={{ width: '100%', marginTop: 8, padding: 14, background: 'var(--text-1)', color: 'white', fontSize: 15, borderRadius: 16 }}
            onClick={() => setModal({ type: 'addWorker' })}
          >
            + Añadir trabajador
          </button>
        )}
      </main>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--text-1)', color: 'white',
          padding: '10px 20px', borderRadius: 999,
          fontSize: 13, fontWeight: 500, zIndex: 100,
          animation: 'fadeIn 0.2s ease', whiteSpace: 'nowrap',
        }}>
          {toast}
        </div>
      )}

      {modal && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div className="modal-sheet">
            {modal.type === 'addEntry' && (
              <AddEntryModal
                workerId={modal.workerId}
                worker={data.workers.find(w => w.id === modal.workerId)!}
                existingEntries={data.entries}
                onSave={entry => { save({ ...data, entries: [...data.entries, entry] }); setModal(null) }}
                onClose={() => setModal(null)}
              />
            )}
            {modal.type === 'editEntry' && (
              <EditEntryModal
                entry={modal.entry}
                worker={data.workers.find(w => w.id === modal.entry.workerId)!}
                onSave={updated => { save({ ...data, entries: data.entries.map(e => e.id === updated.id ? updated : e) }); setModal(null) }}
                onClose={() => setModal(null)}
              />
            )}
            {modal.type === 'addWorker' && (
              <WorkerFormModal
                onSave={worker => { save({ ...data, workers: [...data.workers, worker] }); setModal(null) }}
                onClose={() => setModal(null)}
              />
            )}
            {modal.type === 'editWorker' && (
              <WorkerFormModal
                existing={modal.worker}
                onSave={updated => { save({ ...data, workers: data.workers.map(w => w.id === updated.id ? updated : w) }); setModal(null) }}
                onClose={() => setModal(null)}
              />
            )}
            {modal.type === 'confirmDelete' && (
              <ConfirmModal
                label={modal.label}
                onConfirm={() => { modal.onConfirm(); setModal(null) }}
                onClose={() => setModal(null)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── modals ───────────────────────────────────────────────────────────────────

function AddEntryModal({ workerId, worker, existingEntries, onSave, onClose }: {
  workerId: string; worker: Worker; existingEntries: Entry[]
  onSave: (e: Entry) => void; onClose: () => void
}) {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [hours, setHours] = useState('')
  const [err, setErr] = useState('')

  function submit() {
    if (!date) { setErr('Elige una fecha'); return }
    const h = hoursInputToDecimal(hours)
    if (h === null || h <= 0) { setErr('Introduce horas válidas (ej: 7.30 = 7h 30min)'); return }
    if (existingEntries.find(e => e.workerId === workerId && e.date === date)) {
      setErr('Ya existe un registro para esa fecha'); return
    }
    onSave({ id: uid(), workerId, date, hours: h })
  }

  const preview = hoursInputToDecimal(hours)

  return (
    <>
      <ModalHeader title={`Añadir día — ${worker.name}`} onClose={onClose} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 20 }}>
        <div>
          <Label>Fecha</Label>
          <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div>
          <Label>Horas trabajadas</Label>
          <input className="input" type="text" inputMode="decimal" placeholder="Ej: 8 · 7.30 · 6.15"
            value={hours} onChange={e => { setHours(e.target.value); setErr('') }}
            onKeyDown={e => e.key === 'Enter' && submit()} />
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>H.MM — 7.30 significa 7h 30min</div>
        </div>
        {preview !== null && preview > 0 && (
          <div style={{ background: 'var(--accent-bg)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--accent)', fontWeight: 500 }}>
            {fmtHours(preview)} &rarr; {fmtEuro(preview * worker.rate)}
          </div>
        )}
        {err && <ErrorMsg>{err}</ErrorMsg>}
        <button className="btn btn-primary" style={{ width: '100%', padding: 14 }} onClick={submit}>Guardar</button>
      </div>
    </>
  )
}

function EditEntryModal({ entry, worker, onSave, onClose }: {
  entry: Entry; worker: Worker; onSave: (e: Entry) => void; onClose: () => void
}) {
  const [date, setDate] = useState(entry.date)
  const [hours, setHours] = useState(decimalToDisplay(entry.hours))
  const [err, setErr] = useState('')

  function submit() {
    const h = hoursInputToDecimal(hours)
    if (h === null || h <= 0) { setErr('Introduce horas válidas'); return }
    onSave({ ...entry, date, hours: h })
  }

  const preview = hoursInputToDecimal(hours)

  return (
    <>
      <ModalHeader title={`Editar registro — ${worker.name}`} onClose={onClose} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 20 }}>
        <div>
          <Label>Fecha</Label>
          <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div>
          <Label>Horas trabajadas</Label>
          <input className="input" type="text" inputMode="decimal"
            value={hours} onChange={e => { setHours(e.target.value); setErr('') }}
            onKeyDown={e => e.key === 'Enter' && submit()} />
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>H.MM — 7.30 significa 7h 30min</div>
        </div>
        {preview !== null && preview > 0 && (
          <div style={{ background: 'var(--accent-bg)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--accent)', fontWeight: 500 }}>
            {fmtHours(preview)} &rarr; {fmtEuro(preview * worker.rate)}
          </div>
        )}
        {err && <ErrorMsg>{err}</ErrorMsg>}
        <button className="btn btn-primary" style={{ width: '100%', padding: 14 }} onClick={submit}>Guardar cambios</button>
      </div>
    </>
  )
}

function WorkerFormModal({ existing, onSave, onClose }: {
  existing?: Worker; onSave: (w: Worker) => void; onClose: () => void
}) {
  const [name, setName] = useState(existing?.name ?? '')
  const [rate, setRate] = useState(String(existing?.rate ?? '11'))
  const [err, setErr] = useState('')

  function submit() {
    if (!name.trim()) { setErr('Introduce el nombre'); return }
    const r = parseFloat(rate)
    if (isNaN(r) || r <= 0) { setErr('Tarifa inválida'); return }
    onSave({ id: existing?.id ?? uid(), name: name.trim(), rate: r })
  }

  return (
    <>
      <ModalHeader title={existing ? 'Editar trabajador' : 'Nuevo trabajador'} onClose={onClose} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 20 }}>
        <div>
          <Label>Nombre completo</Label>
          <input className="input" type="text" placeholder="Nombre Apellido" value={name}
            onChange={e => { setName(e.target.value); setErr('') }} />
        </div>
        <div>
          <Label>Tarifa por hora (€)</Label>
          <input className="input" type="number" inputMode="decimal" min="0" step="0.5" value={rate}
            onChange={e => { setRate(e.target.value); setErr('') }} />
        </div>
        {err && <ErrorMsg>{err}</ErrorMsg>}
        <button className="btn btn-primary" style={{ width: '100%', padding: 14 }} onClick={submit}>
          {existing ? 'Guardar cambios' : 'Añadir trabajador'}
        </button>
      </div>
    </>
  )
}

function ConfirmModal({ label, onConfirm, onClose }: { label: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <>
      <ModalHeader title="Confirmar eliminación" onClose={onClose} />
      <p style={{ color: 'var(--text-2)', fontSize: 15, marginTop: 16, lineHeight: 1.5 }}>
        ¿Seguro que quieres eliminar {label}? Esta acción no se puede deshacer.
      </p>
      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button className="btn btn-ghost" style={{ flex: 1, padding: 14 }} onClick={onClose}>Cancelar</button>
        <button className="btn" style={{ flex: 1, padding: 14, background: 'var(--red)', color: 'white' }} onClick={onConfirm}>Eliminar</button>
      </div>
    </>
  )
}

// ─── micro components ─────────────────────────────────────────────────────────

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-1)' }}>{title}</h2>
      <button onClick={onClose} style={{
        width: 32, height: 32, borderRadius: 8, background: 'var(--bg)',
        border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: 'var(--text-2)', fontSize: 18,
      }}>✕</button>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 5 }}>{children}</div>
}

function ErrorMsg({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--red-bg)', color: 'var(--red)', fontSize: 13, padding: '9px 12px', borderRadius: 8, fontWeight: 500 }}>
      {children}
    </div>
  )
}

function IconBtn({ children, onClick, title, danger }: {
  children: React.ReactNode; onClick: () => void; title?: string; danger?: boolean
}) {
  return (
    <button title={title} onClick={onClick} style={{
      width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: danger ? 'var(--red-bg)' : 'var(--bg)',
      color: danger ? 'var(--red)' : 'var(--text-2)', flexShrink: 0,
    }}>
      {children}
    </button>
  )
}

function FullScreenLoader() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <LoadingSpinner />
    </div>
  )
}

function LoadingSpinner({ small, light }: { small?: boolean; light?: boolean }) {
  const size = small ? 16 : 32
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <circle cx="12" cy="12" r="10" stroke={light ? 'rgba(255,255,255,0.25)' : 'var(--border)'} strokeWidth="2.5"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke={light ? 'white' : 'var(--text-1)'} strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <path d="M11.5 2.5l2 2-9 9H2.5v-2l9-9z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M1 1l22 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}
