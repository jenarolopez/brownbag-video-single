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


io.on('connection', socket => {

  socket.emit("me", socket.id);

  
  

})

app.use(cors());
server.listen(8000, () => console.log('server is running on port 8000'));