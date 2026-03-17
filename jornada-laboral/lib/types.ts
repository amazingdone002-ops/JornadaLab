export interface Worker {
  id: string
  name: string
  rate: number
}

export interface Entry {
  id: string
  workerId: string
  date: string   // YYYY-MM-DD
  hours: number  // decimal (7.25 = 7h 15min)
}

export interface AppData {
  workers: Worker[]
  entries: Entry[]
}
