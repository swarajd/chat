//include all the dependancies
var express = require('express');
var path = require('path');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongo = require('mongodb');
var mongoose = require('mongoose');

//connect to the database
mongoose.connect('mongodb://localhost:27017/swaraj-chat');
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
app.get('/', function(req, res){
  res.sendFile(__dirname + '\\index.html');
});

//handle all the connections (might move this to a separate file since it's going to get big)
io.on('connection', function(socket){

  //just a regular chat message
  socket.on('chat message', function(msg){
    var formatted_msg;
    //remember to add functionality if it crashes
    User.find({id: socket.id}, function(err, users) {
      if (users.length === 0) {
        formatted_msg = socket.id + ': ' + msg; 
        io.emit('chat message', formatted_msg);
        console.log('message: ' + formatted_msg);
      } else {
        console.log('this guy\'s got a nick!');
        formatted_msg = users[0].nick + ': ' + msg;
        io.emit('chat message', formatted_msg);
        console.log('message: ' + formatted_msg);
      }
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