const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const Filter = require("bad-words");
const {
  getUser,
  removeUser,
  addUser,
  getUsersInRoom
} = require("./utils/users");
const {
  generateMessage,
  generateLocationMessage
} = require("./utils/messages");

const app = express();

// using http to create server is another
// way to set up express server
// we do this bcoz we want server to set up
// socket
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 5000;

const publicDirPath = path.join(__dirname, "../public");
// console.log(publicDirPath);

app.use(express.static(publicDirPath));

// whenever connection event is triggered the function
// in second argument runs,
// connection event is triggered whenever a client is connected.
io.on("connection", socket => {
  console.log("Client is connected");

  socket.on("join", ({ username, room }, callback) => {
    // we will get any one of error or user
    const { error, user } = addUser({ id: socket.id, username, room });
    if (error) {
      return callback(error);
    }
    // socket.join() connects to a particular room.
    socket.join(user.room);

    // socket.join() provides to new functions
    // io.to.emit() which is similar to io.emit but
    // it sends to a particular room only
    // and socket.broadcast.to.emit
    socket.emit("message", generateMessage("Admin", "Welcome!"));
    socket.broadcast
      .to(user.room)
      .emit("message", generateMessage(`${user.username} has joined!`));

    // adding this for list of users
    // and this is done when anyone joins(connect)
    // or anyone leaves(disconnect)
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room)
    });

    // passing callback without any error
    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback("Profanity not allowed!");
    }
    const user = getUser(socket.id);
    if (user) {
      io.to(user.room).emit("message", generateMessage(user.username, message));
      callback("Delivered !");
    }
  });
  // disconnect and connection are build-in events
  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    // using io insted of socket bcoz this particular socket or user is already
    // removed so we can send to all.
    if (user) {
      // using io.to() bcoz we want to send message to particular room only
      io.to(user.room).emit(
        "message",
        generateMessage("Admin", `${user.username} has left!`)
      );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room)
      });
    }
  });
  socket.on("send-location", (location, callback) => {
    const log = location.log;
    const lat = location.lat;
    const user = getUser(socket.id);
    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(
        user.username,
        "https://www.google.com/maps?q=" + lat + "," + log
      )
    );
    callback("Location Shared Successfully!");
  });
});

server.listen(port, () => {
  console.log("App is listening on port " + port);
});
