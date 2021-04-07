
let canvas;
let engine;
let scene;
// vars for handling inputs
let inputStates = {};
let walls = [] ;
let stadium;
let ground;
let cursorPlayer;
window.onload = startGame;

function startGame() {
    let canvasJeu = document.getElementById("myCanvas");
    engine = new BABYLON.Engine(canvasJeu, true);



    scene = createScene();
    
    walls.push(createBaseWall());
    // modify some default settings (i.e pointer events to prevent cursor to go 
    // out of the game window)
    modifySettings();
    let currentDate = Date.now();
    let lastDateWall = Date.now();
    let lastDateMove = Date.now();
    let cameraset  = false ;
    engine.runRenderLoop(() => {
        currentDate = Date.now();
        let deltaTime = engine.getDeltaTime(); // remind you something ?
        let tron = scene.getMeshByName("tron");
        if(tron){
            if(!cameraset){
                let followCamera = createFollowCamera(scene, tron);
                let cameraMap = createCameraMap(scene);
                scene.activeCamera = followCamera;
	            scene.activeCameras.push(followCamera);
	            //followCamera.attachControl(canvas,true);
                scene.activeCameras.push(cameraMap);
		        cameraMap.layerMask = 1;
                followCamera.layerMask = 2;
                cameraset = true;
            }
            //scene.activeCamera = followCamera;
            tron.move(deltaTime);
            moveCursor(tron);
            lastDateMove=currentDate;

            if(currentDate-lastDateWall > 300){
                tron.score += 1 ;
                tron.wall();
                lastDateWall=currentDate;
                printFPS(deltaTime);
                printScore(tron.score);
            }
            //tron.wall(scene);
        }
       
        
        
        scene.render()

        
    });
}

function createScene() {
    canvas = document.querySelector("#myCanvas");
    //canvasMap = document.querySelector("#camera");

    let scene = new BABYLON.Scene(engine);


    let camera = createFreeCamera(scene);
    


    createLights(scene);
    //engine.registerView(document.getElementById("myCanvas"), camera);
    


    stadium = createStadium(scene);
    ground = createGround(scene);
    let tron = createTron(scene);
    //scene.activeCamera = freeCamera;
    
    
    
    

    //Tron(scene);
    return scene;
}

function createGround(scene) {
    //const ground = BABYLON.SceneLoader.ImportMesh("", "models/TheArena/", "theArenabis.babylon", scene,  (newMeshes, particleSystems, skeletons) => {
    //const ground = BABYLON.SceneLoader.ImportMesh("Plane.006", "models/TronFloor/", "Ground.babylon", scene,  (newMeshes, particleSystems, skeletons) => {
    const ground = BABYLON.SceneLoader.ImportMesh("Plane", "models/TronFloor/", "GroundSansObstacle.babylon", scene,  (newMeshes, particleSystems, skeletons) => {
        let ground = newMeshes[0];
        ground.checkCollisions = true;
        ground.position = new BABYLON.Vector3(0, 0, 0); 
        ground.scaling = new BABYLON.Vector3(9  ,9, 9);
        ground.name = "ground";
        // to be taken into account by collision detection
        ground.checkCollisions = false;
        //groundMaterial.wireframe=true;
    return ground;
    });
}

function createStadium(scene) {
    //const ground = BABYLON.SceneLoader.ImportMesh("", "models/TheArena/", "theArenabis.babylon", scene,  (newMeshes, particleSystems, skeletons) => {
    const stadium = BABYLON.SceneLoader.ImportMesh("Roof Shade", "models/TronStadium/", "TronArena.babylon", scene,  (newMeshes, particleSystems, skeletons) => {
        let stadium = newMeshes[0];
        stadium.checkCollisions = true;
        stadium.position = new BABYLON.Vector3(0, 0, 0); 
        stadium.scaling = new BABYLON.Vector3(4  ,2, 3);
        stadium.name = "stadium";

        // to be taken into account by collision detection
        stadium.checkCollisions = true;
        //groundMaterial.wireframe=true;
    return stadium;
    });
}

function createBaseWall(scene){
    var modelBox = BABYLON.MeshBuilder.CreateBox("mb", { width:0.1, height:2}, scene);
    modelBox.checkCollisions = true;
    modelBox.position = new BABYLON.Vector3(0, -10, 0); 
    modelBox.rotation.y = Math.PI/2;
    
    return modelBox;

}

