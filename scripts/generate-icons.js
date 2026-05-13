// Gera ícones PNG para o PWA usando apenas módulos nativos do Node.js
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

function crc32(data) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc & 1) ? (crc >>> 1) ^ 0xEDB88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function createPNG(size, r, g, b) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type: RGB

  // Cada linha: 1 byte filtro (0) + size*3 bytes RGB
  const raw = Buffer.alloc(size * (1 + size * 3));
  for (let y = 0; y < size; y++) {
    const base = y * (1 + size * 3);
    raw[base] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const off = base + 1 + x * 3;
      raw[off] = r;
      raw[off + 1] = g;
      raw[off + 2] = b;
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 6 });

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdrData),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const iconsDir = path.join(__dirname, '../public/icons');
fs.mkdirSync(iconsDir, { recursive: true });

// FamilyFlow — verde esmeralda #10b981 = rgb(16, 185, 129)
const [r, g, b] = [16, 185, 129];

fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), createPNG(192, r, g, b));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), createPNG(512, r, g, b));
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), createPNG(180, r, g, b));

console.log('✓ Ícones gerados em public/icons/');
