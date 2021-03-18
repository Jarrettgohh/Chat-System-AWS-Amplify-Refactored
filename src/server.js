const express = require("express");
const http = require("http");
const socketio = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// CHANGED SERVERT TO BACKEND FOLDER

io.on("connection", (socket) => {
  socket.emit("newId", socket.id);

  socket.on("join_chat", (userObject) => {
    socket.name = userObject.name;

    io.emit("joined_chat", {
      message: `${socket.name} has joined the chat :)`,
      id: socket.id,
    });
  });

  socket.on("disconnect", () => {
    io.emit("left_chat", {
      message: `${socket.name} has left the chat :(`,
      id: socket.id,
    });
  });

  socket.on("sendMessage", (messageObject) => {
    io.emit("receiveMessage", {
      message: `${messageObject.name}: ${messageObject.message}`,
      id: socket.id,
    });
  });
});

const port = 4000;
server.listen(port, () => console.log(`Listening on port ${port}...`));
