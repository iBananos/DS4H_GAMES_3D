let canvas;
let engine;
let scene;
let timeStart ;
let inputStates = {};
let walls = [];
let pause = false;
let pausefired = false;
let nbWall = 0;
let cursorPlayer;
let music;
let bonus = [];
let gameWantReady = true ;
let bonusPos = [];
let missileCast = false ;
let missiles;
let escapeReleased = true;
let tron;
let listEnemis = [];
let listUsernameEnemis = [];
let currentDate;
let nbEnnemis = 0;
let answeredReady = false;
let timeToStart =Date.now()+20000;
let colorList = [
    {'r':255,'g':0,'b':0},
    {'r':0,'g':255,'b':0},
    {'r':0,'g':0,'b':255},
    {'r':255,'g':255,'b':0}
]



// méthode globale au jeu 
function startGame() {
    let canvasJeu = document.getElementById("myCanvas");
    engine = new BABYLON.Engine(canvasJeu, true);
    scene = createScene();
    modifySettings();
    let lastDateWall = Date.now();
    let lastDateMove = Date.now();
    let cameraset  = false ;
    let alpha = 0;
    engine.runRenderLoop(() => {
        currentDate = Date.now();
        // SI LE JEU DEMANDE D'ÊTRE PRET
        if(gameWantReady){
            let deltaTime = engine.getDeltaTime(); 
            let tron = scene.getMeshByName("tron");

            // SI LE TRON EST PRET
            if(tron){

                // SI LA CAMERA N'EST PAS ENCORE CONFIGUREE
                if(!cameraset){
                    let followCamera = createFollowCamera(scene, tron);
                    let cameraMap = createCameraMap(scene);
                    scene.activeCamera = followCamera;
                    scene.activeCameras.push(followCamera);
                    scene.activeCameras.push(cameraMap);
                    cameraMap.layerMask = 1;
                    followCamera.layerMask = 2;
                    cameraset = true;
                    timeStart = Date.now();
                }
                // SI TOUT EST PRET DEMANDER AU JOUEUR DE SIGNALER QU'IL EST PRET
                else{
                    if(!answeredReady){ 
                        askReady();
                    }
                }
            }
        // SI LA PARTIE EST EN COURS
        }else{
            let tempsRestant = timeToStart-Date.now();
            // SI LA PARTIE VA BIENTOT COMMENCER AFFICHE LE TIMER
            if(tempsRestant>0){
                printTIMEOUT(tempsRestant);
                document.getElementById("TIMEOUT").style.display = "block";
            }
            // SI LE TIMER EST TERMINE ALORS DEBUT DE LA PARTIE 
            else{
                document.getElementById("TIMEOUT").style.display = "none";
                engine.resize();
                let deltaTime = engine.getDeltaTime(); 
                let tron = scene.getMeshByName("tron");
                // MOUVEMENT MISSILE
                if(missileCast){
                    missiles.move(deltaTime);
                }
                // MOUVEMENT TRON
                tron.move(deltaTime,inputStates,walls,bonus);    
                // MOUVEMENT CURSEUR   
                moveCursor(tron);

                lastDateMove=currentDate;
                // SI IL Y EN A, BOUGE LES PLANETES 
                if(displayPlanets){moveAllPlanet(alpha);}
                    alpha += 0.001;
                // CREER UN MUR AU MOINS TOUTE LES 300ms
                if(currentDate-lastDateWall > 300){
                    tron.wall(scene,inputStates);
                    lastDateWall=currentDate;
                    printFPS(deltaTime);            
                }
                // CHECK SI IL Y A DES BONUS A RECREE
                checkBonus(scene);
                // BOUGE TOUT LES BONUS 
                moveAllBonus();
                // AFFICHE LE SCORE
                printScore(tron, currentDate);
            }       
        }
        scene.render()
    });
}

// AFFICHE LA PAGE READY 
function askReady(){
    document.getElementById("HOME").style.display = "none";
    document.getElementById("LOADING").style.display = "none";
    document.getElementById("READY").style.display = "block";
    document.getElementById("WAITING").style.display = "none";
    document.getElementById("GAME").style.display = "none";
}

// ENVOIE AU SERVEUR 'READY'
function ready(){
    send("ready",{'username' : username});
    answeredReady= true;
    document.getElementById("HOME").style.display = "none";
    document.getElementById("LOADING").style.display = "none";
    document.getElementById("READY").style.display = "none";
    document.getElementById("WAITING").style.display = "block";
    document.getElementById("GAME").style.display = "none";
}

// CHECK LES BONUS 
function checkBonus(scene){
    for(let i = 0 ; i < 5 ; i++){
        if(bonus[i] == undefined){
            if(bonusPos[i]!= undefined){
                bonus[i] = createBonus(scene,bonusPos[i]);
            }
        }
    }
}

