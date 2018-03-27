'use strict'

const packet = require('..')
const net = require('net')

var response = null
var expected_length = 0

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const encodedPacket = packet.streamEncode({
  type: 'query',
  id: getRandomInt(1, 65534),
  flags: packet.RECURSION_DESIRED,
  questions: [{
    type: 'A',
    name: 'google.com'
  }]
})

const client = new net.Socket()
client.connect(53, '8.8.8.8', function () {
  console.log('Connected')
  client.write(encodedPacket)
})

client.on('data', function (data) {
  console.log('Received response: %d bytes', data.byteLength)
  if (response == null) {
    if (data.byteLength > 1) {
      const plen = data.readUInt16BE(0)
      expected_length = plen
      if (plen < 12) {
        throw new Error('below DNS minimum packet length')
      }
      response = Buffer.from(data)
    }
  } else {
    response = Buffer.concat([response, data])
  }

  if (response.byteLength >= expected_length) {
    console.log(packet.streamDecode(response))
    client.destroy()
  }
})

client.on('close', function () {
  console.log('Connection closed')
})
