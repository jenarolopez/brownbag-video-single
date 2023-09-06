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

  socket.on("call user", payload => {
    const { receiverId, roomId, signal } = payload;
    users[roomId] = [socket.id];
    socketToRoom[socket.id] = roomId;
    io.to(receiverId).emit("calling", {roomId, senderId: socket.id, signal})
  })

  socket.on("call answered", payload => {
    const { receiverId, roomId, signal } = payload;
    users[roomId].push(socket.id);
    socketToRoom[socket.id] = roomId;
    io.to(receiverId).emit("call connected", {roomId, senderId: socket.id, signal})
  })

  socket.on("disconnect", ()=> {
    const roomId = socketToRoom[socket.id]
    const roomUsers = users[roomId]
    if(roomUsers) {
      roomUsers.forEach(id => {
        id != socket.id && io.to(id).emit('disconnected user', {socketId: socket.id})
      });
    }
  })
  

})

app.use(cors());
server.listen(8000, () => console.log('server is running on port 8000'));