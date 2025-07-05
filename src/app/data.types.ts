export interface Horde {
    id: number
    tents: Tent[]
    name: string
    greatkhan: number
  }
  
  export interface Tent {
    id: number
    name: string
    horde: number
  }
  