// CREER LA SCENE
function createScene() {
    canvas = document.querySelector("#myCanvas");
    let scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0, 0, 0);
    music = new BABYLON.Sound("Music", "musique/Background.wav", scene, null, {
        loop: true,
        autoplay: true,
        volume : 0.1
    });
    let camera = createFreeCamera(scene);
    for(let i = 0 ; i < 5 ; i++){
        if(bonusPos[i]!=undefined){
            bonus[i] = createBonus(scene,bonusPos[i]);
        } 
    }
    


    createMAP(scene);
    return scene;

}

// SUPPRIME TOUT LES MURS & RESET LE TIMER
function reset(){
    for(let i = 0 ; i < walls.length ; i++){
        if(walls[i]!=undefined){
           walls[i].dispose();
        }
    }
    walls = [];
    timeStart = Date.now();
}

// CONSTRUIT UN NOUVEAU MUR (VENANT SOIT DU JOUEUR SOIT D'UN AUTRE) 
function createWall(scene, fromX, fromZ, toX, toZ, mine, color){
    // calcul de la longueur du mur
    let diffX = toX-fromX;
    let diffZ = toZ-fromZ;
    nbWall ++;
    let longueur = Math.pow((Math.pow(diffX,2) + Math.pow(diffZ,2)),0.5);
    // calcul de la rotation du mur
    let angle = Math.acos(diffX/longueur);
    if(diffZ > 0 ){
        angle = -angle;
    }
    // crée le mur 
    let wall = BABYLON.MeshBuilder.CreateBox(toString(nbWall), { width:longueur, height:5, size : 2}, scene);
    wall.position = new BABYLON.Vector3(fromX+(diffX / 2)  , 2, fromZ +(diffZ / 2)); 
    wall.rotation.y = angle;
    if(displayTransparency){ wall.visibility = 0.5;}
    let WallMaterial = new BABYLON.StandardMaterial("wallMaterial", scene);
    WallMaterial.diffuseColor  = new BABYLON.Color3(colorList[color].r,colorList[color].g,colorList[color].b);
    wall.material = WallMaterial
    walls[nbWall] = wall;
    // si le mur est celui du joueur alors il envoie les datas du mur au serveur  
    if(mine) {send("wall",{'username':username,'fromX' : fromX,'fromZ':fromZ, 'toX' : toX,'toZ' : toZ , 'color' : color});}
}

// crée un missile pour détruire les murs 
function createMissile(scene,from,tron){
    let missile = BABYLON.MeshBuilder.CreateBox("missile", { width:0.5, height:1, size : 20 }, scene);
    missile.frontVector = tron.frontVector;
    missile.position = new BABYLON.Vector3(from.x, 4, from.z); 

    missile.rotation.y = tron.rotation.y;
    let missileMaterial = new BABYLON.StandardMaterial("missileMaterial", scene);
    missileMaterial.diffuseColor  = new BABYLON.Color3.Yellow;
    missileMaterial.emissiveColor = new BABYLON.Color3.Yellow;
    missileMaterial.intensity = 5;
    missile.material = missileMaterial
    missile.speed = 0.2 ;
    
    // permet le mouvement du missile
    missile.move = (deltaTime) => {
        missile.moveWithCollisions(missile.frontVector.multiplyByFloats(missile.speed*deltaTime, missile.speed*deltaTime, missile.speed*deltaTime));
        destructWall(missile);
    }
    missileCast = true ;
    missiles = missile;
}

// permet de détruire les murs sur le chemin du missile 
function destructWall(){
    if((missiles.position.x > 197) || (missiles.position.z > 207) || (missiles.position.x < -197) || (missiles.position.z < -207)){
        missiles.dispose();
        missileCast = false ;
        return;
    }
    for(let i = 0 ; i < walls.length ; i++){
        if(walls[i]!=undefined){
            if(missiles.intersectsMesh(walls[i],true)){
                walls[i].dispose();
                walls[i] = undefined ;
                return;
            }
        }
    }
}

// méthode anciennement utilisée pour créer des murs arc-en-ciel
// aujourd'hui plus utilisé mais potentiellement pour une future mise à jour lors d'un gain de bonus
function createRainbowRGB(x){
    x = (x*50)%1530;
    let rouge;
    let vert;
    let bleu;
    if(x<255){
        rouge = 1;
        vert = x/255;
        bleu = 0;
    }else if(x<510){
        rouge = (510-x) / 255;
        vert = 1;
        bleu = 0;
    }else if(x<765){
        rouge = 0;
        vert = 1;
        bleu = (x-510)/255;
    }else if(x<1020){
        rouge = 0;
        vert = (1020-x) / 255;
        bleu = 1;
    }else if(x<1275){
        rouge =  (x-1020) / 255;
        vert = 0;
        bleu = 1;
    }else{
        rouge = 1;
        vert = 0;
        bleu = (1530-x)/255;
    }
    return [rouge , vert , bleu];
}

