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

                // SI LA CAMERA N'EST PAS SET
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
            if(tempsRestant>0){
                printTIMEOUT(tempsRestant);
                document.getElementById("TIMEOUT").style.display = "block";
            }else{
                document.getElementById("TIMEOUT").style.display = "none";
                let deltaTime = engine.getDeltaTime(); 
                let tron = scene.getMeshByName("tron");
                if(missileCast){
                    missiles.move(deltaTime);
                }
                tron.move(deltaTime,inputStates,walls,bonus);       
                moveCursor(tron);
                lastDateMove=currentDate;
                if(displayPlanets){moveAllPlanet(alpha);}
                    alpha += 0.001;
                if(currentDate-lastDateWall > 300){
                    tron.wall(scene,inputStates);
                    lastDateWall=currentDate;
                    printFPS(deltaTime);            
                }
                checkBonus(scene);
                moveAllBonus();
                printScore(tron, currentDate);
            }       
        }
        scene.render()
    });
}

function restartGame(){
    resetTron(this.tron,true);

}

function askReady(){
    document.getElementById("HOME").style.display = "none";
    document.getElementById("LOADING").style.display = "none";
    document.getElementById("READY").style.display = "block";
    document.getElementById("WAITING").style.display = "none";
    document.getElementById("GAME").style.display = "none";
}

function ready(){
    send("ready",{'username' : username});
    answeredReady= true;
    document.getElementById("HOME").style.display = "none";
    document.getElementById("LOADING").style.display = "none";
    document.getElementById("READY").style.display = "none";
    document.getElementById("WAITING").style.display = "block";
    document.getElementById("GAME").style.display = "none";
}

/*
function doPause(){
    if(escapeReleased){
        if(inputStates.escape){
            escapeReleased = false ;
            pause = true ;
            pauseScreen(pause);
        }
    }
}
function unPause(){ 
    if(escapeReleased){
        if (inputStates.escape){
            pause = false;
            escapeReleased = false;
            pauseScreen(pause);
        }
    }
}

*/

function checkBonus(scene){
    for(let i = 0 ; i < 5 ; i++){
        if(bonus[i] == undefined){
            if(bonusPos[i]!= undefined){
                bonus[i] = createBonus(scene,bonusPos[i]);
            }
        }
    }
}

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

function reset(){
    for(let i = 0 ; i < walls.length ; i++){
        if(walls[i]!=undefined){
           walls[i].dispose();
        }
    }
    walls = [];
    timeStart = Date.now();
}

function createWall(scene,fromX,fromZ , toX,toZ,mine,color){
    let diffX = toX-fromX;
    let diffZ = toZ-fromZ;
    nbWall ++;
    let longueur = Math.pow((Math.pow(diffX,2) + Math.pow(diffZ,2)),0.5);
    let angle = Math.acos(diffX/longueur);
    if(diffZ > 0 ){
        angle = -angle;
    }
    let wall = BABYLON.MeshBuilder.CreateBox(toString(nbWall), { width:longueur, height:5, size : 2}, scene);
    wall.position = new BABYLON.Vector3(fromX+(diffX / 2)  , 2, fromZ +(diffZ / 2)); 
    wall.rotation.y = angle;
    if(displayTransparency){ wall.visibility = 0.5;}
    //let colors = createRainbowRGB(nbWall);
    let WallMaterial = new BABYLON.StandardMaterial("wallMaterial", scene);
    WallMaterial.diffuseColor  = new BABYLON.Color3(colorList[color].r,colorList[color].g,colorList[color].b);
    wall.material = WallMaterial
    //walls = BABYLON.Mesh.MergeMeshes([walls,wall]);
    walls[nbWall] = wall;
    if(mine) {send("wall",{'username':username,'fromX' : fromX,'fromZ':fromZ, 'toX' : toX,'toZ' : toZ , 'color' : color});}
}


function createMissile(scene,from,tron){
    let missile = BABYLON.MeshBuilder.CreateBox("missile", { width:0.5, height:1, size : 5 }, scene);
    missile.frontVector = tron.frontVector;
    missile.position = new BABYLON.Vector3(from.x, 4, from.z); 

    missile.rotation.y = tron.rotation.y;
    let missileMaterial = new BABYLON.StandardMaterial("missileMaterial", scene);
    missileMaterial.diffuseColor  = new BABYLON.Color3.Yellow;
    missileMaterial.emissiveColor = new BABYLON.Color3.Yellow;
    missileMaterial.intensity = 5;
    missile.material = missileMaterial
    missile.speed = 0.3 ;
    

    missile.move = (deltaTime) => {
        missile.moveWithCollisions(missile.frontVector.multiplyByFloats(missile.speed*deltaTime, missile.speed*deltaTime, missile.speed*deltaTime));
        destructWall(missile);
    }
    missileCast = true ;
    missiles = missile;
}

