

class Obstacle {
    constructor(Xi, Yi, Xtaille, Ytaille, vitesseX, vitesseY,color,id) {
        this.x = Xi;
        this.y = Yi;
        this.Xtaille = Xtaille;
        this.Ytaille = Ytaille;
        this.vitesseX = vitesseX;
        this.vitesseY = vitesseY;
        this.color = color;
		this.id = id;
    }
}
let playersPosStart = [{'x' : 190, 'z' :0, 'orientation' : -Math.PI/2,'color':0},{'x' : 0, 'z' :190, 'orientation' : Math.PI,'color':1},{'x' : -190, 'z' :0, 'orientation' : Math.PI/2,'color':2},{'x' : 0, 'z' :-190, 'orientation' : 0,'color':3}]

class Player {
    constructor(id, name) {
        this.x = playersPosStart[id%4].x;
        this.y = 3;
		this.z = playersPosStart[id%4].z;
		this.orientation = playersPosStart[id%4].orientation;
		this.id = id;
        this.name = name;
		this.points = 0;
		this.color = playersPosStart[id%4].color;
		this.ready = false;
    }
}

const express = require('express')
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

http.listen(8082, () => {
	console.log("Web server écoute sur http://localhost:8082");
})

// Indicate where static files are located. Without this, no external js file, no css...  
app.use(express.static(__dirname));    


// routing
app.get('/', (req, res) => {
  res.sendFile(__dirname + 'index.html');
});

// nom des joueurs connectés sur le chat
var playerNames = {};
var numbPlayer = 0;
var nbPlayerConnected = 0;
var listOfPlayers = {};
var listOfObstacles = {};
var listOfPositions= {};
var nbWall =0;
var bonus = [];
var time =Date.now();
var oldTime = time;
var nbUpdatesPerSeconds = 100;
var calculHeartbeat = 20;
var gameRestarting = true ;
var playersReady = 0;

function createAllBonus(){
	for(let i = 0 ; i < 5 ; i++){
        bonus[i] = createBonus();
		io.emit('sendBonus', {'numBonus' : i , 'position' : bonus[i]});
    }
}

function createBonus(){
    let pos = Math.floor(Math.random() * 199);  
    let rad = Math.floor(Math.random() * 360) * Math.PI/180;  
    let position = {'x': pos*Math.sin(rad),'y':6,'z':pos*Math.cos(rad)};
    return position;
}



function deleteBonus(i){
	bonus[i]=createBonus();
	io.emit('sendBonus', {'numBonus' : i , 'position' : bonus[i]});

}

/*
//reset la game
function resetGame(){
	resetAllPos();
}

//reset les positions des joueurs
function resetAllPos(){
	for(let player in listOfPlayers)  {
		listOfPlayers[player].x = playersPosStart[listOfPlayers[player].id%4].x; 
		listOfPlayers[player].y = 3 ;
        listOfPlayers[player].z = playersPosStart[listOfPlayers[player].id%4].z; 
		io.emit('collapse',{'username' : player ,  'x' : listOfPlayers[player].x, 'y' : listOfPlayers[player].y, 'z' : listOfPlayers[player].z });
	}
}
*/



// LES CONNEXIONS ET ENVOIS DE DONNEE AUX CLIENTS

io.on('connection', (socket) => {
    // RECUPERE LES POSITIONS ET LES REENVOIS AUX JOUEURS
    socket.on('sendpos', (data) => {
        io.emit('updatePos', {"username" : data.username , 'x':data.x , 'y' : data.y , 'z':data.z,'orientation' : data.orientation,'color' : data.color });
	});

    // RECUPERE UN MUR ET LE REENVOI AUX JOUEURS
    socket.on('wall', (data) => {
        nbWall ++;
        io.emit('updateWall', data);
	});

	socket.on('deleteBonus', (i) => {
		deleteBonus(i);
	});

	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', (username) => {
		socket.username = username;
		playerNames[username] = username;
		console.log( socket.username ,' has connected !')
		io.emit('updateusers', playerNames);
		var player = new Player(numbPlayer,username);
		numbPlayer += 1;
		nbPlayerConnected ++;
		listOfPlayers[username] = player;
		createAllBonus();
		io.emit('startGame',username);
		console.log( 'Asking to get Ready to players !')
		io.emit('getReady',);
		gameRestarting = true;
		io.emit('updatePlayers',{'username' : username , 'x' : player.x,'y' : player.y,'z' : player.z ,'orientation' : player.orientation,'color' : player.color});
		//resetGame();
	});

	socket.on('ready',(data) => {
		console.log( data.username, ' is READY !')
		listOfPlayers[data.username].ready = true ;
		playersReady ++;
	});

	socket.on('gameEnded',(data) => {
		gameRestarting = true;
		console.log( data.username, ' has ended the game !')
		io.emit('getReady');
		console.log( 'Asking to get Ready to players !')
	});

	// when the user disconnects.. perform this
	socket.on('disconnect', () => {
		// remove the username from global usernames list
		delete playerNames[socket.username];
		console.log( socket.username ,' has disconnected !')
				// update list of users in chat, client-side
		//io.emit('updateusers', playerNames);
		nbPlayerConnected-- ;
		// Remove the player too
		delete listOfPlayers[socket.username];		
		//io.emit('updatePlayers',listOfPlayers);
	});
});

function checkEveryoneReady(){
	console.log(playersReady,'/',nbPlayerConnected,' players ready');
	if(playersReady>=nbPlayerConnected){
		let timeStart = Date.now()+5000; 
		io.emit('starting',timeStart);
		console.log('EVERYONE READY !');
		playersReady = 0;
		gameRestarting = false ;
	}
}

function timer(currentTime) {
	var delta = currentTime - oldTime;
	oldTime = currentTime;
	return delta/1000;
}

setInterval(()=> {
	time = Date.now();
	delta = timer(time);
	if(gameRestarting){
		checkEveryoneReady();
	}
},calculHeartbeat);

