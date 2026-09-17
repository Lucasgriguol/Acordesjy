const SHARPS=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const FLATS=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
export function transposeChord(chord,steps){
  return chord.split('/').map(part=>{
    const match=part.match(/^([A-G])([#b]?)(.*)$/); if(!match)return part;
    const [,letter,acc,suffix]=match; const root=letter+acc; const source=acc==='b'?FLATS:SHARPS;
    let index=source.indexOf(root); if(index<0) index=SHARPS.indexOf(root); if(index<0)return part;
    const target=(index+steps+12)%12; return (acc==='b'?FLATS:SHARPS)[target]+suffix;
  }).join('/');
}
export const transposeKey=(key,steps)=>transposeChord(key,steps);
export function validChord(value){return /^[A-G](#|b)?(m|maj|min|dim|aug|sus|add|\d|\(|\)|b|#|\+|-)*(\/[A-G](#|b)?)?$/.test(value);}
