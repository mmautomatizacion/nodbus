/*
* Nodbus. Slave Controller for ModBus TCP protocol in Node.JS 
* Copyright (C) 2016 Manuel Martínez Automatización y Pesaje Industrial, S.L.U.
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var assert = require('assert');

var BufferMB = Buffer;
module.exports = exports = BufferMB;


/**********************************************************
 *
 *      LECTURA DE Int16
 *      
 **********************************************************/

function readInt16(buffer, offset, isBigEndian, noAssert) {
  var neg, val;

  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'Trying to read beyond buffer length');
  }

  val = readUInt16(buffer, offset, isBigEndian, noAssert);
  neg = val & 0x8000;
  if (!neg) {
    return val;
  }

  return (0xffff - val + 1) * -1;
}

Buffer.prototype.readInt16LEW = function(offset, noAssert) {
  return readInt16(this, offset, true, noAssert);
};

Buffer.prototype.readInt16BEW = function(offset, noAssert) {
  return readInt16(this, offset, true, noAssert);
};



/**********************************************************
 *
 *      LECTURA DE UInt16
 *      
 **********************************************************/

function readUInt16(buffer, offset, isBigEndian, noAssert) {
  var val = 0;


  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'Trying to read beyond buffer length');
  }

  if (isBigEndian) {
    val = buffer[offset] << 8;
    val |= buffer[offset + 1];
  } else {
    val = buffer[offset];
    val |= buffer[offset + 1] << 8;
  }

  return val;
}

Buffer.prototype.readUInt16LEW = function(offset, noAssert) {
  return readUInt16(this, offset, true, noAssert);
};

Buffer.prototype.readUInt16BEW = function(offset, noAssert) {
  return readUInt16(this, offset, true, noAssert);
};



/**********************************************************
 *
 *      LECTURA DE Int32
 *      
 **********************************************************/

function readInt32W(buffer, offset, isBigEndian, noAssert) {
  var neg, val;

  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to read beyond buffer length');
  }

  val = readUInt32W(buffer, offset, isBigEndian, noAssert);
  neg = val & 0x80000000;
  if (!neg) {
    return (val);
  }

  return (0xffffffff - val + 1) * -1;
}

Buffer.prototype.readInt32LEW = function(offset, noAssert) {
  return readInt32W(this, offset, false, noAssert);
};

Buffer.prototype.readInt32BEW = function(offset, noAssert) {
  return readInt32W(this, offset, true, noAssert);
};



/**********************************************************
 *
 *      LECTURA DE UInt32
 *      
 **********************************************************/

function readUInt32W(buffer, offset, isBigEndian, noAssert) {
  var val = 0;

  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to read beyond buffer length');
  }

  if (isBigEndian) {
    val = buffer[offset + 1] << 16;
    val |= buffer[offset + 2] << 8;
    val |= buffer[offset + 3];
    val = val + (buffer[offset] << 24 >>> 0);
  } else {
    val = buffer[offset + 3] << 16;
    val |= buffer[offset] << 8;
    val |= buffer[offset + 1];
    val = val + (buffer[offset + 2] << 24 >>> 0);
  }

  return val;
}

Buffer.prototype.readUInt32LEW = function(offset, noAssert) {
  return readUInt32W(this, offset, false, noAssert);
};

Buffer.prototype.readUInt32BEW = function(offset, noAssert) {
  return readUInt32W(this, offset, true, noAssert);
};



/**********************************************************
 *
 *      LECTURA DE Float
 *      
 **********************************************************/

function readFloatLEW(buffer, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset + 3 < buffer.length,
        'Trying to read beyond buffer length');
  }

  return readIEEE754LEW(buffer, offset, 23, 4);
}

Buffer.prototype.readFloatLEW = function(offset, noAssert) {
  return readFloatLEW(this, offset, false, noAssert);
};

Buffer.prototype.readFloatBEW = function(offset, noAssert) {
  return this.readFloatBE(offset, noAssert);
};



/**********************************************************
 *
 *      LECTURA DE Double
 *      
 **********************************************************/

