const net = require('node:net')

function tcpRequest(host, port, payload, timeoutMs = 1200) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket()
    const chunks = []
    let settled = false

    function finish(err, data) {
      if (settled) return
      settled = true
      try {
        socket.destroy()
      } catch {
        // ignore
      }
      if (err) reject(err)
      else resolve(data)
    }

    socket.setTimeout(timeoutMs)

    socket.on('connect', () => {
      try {
        socket.write(payload)
      } catch (err) {
        finish(err)
      }
    })

    socket.on('data', (chunk) => {
      chunks.push(Buffer.from(chunk))
    })

    socket.on('timeout', () => {
      finish(new Error('Timeout'))
    })

    socket.on('error', (err) => {
      finish(err)
    })

    socket.on('close', () => {
      finish(null, Buffer.concat(chunks).toString('utf8'))
    })

    try {
      socket.connect(Number.parseInt(port, 10), host)
    } catch (err) {
      finish(err)
    }
  })
}

async function pingStatus(host, port, timeoutMs = 1200) {
  const started = Date.now()
  const response = await tcpRequest(host, port, 'PING\n', timeoutMs)
  if (!String(response || '').includes('PONG')) {
    throw new Error('Invalid ping response')
  }
  return Date.now() - started
}

async function fetchStatus(host, port, timeoutMs = 1200) {
  const response = await tcpRequest(host, port, 'STATUS\n', timeoutMs)
  const text = String(response || '').trim()
  if (!text) throw new Error('Empty status response')
  return JSON.parse(text)
}

module.exports = {
  pingStatus,
  fetchStatus,
}
