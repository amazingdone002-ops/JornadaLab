import type { AppData } from './types'

// Horas en decimal: 6.30 = 6h30min = 6.5, 7.15 = 7h15min = 7.25
const W = [
  { id: 'w1',  name: 'Diego Valencia',     rate: 11 },
  { id: 'w2',  name: 'Alonso Prado',       rate: 11 },
  { id: 'w3',  name: 'Francisco García',   rate: 11 },
  { id: 'w4',  name: 'Antonio Espada',     rate: 11 },
  { id: 'w5',  name: 'Benito Gutiérrez',   rate: 11 },
  { id: 'w6',  name: 'Manolo Lozano',      rate: 11 },
  { id: 'w7',  name: 'Cristo',             rate: 11 },
  { id: 'w8',  name: 'Juan Macías',        rate: 11 },
  { id: 'w9',  name: 'Francisco González', rate: 11 },
  { id: 'w10', name: 'Sarai',              rate: 11 },
  { id: 'w11', name: 'Rochi',              rate: 11 },
]

function e(id: string, wid: string, date: string, hours: number) {
  return { id, workerId: wid, date, hours }
}

let eid = 1
function entry(wid: string, date: string, hours: number) {
  return e(`e${eid++}`, wid, date, hours)
}

const MAIN = ['w1','w2','w3','w4','w5']
const entries = [
  // 5 main workers: same schedule, 42h total
  ...MAIN.flatMap(wid => [
    entry(wid, '2026-03-09', 6.0),
    entry(wid, '2026-03-11', 6.5),
    entry(wid, '2026-03-12', 7.0),
    entry(wid, '2026-03-13', 7.25),
    entry(wid, '2026-03-14', 8.0),
    entry(wid, '2026-03-15', 7.25),
  ]),
  // Manolo - 22.5h
  entry('w6', '2026-03-13', 7.25),
  entry('w6', '2026-03-14', 8.0),
  entry('w6', '2026-03-15', 7.25),
  // Cristo - misma semana que Manolo
  entry('w7', '2026-03-13', 7.25),
  entry('w7', '2026-03-14', 8.0),
  entry('w7', '2026-03-15', 7.25),
  // Juan
  entry('w8', '2026-03-14', 8.0),
  entry('w8', '2026-03-15', 7.25),
  // Francisco González
  entry('w9', '2026-03-14', 8.0),
  // Sarai
  entry('w10', '2026-03-14', 8.0),
  // Rochi
  entry('w11', '2026-03-15', 7.25),
]

export const INITIAL_DATA: AppData = {
  workers: W,
  entries,
}
