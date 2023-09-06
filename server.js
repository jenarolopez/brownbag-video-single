const express = require('express')
const http = require("http");
const socket = require("socket.io");
const cors = require("cors");



const app = express();
const server = http.createServer(app);

const io = socket(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const users = {}
const socketToRoom = {}

io.on('connection', socket => {

  socket.emit("me", socket.id);

  socket.on('call user', payload => {
    const { receiverId, roomId, signal} = payload
    users[payload.roomId] = [socket.id]
    socketToRoom[socket.id] = payload.roomId;
    io.to(receiverId).emit('calling', { roomId: roomId, senderId: socket.id, signal })
  })

  socket.on('call answered', (payload)=> {
    users[payload.roomId].push(socket.id);
    socketToRoom[socket.id] = payload.roomId;
    console.log(users[payload.roomId])
    io.to(payload.receiverId).emit('call connected', payload )
  })

  socket.on('disconnect', () => {
    const roomId = socketToRoom[socket.id];
    let room = users[roomId]
    if(room) {
      room.forEach(id => {
        if(id != socket.id) {
          io.to(id).emit('disconnected user', { socketId: socket.id })
        }
      });
    }
  })
  

})

app.use(cors());
server.listen(8000, () => console.log('server is running on port 8000'));