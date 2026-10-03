const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLATS  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Normaliza enarmónicos raros a algo reconocible.
const ENARMONICOS = { 'Cb': 'B', 'B#': 'C', 'E#': 'F', 'Fb': 'E' };

function normalizarRaiz(letter, acc) {
  const raw = letter + acc;
  return ENARMONICOS[raw] || raw;
}

export function transposeChord(chord, steps) {
  if (!chord) return chord;
  return chord.split('/').map(part => {
    const match = part.match(/^([A-G])([#b]?)(.*)$/);
    if (!match) return part;
    const [, letter, acc, suffix] = match;

    const root = normalizarRaiz(letter, acc);
    const usaBemoles = acc === 'b' || root.includes('b');
    const source = usaBemoles ? FLATS : SHARPS;

    let index = source.indexOf(root);
    if (index < 0) index = SHARPS.indexOf(root);
    if (index < 0) return part;

    const target = (index + steps + 120) % 12;
    const salida = (usaBemoles ? FLATS : SHARPS)[target] + suffix;
    return salida;
  }).join('/');
}

export const transposeKey = (key, steps) => transposeChord(key, steps);

// Lista de sufijos permitidos (ampliable).
const SUFIJOS = [
  '', 'm', 'maj', 'maj7', 'maj9', 'm7', 'm9', 'm11', 'm6',
  '7', '9', '11', '13', '6', '5',
  'dim', 'dim7', 'aug', 'sus', 'sus2', 'sus4',
  'add9', 'add11', 'add13', 'm7b5', '7b5', '7#5', '7b9', '7#9',
  'maj7b5', 'maj7#5', 'madd9', 'mmaj7'
];

export function validChord(value) {
  if (!value) return false;
  const v = String(value).trim();
  if (v === 'N.C.' || v === '%') return true;
  return v.split('/').every(part => {
    const match = part.match(/^([A-G])([#b]?)(.*)$/);
    if (!match) return false;
    const [, , , suffix] = match;
    return SUFIJOS.includes(suffix);
  });
}