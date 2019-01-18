// Comb: type Angklung, base C5, data 6
// Note: C5
// Angklung: 6
// Notasi: 1
// Parsed: note 1, sharp 0, octave 0
// base always in note

///////////////
// Transpose //
///////////////

export function combTranspose(comb, transpose, changeData = false) {
  var ret = { type: comb.type, base: comb.base, data: comb.note };
  if (comb.type == 'note') {
    ret.data = noteTranspose(comb.data, transpose);
    ret.base = noteTranspose(comb.base, transpose);
  } else if (comb.type == 'angklung') {
    ret.data = angklungTranspose(comb.data, transpose);
    ret.base = noteTranspose(comb.base, transpose);
  } else if (comb.type == 'notasi') {
    if (changeData) {
      ret.data = notasiTranspose(comb.data, transpose);
    } else {
      ret.base = noteTranspose(comb.base, transpose);
    }
  } else if (comb.type == 'parsed') {
    if (changeData) {
      ret.data = parsedTranspose(comb.data, transpose);
    } else {
      ret.base = noteTranspose(comb.base, transpose);
    }
  }
}

export function combChangeBase(comb, target, changeData = false) {
  var transpose = note2angklung(target) - note2angklung(comb.base);
  return combTranspose(comb, transpose, changeData);
}

export function noteTranspose(note, transpose) {
  return angklung2note(angklungTranspose(note2angklung(note), transpose));
}

export function noteChangeBase(note, base, target) {
  var transpose = note2angklung(target) - note2angklung(base);
  return noteTranspose(note, transpose);
}

export function angklungTranspose(angklung, transpose) {
  if (angklung == null) return null;
  if (angklung == 'stop') return 'stop';
  return angklung + transpose;
}

export function angklungChangeBase(angklung, base, target) {
  var transpose = note2angklung(target) - note2angklung(base);
  return angklungTranspose(angklung, transpose);
}

export function notasiTranspose(notasi, transpose) {
  return parsed2notasi(parsedTranspose(notasi2parsed(notasi), transpose));
}

export function notasiChangeBase(notasi, base, target) {
  var transpose = note2angklung(target) - note2angklung(base);
  return notasiTranspose(notasi, transpose);
}

export function parsedTranspose(parsed, transpose) {
  return angklung2parsed(angklungTranspose(parsed2angklung(parsed, 'C5'), transpose), 'C5');
}

export function parsedChangeBase(parsed, base, target) {
  var transpose = note2angklung(target) - note2angklung(base);
  return parsedTranspose(parsed, transpose);
}

/////////////////
// Combination //
/////////////////

export function comb2note(comb) {
  if (comb.type == 'note') {
    return comb.data;
  } else if (comb.type == 'angklung') {
    return angklung2note(comb.data);
  } else if (comb.type == 'notasi') {
    return notasi2note(comb.data, comb.base);
  } else if (comb.type == 'parsed') {
    return parsed2note(comb.data, comb.base);
  }
}

export function comb2angklung(comb) {
  if (comb.type == 'note') {
    return note2angklung(comb.data);
  } else if (comb.type == 'angklung') {
    return comb.data;
  } else if (comb.type == 'notasi') {
    return notasi2angklung(comb.data, comb.base);
  } else if (comb.type == 'parsed') {
    return parsed2angklung(comb.data, comb.base);
  }
}

export function comb2notasi(comb) {
  if (comb.type == 'note') {
    return note2notasi(comb.data, comb.base);
  } else if (comb.type == 'angklung') {
    return angklung2notasi(comb.data, comb.base);
  } else if (comb.type == 'notasi') {
    return comb.data;
  } else if (comb.type == 'parsed') {
    return parsed2notasi(comb.data);
  }
}

