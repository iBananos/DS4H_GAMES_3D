// ICI UNE VERSION TRES BASIQUE ET NAIVE D'UN SERVEUR POUR LE MULTIJOUEUR DE TRONFEVER


// Données des joueurs en fonction de leur ordre d'arrivé
let playersPosStart = [{'x' : 190, 'z' :0, 'orientation' : -Math.PI/2,'color':0},{'x' : 0, 'z' :190, 'orientation' : Math.PI,'color':1},{'x' : -190, 'z' :0, 'orientation' : Math.PI/2,'color':2},{'x' : 0, 'z' :-190, 'orientation' : 0,'color':3}]

// Classe joueur
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

// Paramètre serveur 
const express = require('express')
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT  || 8082


http.listen(PORT, () => {
	console.log("Web server écoute sur le port : " , PORT);
});

// Indicate where static files are located. Without this, no external js file, no css...  
app.use(express.static(__dirname));    



// routing
app.get('/', (req, res) => {
  res.sendFile(__dirname + 'index.html');
}); 


app.get('/socket.io/socket.io.js', (req, res) => {
	res.sendFile(__dirname + 'socket.io/socket.io.js');
  }); 

// Datas du serveur pour la gestion de la partie et des connexions 
var playerNames = {};
var numbPlayer = 0;
var nbPlayerConnected = 0;
var listOfPlayers = {};
var nbWall =0;
var bonus = [];
var time =Date.now();
var oldTime = time;
var calculHeartbeat = 20;
var gameRestarting = true ;
var playersReady = 0;
var playerInGame = 0;

// Création de tout les bonus 
function createAllBonus(){
	for(let i = 0 ; i < 5 ; i++){
        bonus[i] = createBonus();
		io.emit('sendBonus', {'numBonus' : i , 'position' : bonus[i]});
    }
}

// Création d'un bonus 
function createBonus(){
    let pos = Math.floor(Math.random() * 199);  
    let rad = Math.floor(Math.random() * 360) * Math.PI/180;  
    let position = {'x': pos*Math.sin(rad),'y':6,'z':pos*Math.cos(rad)};
    return position;
}

// Recrée un bonus et l'envoie aux clients 
function deleteBonus(i){
	bonus[i]=createBonus();
	io.emit('sendBonus', {'numBonus' : i , 'position' : bonus[i]});
}

// LES CONNEXIONS ET ENVOIS DE DONNEES AUX CLIENTS
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

	// RECUPERE LE BONUS A RECREER
	socket.on('deleteBonus', (i) => {
		deleteBonus(i);
	});


	// AJOUTE UN JOUEUR ET ENVOIS SES DATAS AUX AUTRES CLIENTS
	socket.on('adduser', (username) => {
		socket.username = username;
		playerNames[username] = username;
		console.log( socket.username ,' has connected !')
		io.emit('updateusers', playerNames);
		socket.emit('updatechat', 'SERVER', 'you have connected');
		socket.broadcast.emit('updatechat', 'SERVER', username + ' has connected');
		var player = new Player(numbPlayer,username);
		numbPlayer += 1;
		nbPlayerConnected ++;
		listOfPlayers[username] = player;
		createAllBonus();
		io.emit('startGame',username);
		console.log( 'Asking to get Ready to players !')
		playersReady=0;
		io.emit('getReady',);
		gameRestarting = true;
		io.emit('updatePlayers',{'username' : username , 'x' : player.x,'y' : player.y,'z' : player.z ,'orientation' : player.orientation,'color' : player.color});
	});

	// UN JOUEUR EST READY
	socket.on('ready',(data) => {
		console.log( data.username, ' is READY !')
		io.emit('updatechat', 'SERVER', socket.username + ' is READY !');
		listOfPlayers[data.username].ready = true ;
		playersReady ++;
		io.emit('updatechat', 'SERVER',  playersReady+'/'+nbPlayerConnected+' players ready');
		console.log(playersReady,'/',nbPlayerConnected,' players ready');
	});

	// UN JOUEUR A PERDU, CHECK SI IL RESTE UN JOUEUR EN JEU 
	socket.on('gameEnded',(data) => {
		gameRestarting = true;
		console.log( data.username, ' has ended the game !')
		playerInGame--;
		io.emit('updatechat', 'SERVER', socket.username + ' lost with : ' + data.points + ' points.');
		if(playerInGame<=0){
			io.emit('getReady');
		
			console.log( 'Asking to get Ready to players !')
			console.log(playersReady,'/',nbPlayerConnected,' players ready');
		}else{ 
			console.log("Game still running");
		}
		
	});

	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', (data) => {
		// we tell the client to execute 'updatechat' with 2 parameters
		io.sockets.emit('updatechat', socket.username, data);
	});


	// when the user disconnects.. perform this
	socket.on('disconnect', () => {
		// remove the username from global usernames list
		delete playerNames[socket.username];
		console.log( socket.username ,' has disconnected !')
		gameRestarting = true;
		// update list of users in chat, client-side
		io.emit('updateusers', playerNames);	
		io.emit('disposeTron', socket.username);
		nbPlayerConnected-- ;
		// Remove the player too
		delete listOfPlayers[socket.username];		
		io.emit('updatePlayers',listOfPlayers);
		if(nbPlayerConnected>0){
			playersReady=0;
			playerInGame=0;
			io.emit('getReady');
			console.log( 'Asking to get Ready to players !');
			
			console.log(playersReady,'/',nbPlayerConnected,' players ready');
			
		} 
		// echo globally that this client has left
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
	});
});

// CHECK SI TOUT LE MONDE EST PRET AVANT DE LANCER LA PARTIE 
function checkEveryoneReady(){
	
	if(playersReady>=nbPlayerConnected){
		let timeStart = Date.now()+20000; 
		io.emit('starting',timeStart);
		playerInGame = playersReady;
		console.log('EVERYONE READY !');
		playersReady = 0;
		gameRestarting = false ;
	}
}

// UN TIMER
function timer(currentTime) {
	var delta = currentTime - oldTime;
	oldTime = currentTime;
	return delta/1000;
}

// BOUCLE SERVEUR
setInterval(()=> {
	time = Date.now();
	delta = timer(time);
	if(gameRestarting){
		checkEveryoneReady();
	}
},calculHeartbeat);

