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
process.env.PWD = process.cwd();

console.log(process.env.PWD);

app.use(express.static(path.join(process.env.PWD, 'public')));
app.use(express.static(path.join(process.env.PWD, 'bower_components')));

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
            io.to(socket.id).emit('chat message', '[INFO] you have taken the username: ' + nick);
          } else {
            var prev_nick = users[0].nick;
            users[0].nick = nick;
            users[0].save();
            io.to(socket.id).emit('chat message', '[INFO] you have changed your username from ' + prev_nick + ' to ' + anick);
            console.log('you changed your nick!');
          }
        });
      } else {
        console.log('this nick exists: ' + nick);
        io.to(socket.id).emit('chat message', '[ERROR] that username is taken, you are being defaulted to a randomized id. You may change your nickname by doing \' /nick [nickname] \'');
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
http.listen(process.env.PORT || 5000, function(){
  console.log('listening on whatever port');
});