export function comb2parsed(comb) {
  if (comb.type == 'note') {
    return note2parsed(comb.data, comb.base);
  } else if (comb.type == 'angklung') {
    return angklung2parsed(comb.data, comb.base);
  } else if (comb.type == 'notasi') {
    return notasi2parsed(comb.data);
  } else if (comb.type == 'parsed') {
    return comb.data;
  }
}

export function note2comb(note, base) {
  return { type: 'note', base: base, data: note };
}

export function angklung2comb(angklung, base) {
  return { type: 'angklung', base: base, data: angklung };
}

export function notasi2comb(notasi, base) {
  return { type: 'notasi', base: base, data: notasi };
}

export function parsed2comb(parsed, base) {
  return { type: 'parsed', base: base, data: parsed };
}

///////////////
// Converter //
///////////////

var notes = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
var i2n = [];
var n2i = {};

for (var i=0; i<8; i++) {
  for (var j=0; j<notes.length; j++) {
    var note = notes[j] + i;
    var int = i * notes.length + j;
    i2n[int] = note;
    n2i[note] = int;
  }
}

export function note2angklung(v) {
  // cleanup
  if (v == 'stop') return 'stop'
  v = v.trim().toUpperCase();
  return n2i[v] - n2i['F#4'];
}

export function angklung2note(v) {
  if (v == 'stop') return 'stop'
  return i2n[v + n2i['F#4']];
}

export function notasi2parsed(v) {
  if (v == null || v == '') return null;

  v = v.trim().toUpperCase();

  var ret = { note: 0, sharp: 0, octave: 0 };

  var o = 0;
  for (var i=o; i<v.length; i++) {
    if (v.charAt(i) == '*') {
      ret.octave --;
      o++;
    } else {
      break;
    }
  }
  ret.note = v.charCodeAt(o) - '0'.charCodeAt(0);
  o++;

  if (v.charAt(o) == '#') {
    ret.sharp = 1;
    o++;
  }

  for (var i=o; i<v.length; i++) {
    if (v.charAt(i) == '*') {
      ret.octave ++;
      o++;
    } else {
      break;
    }
  }

  return ret;
}

export function parsed2notasi(v) {
  var parsed = v;
  if (!parsed) return '';

  var ret = '';

  for (var i=0; i<-parsed.octave; i++) {
    ret += '*';
  }

  ret += parsed.note;
  if (parsed.sharp == 1) {
    ret += '#';
  }

  for (var i=0; i<parsed.octave; i++) {
    ret += '*';
  }

  return ret;
}

export function angklung2parsed(v, base) {
  if (v == null) return null;

  var ret = { note: 0, sharp: 0, octave: 0 };

  if (v == 'stop') return ret;

  var note = v - note2angklung(base);

  while (note < 0) {
    note += 12;
    ret.octave --;
  }

  while (note >= 12) {
    note -= 12;
    ret.octave ++;
  }

  var map = [[1, 0], [1, 1], [2, 0], [2, 1], [3, 0], [4, 0], [4, 1], [5, 0], [5, 1], [6, 0], [6, 1], [7, 0]];

  note = map[note];
  ret.note = note[0];
  ret.sharp = note[1];

  return ret;
}

export function parsed2angklung(v, base) {
  var map = [0, 0, 2, 4, 5, 7, 9, 11];

  var parsed = v;
  if (!parsed) return null;

  if (parsed.note == 0) return 'stop';

  return note2angklung(base) + map[parsed.note] + parsed.sharp + parsed.octave * 12;
}

export function notasi2angklung(v, base) {
  return parsed2angklung(notasi2parsed(v), base);
}

export function angklung2notasi(v, base) {
  return parsed2notasi(angklung2parsed(v, base));
}

export function parsed2note(v, base) {
  return angklung2note(parsed2angklung(v, base));
}

export function note2parsed(v, base) {
  return angklung2parsed(note2angklung(v), base);
}

export function notasi2note(v, base) {
  return angklung2note(notasi2angklung(v, base));
}

export function note2notasi(v, base) {
  return angklung2notasi(note2angklung(v), base);
}