import XLSX from 'xlsx'
// import * as Note from './Note'

export default function data2object(data) {
  const workbook = XLSX.read(data, {type:'binary'})

  const worksheetname = workbook.SheetNames[0];
  
  const worksheet = workbook.Sheets[worksheetname];
  
  const f = {};

  let offset = 0;

  const range = XLSX.utils.decode_range(worksheet['!ref']);

  f.title = 'Untitled';
  f.base = 'C5';
  f.bpm = 60;
  f.transpose = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const parameter = getValue(worksheet, offset, 0);
    switch (parameter) {
      case 'Title':
        f.title = getValue(worksheet, offset, 1);
        break;
      case 'Base':
        f.base = getValue(worksheet, offset, 1);
        break;
      case 'Transpose':
        f.transpose = parseInt(getValue(worksheet, offset, 1));
        break;
      case 'BPM':
        f.bpm = parseInt(getValue(worksheet, offset, 1));
        break;
      case 'Row':
        f.numChannel = parseInt(getValue(worksheet, offset, 1));
        break;
    }
    offset++;
    if (parameter == 'Row') {
      break;
    }
  }

  f.channelNames = [];
  for (let i=0; i<f.numChannel; i++) {
      f.channelNames.push(getValue(worksheet, offset, 1));
      offset++;
  }
  // f.numCol = range.e.c - range.s.c + 1;
  f.numCol = 32;
  f.numRow = Math.floor((range.e.r - range.s.r + 1 - offset) / f.numChannel);

  f.channelRaws = {};
  f.channels = {};
  for (let k=0; k<f.numChannel; k++) {
      const dataRaw = [];
      const data = [];
      const name = f.channelNames[k];
      for (let i=0; i<f.numRow; i++) {
          dataRaw.push([]);
          data.push([]);
          for (var j=0; j<f.numCol; j++) {
              const valueRaw = getValue(worksheet, offset + i * f.numChannel + k, j);
              let value = valueRaw;
              if (name == 'Melody') {
                  value = convertMelody(value);
              } else if (name == 'Chord') {
                  value = convertChord(value);
              } else if (name == 'Lyrics') {
                  value = convertLyrics(value);
              }
              dataRaw[i].push(valueRaw);
              data[i].push(value);
          }
      }
      f.channelRaws[name] = dataRaw;
      f.channels[name] = data;
  }

  return f;
}

function getValue(ws, r, c) {
  const cell = ws[XLSX.utils.encode_cell({ r: r, c: c })];
  return cell ? cell.w : '';
}

function convertMelody(v) {
  return convertChord(v)
}

function convertChord(v) {
  const chord = [];
  const data = v.split('/');
  for (var i=0; i<data.length; i++) {
    const note = data[i].trim();
    if (note != '') chord.push(note);
  }
  return chord;
}

function convertLyrics(v) {
  return v.trim();
}
