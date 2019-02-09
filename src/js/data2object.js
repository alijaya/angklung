import XLSX from 'xlsx'
// import * as Note from './Note'

export default function data2object(data) {
  const workbook = XLSX.read(data, {type:'binary'})

  const worksheetname = workbook.SheetNames[0]
  
  const worksheet = workbook.Sheets[worksheetname]
  
  const f = {}

  let offset = 0

  const range = XLSX.utils.decode_range(worksheet['!ref'])
  range.e.c = 31
  range.e.r += 3

  const arr = XLSX.utils.sheet_to_json(worksheet, {
    defval: '',
    header: 1,
    range: range,
  })

  f.title = 'Untitled'
  f.base = 'C5'
  f.bpm = 60
  f.transpose = 0

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const parameter = arr[offset][0].toLowerCase()
    const val = arr[offset][1]
    switch (parameter) {
      case 'title':
        f.title = val
        break
      case 'base':
        f.base = val
        break
      case 'transpose':
        f.transpose = parseInt(val)
        break
      case 'bpm':
        f.bpm = parseInt(val)
        break
      case 'row':
        f.numChannel = parseInt(val)
        break
    }
    offset++
    if (parameter == 'row') {
      break
    }
  }

  f.channelNames = []
  for (let i=0; i<f.numChannel; i++) {
      f.channelNames.push(arr[offset][1])
      offset++
  }
  f.numCol = range.e.c - range.s.c + 1
  f.numRow = Math.floor((range.e.r - range.s.r + 1 - offset) / f.numChannel)

  f.channelRaws = {}
  f.channels = {}
  for (let k=0; k<f.numChannel; k++) {
      const dataRaw = []
      const data = []
      const name = f.channelNames[k]
      for (let i=0; i<f.numRow; i++) {
          dataRaw.push([])
          data.push([])
          for (let j=0; j<f.numCol; j++) {
              const valueRaw = arr[offset + i * f.numChannel + k][j]
              let value = valueRaw
              if (name == 'Melody') {
                  value = convertMelody(value)
              } else if (name == 'Chord') {
                  value = convertChord(value)
              } else if (name == 'Lyrics') {
                  value = convertLyrics(value)
              }
              dataRaw[i].push(valueRaw)
              data[i].push(value)
          }
      }
      f.channelRaws[name] = dataRaw
      f.channels[name] = data
  }

  // change to 2 bar per row
  f.numRow = f.numRow * 2
  f.numCol = Math.floor(f.numCol / 2)
  for (let k=0; k<f.numChannel; k++) {
    const dataRaw = []
    const data = []
    const name = f.channelNames[k]
    for (let i=0; i<f.numRow; i++) {
      const ii = Math.floor(i / 2)
      dataRaw.push([])
      data.push([])
      for (let j=0; j<f.numCol; j++) {
        const jj = (i % 2) * f.numCol + j
        dataRaw[i].push(f.channelRaws[name][ii][jj])
        data[i].push(f.channels[name][ii][jj])
      }
    }
    f.channelRaws[name] = dataRaw
    f.channels[name] = data
  }

  return f
}

function convertMelody(v) {
  return convertChord(v)
}

function convertChord(v) {
  const chord = []
  const data = v.split('/')
  for (var i=0; i<data.length; i++) {
    const note = data[i].trim()
    if (note != '') chord.push(note)
  }
  return chord
}

function convertLyrics(v) {
  return v.trim()
}
