var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var escape = require('escape-html');

app.get('/', function(req, res){
  res.sendfile('index.html');
});

app.use(express.static('public'));


http.listen(3000, function(){
  console.log('listening on *:3000');
});

var rooms = [];
var Room = function (id, teamsEnabled) {
  this.id = id;
  this.teamsEnabled = teamsEnabled;
  this.number = generateRoomNumber();
  this.players={};
  this.buzzed=[];
};


io.on('connection', function(socket){
  socket.on('host', function(data){
    var room = new Room(socket.id,false);
    rooms.push(room);
    socket.emit('number', room.number);
  });
  socket.on('join', function(data){
    var room = rooms.filter(
      function(item){
        return item.number == data.number;
      })[0];
    socket.join(room.id);
    room.players[socket.id]=escape(data.name);
    io.to(socket.id).emit('name',room.players[socket.id])
  });
  socket.on('buzz', function(data){
    var room = rooms.filter(
      function(item){
        return (socket.id in item.players)
      })[0];
    if(room.buzzed.indexOf(socket.id) != -1){
      return false;
    }
    io.to(room.id).emit('buzz', room.players[socket.id]);
    room.buzzed.push(socket.id);
  });
  socket.on('reset', function(data){
    var room = rooms.filter(
      function(item){
        return (socket.id==item.id)
      })[0];
    if (room == undefined){
      return false;
    }
    room.buzzed=[];
    io.to(room.id).emit('reset',{});
  });
});

function generateRoomNumber () {
  var num = "";
  for(var i=0; i<6; i++){
    num += Math.floor(Math.random() * 10).toString();
  }
  return num;
}