function createWall(scene,from , to, nbWall, tron){
    let diffX = to.x-from.x;
    let diffZ = to.z-from.z;
    
    let longueur = Math.pow((Math.pow(diffX,2) + Math.pow(diffZ,2)),0.5);
    let angle = Math.acos(diffX/longueur);
    if(diffZ > 0 ){
        angle = -angle;
    }
    
    let wall = BABYLON.MeshBuilder.CreateBox(toString(nbWall), { width:longueur, height:5, size : 2}, scene);
    wall.checkCollisions = true;
    wall.position = new BABYLON.Vector3(from.x+(diffX / 2)  , 2, from.z +(diffZ / 2)); 
    wall.rotation.y = angle;
    wall.visibility = 0.5;
    let colors = createRainbowRGB(nbWall);

    let WallMaterial = new BABYLON.StandardMaterial("wallMaterial", scene);

    WallMaterial.diffuseColor  = new BABYLON.Color3(colors[0],colors[1],colors[2]);
    

    wall.material = WallMaterial
    //walls = BABYLON.Mesh.MergeMeshes([walls,wall]);
    walls.push(wall);
    //console.log(wall.position);

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

function createLights(scene) {
    // i.e sun light with all light rays parallels, the vector is the direction.
    let light1 = new BABYLON.DirectionalLight("dir1", new BABYLON.Vector3(-1, -1, -1), scene);
    let light2 = new BABYLON.DirectionalLight("dir2", new BABYLON.Vector3(1, -1, 1), scene);
    let light3 = new BABYLON.DirectionalLight("dir3", new BABYLON.Vector3(1, -1, -1), scene);
    let light4 = new BABYLON.DirectionalLight("dir4", new BABYLON.Vector3(-1, -1, 1), scene);

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
    let camera = new BABYLON.FreeCamera("freeCamera", new BABYLON.Vector3(-100, -100, -100), scene);

    camera.attachControl(canvas);
    // prevent camera to cross ground
    camera.checkCollisions = true; 
    // avoid flying with the camera
    camera.applyGravity = true;

    // Add extra keys for camera movements
    // Need the ascii code of the extra key(s). We use a string method here to get the ascii code
    camera.keysUp.push('z'.charCodeAt(0));
    camera.keysDown.push('s'.charCodeAt(0));
    camera.keysLeft.push('q'.charCodeAt(0));
    camera.keysRight.push('d'.charCodeAt(0));
    camera.keysUp.push('Z'.charCodeAt(0));
    camera.keysDown.push('S'.charCodeAt(0));
    camera.keysLeft.push('Q'.charCodeAt(0));
    camera.keysRight.push('D'.charCodeAt(0));

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
    //camera.position = new BABYLON.Vector3(-100,50,-100);
    camera.fov = 1;
    //camera.attachControl(canvasMap);
    camera.viewport = new BABYLON.Viewport(0.015,0.025,0.20,0.35);
    camera.renderingGroupId = 1;
    return camera;
}

function createFollowCamera(scene, target) {
    let camera = new BABYLON.FollowCamera("tronFollowCamera", target.position, scene, target);

    camera.radius = 5; // how far from the object to follow
	camera.heightOffset = 7; // how high above the object to place the camera
	camera.rotationOffset = 180; // the viewing angle
	camera.cameraAcceleration = 0.04; // how fast to move
	camera.maxCameraSpeed = 20; // speed limit
    camera.fov = 1.5;
    camera.viewport = new BABYLON.Viewport(0,0,1,1); 
    return camera;
}

let zMovement = 5;



function createTron(scene) {
    BABYLON.SceneLoader.ImportMesh("", "models/Tron/", "Tron_Motorcycle.babylon", scene,  (newMeshes, particleSystems, skeletons) => {
            let tron = newMeshes[0];
            let tronMaterial = new BABYLON.StandardMaterial("tronMaterial", scene);
            tronMaterial.diffuseTexture = new BABYLON.Texture("models/Tron/Sphere_003_baked_EMIT.jpg");
            tronMaterial.emissiveTexture = new BABYLON.Texture("models/Tron/Sphere_003_baked_EMIT.jpg");
            tronMaterial.emissiveColor = new BABYLON.Color3.Yellow;
            tronMaterial.glow = new BABYLON.GlowLayer("glow", scene, {blurKernelSize : 150});
            tronMaterial.glow.intensity = 3;
            tronMaterial.glow.addIncludedOnlyMesh(tron);


            tron.material = tronMaterial;
            tron.jumpAvailable = false;
            tron.jumping = false ; 
            tron.jumpTimer = Date.now(); 
            tron.position = new BABYLON.Vector3(0, 3, 0); 

            tron.scaling = new BABYLON.Vector3(1  ,1, 1);
            tron.name = "tron";
            tron.nbWall= 0 ;
            tron.baseRotationZ = -1.5708
            tron.speed = 0.05;
            tron.frontVector = new BABYLON.Vector3(0, 0, 1);
            tron.checkCollisions = true;
           
            tron.score = 0 ;
            tron.highScore = 0;

            tron.lastPos = new BABYLON.Vector3(tron.x-3*tron.frontVector.x, tron.y, tron.z-3*tron.frontVector.z);
            tron.loose = false;
            createCursor(tron);

            tron.wall = (scene) => {
                if(!tron.jumping && !tron.loose){
                    
                    let newPos = new BABYLON.Vector3(tron.position.x-4*tron.frontVector.x, tron.position.y, tron.position.z-4*tron.frontVector.z);
                    tron.nbWall +=1 ;
                    createWall(scene, tron.lastPos , newPos, tron.nbWall, tron);
                    tron.lastPos = newPos;
                }
                else{
                    
                    tron.loose = false;
                    tron.lastPos = new BABYLON.Vector3(tron.position.x, tron.position.y, tron.position.z);
                }
            }

            tron.move = (deltaTime) => {
                let currentDate = Date.now();
                if(!tron.jumpAvailable ){
                    let timeElapsedDuringJump = currentDate - tron.jumpTimer ;
                    if(tron.jumping && ( timeElapsedDuringJump < 1000)){
                        fallTron(tron, timeElapsedDuringJump);
                    }else{
                        tron.jumping = false;
                        tron.position.y = 2
                    }
                    if( timeElapsedDuringJump > 5000){
                        tron.jumpAvailable = true;
                        document.getElementById("JUMP").src = "images/JUMP_ENABLE.png";
                    }
                }else{
                    if(inputStates.space){
                        tron.jumpAvailable = false;
                        document.getElementById("JUMP").src = "images/JUMP_DISABLE.png";
                        tron.jumpTimer = currentDate;
                        jumpTron(tron);
                    }
                }

                let yMovement = 0;
            
                if (tron.position.y > 2) {
                    zMovement = 0;
                    yMovement = -2;
                } 
                //if(inputStates.up){
                    if((tron.position.x + tron.frontVector.x*2 +tron.speed > 197) || (tron.position.z + tron.frontVector.z*2 + tron.speed > 207) || (tron.position.x + tron.frontVector.x*2+ tron.speed < -197) || (tron.position.z + tron.frontVector.z*2+ tron.speed < -207)){
                        resetTron(tron);
                        
                    }
                    for(let i = 0 ; i < walls.length ; i++){
                        if(tron.intersectsMesh(walls[i],true)){
                            console.log("COLLAPSE" , i);
                            resetTron(tron);
                            break;
                        }
                    }
                    tron.moveWithCollisions(tron.frontVector.multiplyByFloats(tron.speed*deltaTime, tron.speed*deltaTime, tron.speed*deltaTime));
                    
                //}
                if(inputStates.left) {
                    tron.rotation.y -= 0.02*deltaTime/30;
                    if(tron.rotation.z < tron.baseRotationZ+0.8) tron.rotation.z += 0.02;
                    tron.frontVector = new BABYLON.Vector3(Math.sin(tron.rotation.y), 0, Math.cos(tron.rotation.y));
                }
                else if(inputStates.right) {
                    tron.rotation.y += 0.02*deltaTime/30;
                    if(tron.rotation.z > tron.baseRotationZ-0.8) tron.rotation.z -=0.02;
                    tron.frontVector = new BABYLON.Vector3(Math.sin(tron.rotation.y), 0, Math.cos(tron.rotation.y));
                }else{
                    let diffRotation = tron.rotation.z-tron.baseRotationZ;
                    if(Math.pow(diffRotation,2)<=0.02*deltaTime/30){
                        tron.rotation.z = tron.baseRotationZ;
                    }else if(tron.rotation.z > tron.baseRotationZ){
                        tron.rotation.z -= 0.02*deltaTime/30;
                    }else if(tron.rotation.z < tron.baseRotationZ){
                        tron.rotation.z += 0.02*deltaTime/30;
                    }
                }
            }
            return tron;
        });
}

function resetTron(tron){
    tron.position.x = 0 ;
    tron.position.z = 0;
    tron.position.y = 2;
    walls.forEach( element => element.dispose());
    walls = [];
    walls.push(createBaseWall());
    tron.loose = true ;
    tron.nbWall=0;
    if(tron.highScore < tron.score){
        tron.highScore = tron.score;
    }
    tron.score = 0
    printHScore(tron.highScore);
}

function jumpTron(tron){
    tron.jumping = true ;
}

function fallTron(tron, time){
    if(time<250 || time >750){
        tron.rotation.x -=0.008;
    }else{
        tron.rotation.x +=0.008;
    }
    tron.position.y = (-1/50000*Math.pow(time,2)+1/50*time +2);
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
        }
    }, false);
}

function printFPS(deltaTime){
    let FPS = document.querySelector("#FPS");
    FPS.innerHTML = Math.floor(1000/deltaTime);
}

function printScore(score){
    let scorehtml = document.querySelector("#score");
    scorehtml.innerHTML = score;
}
function printHScore(highScore){
    let highScorehtml = document.querySelector("#HS");
    highScorehtml.innerHTML = highScore;
}

