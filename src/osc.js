const dgram = require('node:dgram')

function pad4(buffer) {
  const pad = (4 - (buffer.length % 4)) % 4
  if (pad === 0) return buffer
  return Buffer.concat([buffer, Buffer.alloc(pad)])
}

function encodeOscString(value) {
  return pad4(Buffer.from(`${value}\0`, 'utf8'))
}

function encodeOscInt(value) {
  const buf = Buffer.alloc(4)
  buf.writeInt32BE(Number.parseInt(value, 10) || 0, 0)
  return buf
}

function encodeOscMessage(address, args = []) {
  const safeAddress = String(address || '').trim()
  if (!safeAddress.startsWith('/')) {
    throw new Error(`Invalid OSC address: ${safeAddress}`)
  }

  const intArgs = args.map((arg) => Number.parseInt(arg, 10) || 0)
  const tags = `,${'i'.repeat(intArgs.length)}`

  return Buffer.concat([
    encodeOscString(safeAddress),
    encodeOscString(tags),
    ...intArgs.map(encodeOscInt),
  ])
}

class OscSender {
  constructor() {
    this.socket = dgram.createSocket('udp4')
  }

  async send(host, port, address, args = []) {
    const packet = encodeOscMessage(address, args)
    return new Promise((resolve, reject) => {
      this.socket.send(packet, Number.parseInt(port, 10) || 7000, host, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  close() {
    try {
      this.socket.close()
    } catch {
      // ignore
    }
  }
}

module.exports = {
  OscSender,
  encodeOscMessage,
}
