let username;
let displayPlanets;
let displayStars;
let displayTransparency;
let displayEffects;
let displayParticles;
let conversation, data, datasend, users;

let artificialLatencyDelay = 10;
let socket;

// on load of page
//window.onload = init();

function getUsername(){
  username = document.getElementById("username").value;
  displayPlanets = document.getElementById("planets").checked;
  displayStars = document.getElementById("stars").checked;
  displayTransparency = document.getElementById("transparency").checked;
  displayEffects = document.getElementById("effects").checked;
  displayParticles = document.getElementById("particles").checked;
  console.log(displayPlanets,displayStars,displayTransparency,displayEffects)
  if(username==""){
    alert("Veuillez entrer un pseudo :) !");
  }else{
    
    init();
  }
}

function init() {

  // initialize socket.io client-side
  socket = io.connect();
  

  
  // on connection to server, ask for user's name with an anonymous callback
  socket.on("connect", () => {
    clientStartTimeAtConnection = Date.now();
    // call the server-side function 'adduser' and send one parameter (value of prompt)
    while(username==undefined){}
    socket.emit("adduser", username);
  });



  // update the whole list of players, useful when a player
  // connects or disconnects, we must update the whole list
  socket.on("updatePlayers", (newPlayer) => {
    updatePlayers(newPlayer);
  });

  socket.on("updateWall", (wall) => {
    updateWall(wall);
  });

  socket.on("updatePos", (newPos) => {
    updatePlayerNewPos(newPos);
    //console.log(newPos);
  });

  socket.on("sendBonus", (unBonus) => {
    replaceBonus(unBonus);
    //console.log(newPos);
  });

  socket.on("getReady", () => {
    getReady();
  });

  socket.on("starting", (startTime) => {
    starting(startTime);
  });

  // we start the Game
  socket.on("startGame",(name) =>{
    if(username == name){
      document.getElementById("HOME").style.display = "none";
      document.getElementById("LOADING").style.display = "block";
      document.getElementById("READY").style.display = "none";
      document.getElementById("WAITING").style.display = "none";
      document.getElementById("GAME").style.display = "none";
      startGame();
    }else{
      //restartGame();
    }
  });
}

// PERMET D'ENVOYER SUR WEBSOCKET en simulant une latence (donnée par la valeur de delay)
function send(typeOfMessage, data) {
  setTimeout(() => {
      socket.emit(typeOfMessage, data)
  }, artificialLatencyDelay);
}