function destructWall(missile){
    if((missiles.position.x > 197) || (missiles.position.z > 207) || (missiles.position.x < -197) || (missiles.position.z < -207)){
        missiles.dispose();
        missileCast = false ;
        return;
    }
    for(let i = 0 ; i < walls.length ; i++){
        if(walls[i]!=undefined){
            if(missiles.intersectsMesh(walls[i],true)){
                walls[i].dispose();
                missiles.dispose();
                missileCast = false ;
                walls[i] = undefined ;
                return;
            }
        }
    }
}

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

function createBonus(scene,position){
    let height = 1;
    let diameter = 10 ;
    let tessellation = 32 ;
    let subdivisions = 1 ;
    let updatable = true ;
    const bonus = BABYLON.Mesh.CreateCylinder("cylinder", height, diameter, diameter, tessellation, subdivisions, scene, updatable); 
    bonus.position = new BABYLON.Vector3(position.x,position.y,position.z);
    bonus.rotation.x = -Math.PI/2;
    bonus.move = (position) => {
        bonus.rotation.y += 0.05 ;
        bonus.position = new BABYLON.Vector3(position.x,position.y,position.z);
    }
    let bonusMaterial = new BABYLON.StandardMaterial("BonusMaterial", scene);
    bonusMaterial.diffuseTexture  = new BABYLON.Texture("images/STAR.png");
    bonus.material = bonusMaterial
    return bonus;
}

function moveAllBonus(){
    for(let i = 0 ; i < bonus.length ; i++){
        if(bonus[i]!=undefined){
        bonus[i].move(bonusPos[i]);
        }
    }
}



function moveCursor(tron){
    cursorPlayer.position.x = tron.position.x;
    cursorPlayer.position.z = tron.position.z;
}

function createCursor(tron){
    cursorPlayer = BABYLON.MeshBuilder.CreateSphere("cursor", {diameter: 5, segments: 32} , scene);
    cursorPlayer.position.x = tron.position.x;
    cursorPlayer.position.y = 50;
    cursorPlayer.position.z = tron.position.z;
}

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
    camera.viewport = new BABYLON.Viewport(0.015,0.025,0.20,0.35);
    camera.renderingGroupId = 1;
    return camera;
}

function createFollowCamera(scene, target) {
    let position = new BABYLON.Vector3
    let camera = new BABYLON.FollowCamera("tronFollowCamera", target.position, scene, target);

    camera.radius = 30; // how far from the object to follow
	camera.heightOffset = 10; // how high above the object to place the camera
	camera.rotationOffset = 180; // the viewing angle
	camera.cameraAcceleration = 0.5; // how fast to move
	camera.maxCameraSpeed = 100; // speed limit 
    camera.fov = 1;
    //camera.viewport = new BABYLON.Viewport(0,0,1,1); 
    return camera;
}

window.addEventListener("resize", () => {
    engine.resize()
});

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
        let element = document.pointerLockElement || null;
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

function printFPS(deltaTime){
    let FPS = document.querySelector("#FPS");
    FPS.innerHTML =  engine.getFps().toFixed();
}

function printScore(tron, date){
    let scorehtml = document.querySelector("#score");
    tron.score = (date - timeStart) /1000;
    scorehtml.innerHTML = tron.score;
}

function printTIMEOUT(timeleft){
    let temps = document.querySelector("#COOLDOWN");
    let tmps = Math.floor(timeleft/1000);
    if(tmps == 0){
        temps.innerHTML = ' GO !';
    }else{
        temps.innerHTML = tmps;
    }
    
}


function pauseScreen(pause){
    if(pause){
        document.getElementById("pause").src = "images/PAUSE.png";
        //document.getElementById("pause").innerHTML = '<img src="images/PAUSE.png" id="PAUSE" width="100%" height="100%"></img>'
    }else{
        document.getElementById("pause").src = "images/CLASSIC.png";
    }
}

/*function gameOver(){
    document.getElementById("pause").src = "images/GAMEOVER.png";
    pause = true ;
}*/


//////////////////////////////////////  CONNEXION SERVEUR //////////////////////////////////////////////

function updateWall(newWall){
    if(newWall.username != username){
        createWall(scene,newWall.fromX,newWall.fromZ,newWall.toX , newWall.toZ, false,newWall.color);
    }
}

function updatePlayerNewPos(newPos){
    if(listEnemis[newPos.username]!=undefined){
        listEnemis[newPos.username].move(newPos.x,newPos.y,newPos.z)
    }else if(username!=newPos.username){
        updatePlayers(newPos);
    }
    

}

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


function replaceBonus(unBonus){
    if(bonus){
        if(bonus[unBonus.numBonus]!=undefined){
            bonus[unBonus.numBonus].dispose();
            delete bonus[unBonus.numBonus];
        }
    }
    bonusPos[unBonus.numBonus] = unBonus.position;
}

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

function starting(start){
    document.getElementById("HOME").style.display = "none";
    document.getElementById("LOADING").style.display = "none";
    document.getElementById("READY").style.display = "none";
    document.getElementById("WAITING").style.display = "none";
    document.getElementById("GAME").style.display = "block";
    gameWantReady = false ;
    timeToStart = start;
}