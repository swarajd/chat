//create a socket
var socket = io();

var path = window.location.pathname;

$(document).ready(function() {

  if (path.length !== 1) {
    var roomname = path.split('/')[2];
    console.log(roomname);
    socket.emit('room join', roomname);
  } else {
    socket.emit('room join', 'home');
  }

  var nick = prompt('enter a nickname');
  socket.emit('set nick', nick);
});

//if the form is submitted, emit an event to be registered serverside
$('form').submit(function(){
  //parse input, will probably implement webpack and move the parsing to another file as well
  var raw_input = $('#m').val();

  if (raw_input.length === 0) {
    return false;
  }

  //not used as of now, but may be used later
  var cmdlib = {
    'nick': 'set nick',
    'default': 'chat message'
  };

  // going to get rid of the if statement through cmdlib, but that's a bit of a ways off
  if (raw_input.substring(0,5) === '/nick') {
    socket.emit('set nick', raw_input.substring(6));
  } else {
    socket.emit('chat message', raw_input);
  }

  $('#m').val('');

  var mydiv = $('#messagediv');
  mydiv.scrollTop(mydiv.prop('scrollHeight') + 50);

  return false; 
});

//when the server emits the same event, append the message to the chat window
socket.on('chat message', function(msg){
  $('#messages').append($('<li>').text(msg));
});