function readDoubleLEW(buffer, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset + 7 < buffer.length,
        'Trying to read beyond buffer length');
  }

  return readIEEE754LEW(buffer, offset, 52, 8);
}

Buffer.prototype.readDoubleLEW = function(offset, noAssert) {
  return readDoubleLEW(this, offset, false, noAssert);
};

Buffer.prototype.readDoubleBEW = function(offset, noAssert) {
  return this.readDoubleBE(offset, noAssert);
};










/**********************************************************
 *
 *      ESCRITURA DE Int16
 *      
 **********************************************************/

function writeInt16(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'Trying to write beyond buffer length');

    verifsint(value, 0x7fff, -0x8000);
  }

  if (value >= 0) {
    writeUInt16W(buffer, value, offset, isBigEndian, noAssert);
  } else {
    writeUInt16W(buffer, 0xffff + value + 1, offset, isBigEndian, noAssert);
  }
}

Buffer.prototype.writeInt16LEW = function(value, offset, noAssert) {
  writeInt16(this, value, offset, true, noAssert);
};

Buffer.prototype.writeInt16BEW = function(value, offset, noAssert) {
  writeInt16(this, value, offset, true, noAssert);
};



/**********************************************************
 *
 *      ESCRITURA DE UInt16
 *      
 **********************************************************/

function writeUInt16W(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'trying to write beyond buffer length');

    verifuint(value, 0xffff);
  }

  if (isBigEndian) {
    buffer[offset] = (value & 0xff00) >>> 8;
    buffer[offset + 1] = value & 0x00ff;
  } else {
    buffer[offset + 1] = (value & 0xff00) >>> 8;
    buffer[offset] = value & 0x00ff;
  }
}

Buffer.prototype.writeUInt16LEW = function(value, offset, noAssert) {
  writeUInt16W(this, value, offset, true, noAssert);
};

Buffer.prototype.writeUInt16BEW = function(value, offset, noAssert) {
  writeUInt16W(this, value, offset, true, noAssert);
};




/**********************************************************
 *
 *      ESCRITURA DE Int32
 *      
 **********************************************************/

function writeInt32W(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to write beyond buffer length');

    verifsint(value, 0x7fffffff, -0x80000000);
  }

  if (value >= 0) {
    writeUInt32W(buffer, value, offset, isBigEndian, noAssert);
  } else {
    writeUInt32W(buffer, 0xffffffff + value + 1, offset, isBigEndian, noAssert);
  }
}

Buffer.prototype.writeInt32LEW = function(value, offset, noAssert) {
  writeInt32W(this, value, offset, false, noAssert);
};

Buffer.prototype.writeInt32BEW = function(value, offset, noAssert) {
  writeInt32W(this, value, offset, true, noAssert);
};




/**********************************************************
 *
 *      ESCRITURA DE UInt32
 *      
 **********************************************************/

function writeUInt32W(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'trying to write beyond buffer length');

    verifuint(value, 0xffffffff);
  }

  if (isBigEndian) {
    buffer[offset] = (value >>> 24) & 0xff;
    buffer[offset + 1] = (value >>> 16) & 0xff;
    buffer[offset + 2] = (value >>> 8) & 0xff;
    buffer[offset + 3] = value & 0xff;
  } else {
    buffer[offset] = (value >>> 8) & 0xff;
    buffer[offset + 1] = value & 0xff;
    buffer[offset + 2] = (value >>> 24) & 0xff;
    buffer[offset + 3] = (value >>> 16) & 0xff;
  }
}

BufferMB.prototype.writeUInt32LEW = function(value, offset, noAssert) {
  writeUInt32W(this, value, offset, false, noAssert);
};

BufferMB.prototype.writeUInt32BEW = function(value, offset, noAssert) {
  writeUInt32W(this, value, offset, true, noAssert);
};




/**********************************************************
 *
 *      ESCRITURA DE Float
 *      
 **********************************************************/

