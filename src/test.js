XLSX = require('xlsx');
Note = require('js/Note.js');

var workbook = XLSX.readFile('/home/pradityoadi/Downloads/La Vie En Rose.xlsx');

var worksheetname = workbook.SheetNames[0];

var worksheet = workbook.Sheets[worksheetname];

function getValue(ws, r, c) {
    var cell = ws[XLSX.utils.encode_cell({ r: r, c: c })];
    return cell ? cell.w : '';
}

function convertMelody(base, v) {
    // return notasi2angklung(base, v);
    return Note.angklung2notasi(base, Note.notasi2angklung(base, v));
    // return parseNotasi(base, v);
}

function convertChord(base, v) {
    var chord = [];
    // var data = v.split('/');
    // for (var i=0; i<data.length; i++) {
        // chord.push(notasi2angklung(data[i]));
    // }
    return chord;
}

function convertLyrics(v) {
    return v;
}

var f = {};

var offset = 0;

var range = XLSX.utils.decode_range(worksheet['!ref']);

f.title = getValue(worksheet, offset, 1);
offset++;
f.base = getValue(worksheet, offset, 1);
offset++;
f.numChannel = parseInt(getValue(worksheet, offset, 1));
offset++;

f.channelNames = [];
for (var i=0; i<f.numChannel; i++) {
    f.channelNames.push(getValue(worksheet, offset, 1));
    offset++;
}
f.numCol = range.e.c - range.s.c + 1;
f.numRow = Math.floor((range.e.r - range.s.r + 1) / f.numChannel);

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
                value = convertMelody(f.base, value);
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

console.log(f.channelRaws['Melody'][0]);
console.log(f.channels['Melody'][0]);

console.log(angklung2notasi('C5', 6));