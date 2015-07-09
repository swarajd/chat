//create a socket
var socket = io();

//if the form is submitted, emit an event to be registered serverside
$('form').submit(function(){
  //parse input, will probably implement webpack and move the parsing to another file as well
  var raw_input = $('#m').val();

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
  return false; 
});

//when the server emits the same event, append the message to the chat window
socket.on('chat message', function(msg){
  $('#messages').append($('<li>').text(msg));
});