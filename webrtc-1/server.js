const express = require('express')

var io = require('socket.io')
({
    path: '/webrtc'
})

const app = express()
const port = 8080

// 서버 확인용 코드
// app.get('/', (req, res) => res.send('Hello World!!!'))

// __dirname : 현재 실행중인 폴더 경로
app.use(express.static(__dirname + '/build'))
app.get('/', (req, res, next) => {
    res.sendFile(__dirname + '/build/index.html')
})

const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`))

io.listen(server)

const peers = io.of('/webrtcPeer')

let connectedPeers = new Map()

peers.on('connection', socket => {

    console.log(`LOG >>> socket id : ${socket.id}`)
    socket.emit('connection-success', { success: socket.id })
    
    connectedPeers.set(socket.id, socket)

    socket.on('disconnect', () => {
        console.log(`LOG >>> disconnected ${socket.id}`)
        connectedPeers.delete(socket.id)
    })

    socket.on('offerOrAnswer', (data) => {
        for (const [socketID, socket] of connectedPeers.entries()) {
            if (socketID !== data.socketID) {
                console.log(socketID, data.payload.type)
                socket.emit('offerOrAnswer', data.payload)
            }
        }
    })

    socket.on('candidate', (data) => {
        for (const [socketID, socket] of connectedPeers.entries()) {
            if (socketID !== data.socketID) {
                console.log(socketID, data.payload)
                socket.emit('candidate', data.payload)
            }
        }
    })
})