// créer un bonus sur la map 
function createBonus(scene,position){
    let height = 1;
    let diameter = 10 ;
    let tessellation = 32 ;
    let subdivisions = 1 ;
    let updatable = true ;
    const bonus = BABYLON.Mesh.CreateCylinder("cylinder", height, diameter, diameter, tessellation, subdivisions, scene, updatable); 
    bonus.position = new BABYLON.Vector3(position.x,position.y,position.z);
    bonus.rotation.x = -Math.PI/2;

    // permet de faire tourner le bonus pour l'animer
    bonus.move = (position) => {
        bonus.rotation.y += 0.05 ;
        bonus.position = new BABYLON.Vector3(position.x,position.y,position.z);
    }
    let bonusMaterial = new BABYLON.StandardMaterial("BonusMaterial", scene);
    bonusMaterial.diffuseTexture  = new BABYLON.Texture("images/STAR.png");
    bonus.material = bonusMaterial
    return bonus;
}

// bouge tous les bonus
function moveAllBonus(){
    for(let i = 0 ; i < bonus.length ; i++){
        if(bonus[i]!=undefined){
        bonus[i].move(bonusPos[i]);
        }
    }
}

// bouge le curseur du joueur
function moveCursor(tron){
    cursorPlayer.position.x = tron.position.x;
    cursorPlayer.position.z = tron.position.z;
}

// crée un curseur qui permet au joueur d'être mieu vu sur la map
function createCursor(tron){
    cursorPlayer = BABYLON.MeshBuilder.CreateSphere("cursor", {diameter: 5, segments: 32} , scene);
    cursorPlayer.position.x = tron.position.x;
    cursorPlayer.position.y = 100;
    cursorPlayer.position.z = tron.position.z;
}

// crée une camera libre
function createFreeCamera(scene) {
    let camera = new BABYLON.FreeCamera("freeCamera", new BABYLON.Vector3(0, 320, 0), scene);
    camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
    camera.setTarget(new BABYLON.Vector3(0,2,0));
    camera.orthoTop = 1500;
    camera.orthoBottom = -1500;
    camera.orthoLeft = -2000;
    camera.orthoRight = 2000;
    camera.checkCollisions = false; 
    camera.applyGravity = false;
    return camera;
}

// crée la camera de la mini-map en bas à gauche 
function createCameraMap(scene) {
    let camera = new BABYLON.FreeCamera("cameraMap", new BABYLON.Vector3(0, 100, 0), scene);
    camera.layerMask = 1;
    camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
    camera.setTarget(new BABYLON.Vector3(0,2,0));
    camera.orthoTop = 200;
    camera.orthoBottom = -200;
    camera.orthoLeft = -200;
    camera.orthoRight = 200;
    camera.fov = 1;
    camera.viewport = new BABYLON.Viewport(0.015,0.025,0.20,0.35); // (merci Delkatosh)
    camera.renderingGroupId = 1;
    return camera;
}

// crée la follow camera qui suivra le joueur 
function createFollowCamera(scene, target) {
    let camera = new BABYLON.FollowCamera("tronFollowCamera", target.position, scene, target);

    camera.radius = 30; // how far from the object to follow
	camera.heightOffset = 10; // how high above the object to place the camera
	camera.rotationOffset = 180; // the viewing angle
	camera.cameraAcceleration = 0.5; // how fast to move
	camera.maxCameraSpeed = 100; // speed limit 
    camera.fov = 1;
    return camera;
}

// resize en cas de mouvement de la fenêtre
window.addEventListener("resize", () => {
    engine.resize()
});