function writeFloatLEW(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to write beyond buffer length');

    verifIEEE754(value, 3.4028234663852886e+38, -3.4028234663852886e+38);
  }

  writeIEEE754LEW(buffer, value, offset, 23, 4);
}

Buffer.prototype.writeFloatLEW = function(value, offset, noAssert) {
  writeFloatLEW(this, value, offset, false, noAssert);
};

Buffer.prototype.writeFloatBEW = function(value, offset, noAssert) {
  this.writeFloatBE(value, offset, noAssert);
};



/**********************************************************
 *
 *      ESCRITURA DE Double
 *      
 **********************************************************/

function writeDoubleLEW(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 7 < buffer.length,
        'Trying to write beyond buffer length');

    verifIEEE754(value, 1.7976931348623157E+308, -1.7976931348623157E+308);
  }

  writeIEEE754LEW(buffer, value, offset, 52, 8);
}

Buffer.prototype.writeDoubleLEW = function(value, offset, noAssert) {
  writeDoubleLEW(this, value, offset, false, noAssert);
};

Buffer.prototype.writeDoubleBEW = function(value, offset, noAssert) {
  this.writeDoubleBE(value, offset, noAssert);
};











/**********************************************************
 *
 *      FUNCIONES DE Float y Double
 *      
 **********************************************************/

function readIEEE754LEW(buffer, offset, mLen, nBytes) {
  var e, m,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      nBits = -7,
      i = (nBytes - 2),
      d = -1,
      s = buffer[offset + i];
      

  if (i % 2 == 0) {
      i += 1;
  }

  e = s & ((1 << (-nBits)) - 1);
  s >>= (-nBits);
  nBits += eLen;
   
  for (; nBits > 0; nBits -= 8) {
      e = e * 256 + buffer[offset + i];
      if (i % 2 == 0) {
        i += 1;
      } else {
        i -= 3;
      }
  }

  m = e & ((1 << (-nBits)) - 1);
  e >>= (-nBits);
  nBits += mLen;
  
  for (; nBits > 0; nBits -= 8) {
      m = m * 256 + buffer[offset + i];
      if (i % 2 == 0) {
        i += 1;
      } else {
        i -= 3;
      }
  }

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity);
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
}


function writeIEEE754LEW(buffer, value, offset, mLen, nBytes) {
  var e, m, c,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
      i = 1,
      d = 1,
      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }
  for (; mLen >= 8; mLen -= 8) {
      buffer[offset + i] = m & 0xff;
      if (i % 2 == 0) {
          i += 3 * d;
      } else {
          i += -1 * d;
      }
      m /= 256;
  }

  e = (e << mLen) | m;
  eLen += mLen;  
  
  for (; eLen > 0; eLen -= 8) {
      buffer[offset + i] = e & 0xff;
      if (i % 2 == 0) {
          i += 3 * d;
      } else {
          i += -1 * d;
      }
      e /= 256;
  }
  
  buffer[offset + i * d] |= s * 128;
}




/**********************************************************
 *
 *      FUNCIONES DE VERIFICACIÓN
 *      
 **********************************************************/

function verifsint(value, max, min) {
  assert.ok(typeof (value) == 'number',
      'cannot write a non-number as a number');

  assert.ok(value <= max, 'value larger than maximum allowed value');

  assert.ok(value >= min, 'value smaller than minimum allowed value');

  assert.ok(Math.floor(value) === value, 'value has a fractional component');
}

function verifuint(value, max) {
  assert.ok(typeof (value) == 'number',
      'cannot write a non-number as a number');

  assert.ok(value >= 0,
      'specified a negative value for writing an unsigned value');

  assert.ok(value <= max, 'value is larger than maximum value for type');

  assert.ok(Math.floor(value) === value, 'value has a fractional component');
}

function verifIEEE754(value, max, min) {
  assert.ok(typeof (value) == 'number',
      'cannot write a non-number as a number');

  assert.ok(value <= max, 'value larger than maximum allowed value');

  assert.ok(value >= min, 'value smaller than minimum allowed value');
}