//include all the dependancies
var express = require('express');
var path = require('path');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongo = require('mongodb');
var mongoose = require('mongoose');

//going to be using jade
app.set('view engine', 'jade');

//connect to the database
var mongoURI = 'mongodb://swaraj-chatdb:swaraj-chatdb-pass@ds043971.mongolab.com:43971/chatdb';
var mongoDB = mongoose.connect(mongoURI).connection;

mongoDB.on('error', function(err) {
  console.log(err.message);
  console.log('THIS DIDN\'T WORK');
});

mongoDB.once('open', function() {
  console.log("mongodb connection open");
});

var db = mongoose.connection;

var userSchema = mongoose.Schema({
  nick: String,
  id: String
});

var User = mongoose.model('User', userSchema);

// include public assets
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));

//serve the main page
app.get('/', function(req, res) {
  res.render('index', {chatroom: 'home'});
});

app.get('/room/:roomname', function(req, res) {
  res.render('room', {chatroom: req.params.roomname});
});

//handle all the connections (might move this to a separate file since it's going to get big)
io.on('connection', function(socket){

  socket.on('room join', function(roomname) {
    console.log(roomname + ' is being joined');
    socket.join(roomname);
  });

  //just a regular chat message
  socket.on('chat message', function(msg){

    var socket_room = socket.rooms[1];
    console.log(socket_room);

    if (socket.rooms.length === 2) {
      console.log('this guy is in a room');
    }

    var formatted_msg;
    //remember to add functionality if it crashes
    User.find({id: socket.id}, function(err, users) {
      if (users.length === 0) {
        formatted_msg = socket.id + ': ' + msg; 
      } else {
        console.log('this guy\'s got a nick!');
        formatted_msg = users[0].nick + ': ' + msg;
      }

      io.to(socket_room).emit('chat message', formatted_msg);

      console.log('message: ' + formatted_msg);
    });
    
  });

  //the user is trying to set his nick
  socket.on('set nick', function(nick) {
    //remember to add functionality if it crashes
    User.find({nick: nick}, function(err, users){
      if (users.length === 0) {
        User.find({id: socket.id}, function(err, users) {
          if (users.length === 0) {
            var tempuser = new User({
              id: socket.id,
              nick: nick,
            });
            tempuser.save();
            console.log('this nick is now taken by you!');
          } else {
            users[0].nick = nick;
            users[0].save();
            console.log('you changed your nick!');
          }
        });
      } else {
        console.log('this nick exists: ' + nick);
      }
    });
    console.log('tryna set a nick: ' + nick);
  });


  //actions to take if the user disconnects
  socket.on('disconnect', function() {
    console.log('a user disconnected');
    User.find({
      id: socket.id,
    }).remove(function() {
      console.log('going to free up this nick');
    });
  });

});


//serve the project
http.listen(3000, function(){
  console.log('listening on *:3000');
});