import XLSX from 'xlsx'
import * as Note from './Note'

export default function data2object(data) {
  var workbook = XLSX.read(data, {type:'binary'})

  var worksheetname = workbook.SheetNames[0];
  
  var worksheet = workbook.Sheets[worksheetname];
  
  var f = {};

  var offset = 0;

  var range = XLSX.utils.decode_range(worksheet['!ref']);

  f.title = getValue(worksheet, offset, 1);
  offset++;
  f.base = getValue(worksheet, offset, 1);
  offset++;
  f.bpm = parseInt(getValue(worksheet, offset, 1));
  offset++;
  f.numChannel = parseInt(getValue(worksheet, offset, 1));
  offset++;

  f.channelNames = [];
  for (var i=0; i<f.numChannel; i++) {
      f.channelNames.push(getValue(worksheet, offset, 1));
      offset++;
  }
  // f.numCol = range.e.c - range.s.c + 1;
  f.numCol = 32;
  f.numRow = Math.floor((range.e.r - range.s.r + 1 - offset) / f.numChannel);

  f.channelRaws = {};
  f.channels = {};
  for (var k=0; k<f.numChannel; k++) {
      var dataRaw = [];
      var data = [];
      var name = f.channelNames[k];
      for (var i=0; i<f.numRow; i++) {
          dataRaw.push([]);
          data.push([]);
          for (var j=0; j<f.numCol; j++) {
              var valueRaw = getValue(worksheet, offset + i * f.numChannel + k, j);
              var value = valueRaw;
              if (name == 'Melody') {
                  value = convertMelody(value, f.base);
              } else if (name == 'Chord') {
                  value = convertChord(value, f.base);
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
  var cell = ws[XLSX.utils.encode_cell({ r: r, c: c })];
  return cell ? cell.w : '';
}

function convertMelody(v, base) {
  // return notasi2angklung(base, v);
  // return Note.angklung2notasi(Note.notasi2angklung(v, base), base);
  // return parseNotasi(base, v);
  return v;
}

function convertChord(v, base) {
  var chord = [];
  var data = v.split('/');
  for (var i=0; i<data.length; i++) {
      chord.push(data[i].trim());
  }
  return chord;
  // return v;
}

function convertLyrics(v) {
  return v;
}