// modifie les paramètres de la fenetre et des inputs
function modifySettings() {
    // as soon as we click on the game window, the mouse pointer is "locked"
    // you will have to press ESC to unlock it
    scene.onPointerDown = () => {
        if(!scene.alreadyLocked) {
            console.log("requesting pointer lock");
            canvas.requestPointerLock();
        } else {
            console.log("Pointer already locked");
        }
    }

    document.addEventListener("pointerlockchange", () => {
        let element = document.pointerLockElement || null;
        if(element) {
            // lets create a custom attribute
            scene.alreadyLocked = true;
        } else {
            scene.alreadyLocked = false;
        }
    })

    // key listeners for the tron
    inputStates.left = false;
    inputStates.right = false;
    inputStates.up = false;
    inputStates.down = false;
    inputStates.space = false;
    inputStates.escape = false;
    
    //add the listener to the main, window object, and update the states
    window.addEventListener('keydown', (event) => {
        if ((event.key === "ArrowLeft") || (event.key === "q")|| (event.key === "Q")) {
           inputStates.left = true;
        } else if ((event.key === "ArrowUp") || (event.key === "z")|| (event.key === "Z")){
           inputStates.up = true;
        } else if ((event.key === "ArrowRight") || (event.key === "d")|| (event.key === "D")){
           inputStates.right = true;
        } else if ((event.key === "ArrowDown")|| (event.key === "s")|| (event.key === "S")) {
           inputStates.down = true;
        }  else if (event.key === " ") {
           inputStates.space = true;
        }  else if (event.key === "Escape") {
           inputStates.escape = true;
         }
    }, false);

    //if the key will be released, change the states object 
    window.addEventListener('keyup', (event) => {
        if ((event.key === "ArrowLeft") || (event.key === "q")|| (event.key === "Q")) {
           inputStates.left = false;
        } else if ((event.key === "ArrowUp") || (event.key === "z")|| (event.key === "Z")){
           inputStates.up = false;
        } else if ((event.key === "ArrowRight") || (event.key === "d")|| (event.key === "D")){
           inputStates.right = false;
        } else if ((event.key === "ArrowDown")|| (event.key === "s")|| (event.key === "S")) {
           inputStates.down = false;
        }  else if (event.key === " ") {
           inputStates.space = false;
        }  else if (event.key === "Escape") {
           inputStates.escape = false;
           escapeReleased = true ;
        }
    }, false);
}

// affiche les FPS
function printFPS(deltaTime){
    let FPS = document.querySelector("#FPS");
    FPS.innerHTML =  engine.getFps().toFixed();
}

// affiche le score
function printScore(tron, date){
    let scorehtml = document.querySelector("#score");
    tron.score = (date - timeStart) /1000;
    scorehtml.innerHTML = tron.score;
}

// affiche le compteur à rebours
function printTIMEOUT(timeleft){
    let temps = document.querySelector("#COOLDOWN");
    let tmps = Math.floor(timeleft/1000);
    if(tmps == 0){
        temps.innerHTML = ' GO !';
    }else{
        temps.innerHTML = tmps;
    }
    
}


//////////////////////////////////////  CONNEXION SERVEUR //////////////////////////////////////////////

// ajout d'un mur 
function updateWall(newWall){
    if(newWall.username != username){
        createWall(scene,newWall.fromX,newWall.fromZ,newWall.toX , newWall.toZ, false,newWall.color);
    }
}

// bouge un joueur ennemi
function updatePlayerNewPos(newPos){
    if(listEnemis[newPos.username]!=undefined){
        listEnemis[newPos.username].move(newPos.x,newPos.y,newPos.z)
    }else if(username!=newPos.username){
        updatePlayers(newPos);
    }
}

// crée un tron (soit celui du joueur soit celui d'un ennemis)
function updatePlayers(newPlayer){
    if(newPlayer.username == username){
        let tron = createTron(scene,newPlayer.x,newPlayer.y,newPlayer.z,newPlayer.orientation,newPlayer.color);
    }else{
        console.log("new ennemi : ",newPlayer)
        let tron = scene.getMeshByName("tron");
        resetTron(tron,true);
        listEnemis[newPlayer.username] = createEnemie(scene,newPlayer.username,newPlayer.x,newPlayer.y,newPlayer.z,newPlayer.orientation,newPlayer.color);
    }
}

// remplace un bonus lorsqu'un est pris 
function replaceBonus(unBonus){
    if(bonus){
        if(bonus[unBonus.numBonus]!=undefined){
            bonus[unBonus.numBonus].dispose();
            delete bonus[unBonus.numBonus];
        }
    }
    bonusPos[unBonus.numBonus] = unBonus.position;
}

// le serveur veut que le client soit prêt avant de débuter la partie
function getReady(){
    gameWantReady = true ;
    answeredReady = false;
    let tron = scene.getMeshByName("tron");
    document.getElementById("HOME").style.display = "none";
    if(tron){
        resetTron(tron,true);
        document.getElementById("LOADING").style.display = "none";
        document.getElementById("READY").style.display = "block";
    }else{
        document.getElementById("LOADING").style.display = "block";
        document.getElementById("READY").style.display = "none";
    }
    document.getElementById("WAITING").style.display = "none";
    document.getElementById("GAME").style.display = "none";
 
}

// affiche le jeu une fois que le serveur le demande
function starting(start){
    document.getElementById("HOME").style.display = "none";
    document.getElementById("LOADING").style.display = "none";
    document.getElementById("READY").style.display = "none";
    document.getElementById("WAITING").style.display = "none";
    document.getElementById("GAME").style.display = "block";
    gameWantReady = false ;
    let tron = scene.getMeshByName("tron");
    if(tron){
        resetTron(tron,true);
    }
    timeToStart = start;
}

// supprime un enemis si il se déconnecte
function deleteTron(name){
    let enemis = scene.getMeshByName(name);
    //enemis.dispose();
    delete listEnemis[name];
}