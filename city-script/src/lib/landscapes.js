// חמשת הנופים של מערכת העיצוב. כל שכבה במפה ובממשק מקבלת נוף אחד.
export const LANDSCAPES = {
  sea: { name: 'ים', meaning: 'חוף וים', c100: '#DEEDF0', c300: '#A0D4E8', c500: '#31A7D9', c700: '#216B8C', ink: 'var(--sea-ink)' },
  dune: { name: 'דיונה', meaning: 'מורשת ושימור', c100: '#F9EED6', c300: '#F7D895', c500: '#F3B220', c700: '#7A601E', ink: 'var(--dune-ink)' },
  nahal: { name: 'נחל', meaning: 'נחל ופארקים', c100: '#E9EFDA', c300: '#C3DBA0', c500: '#80B839', c700: '#4A6D2C', ink: 'var(--nahal-ink)' },
  estuary: { name: 'שפך', meaning: 'מגורים וקהילה', c100: '#E3EEE5', c300: '#B1D8C4', c500: '#58B089', c700: '#376D5A', ink: 'var(--estuary-ink)' },
  port: { name: 'נמל', meaning: 'מסחר, תעסוקה ונמל', c100: '#F7E1D8', c300: '#F2AF99', c500: '#E8552A', c700: '#A64226', ink: 'var(--port-ink)' },
}
export const land = (k) => LANDSCAPES[k] || LANDSCAPES.estuary
