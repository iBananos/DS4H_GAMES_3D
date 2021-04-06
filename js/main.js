
let canvas;
let canvasMap;
let engine;
let scene;
// vars for handling inputs
let inputStates = {};
let walls = [] ;
let cameraMap;
window.onload = startGame;

function startGame() {
    let canvasJeu = document.createElement("canvas");
    engine = new BABYLON.Engine(canvasJeu, true);

    // Set the default canvas to use for events
    engine.inputElement = document.getElementById("myCanvas");

    scene = createScene();
    
    walls.push(createBaseWall());
    // modify some default settings (i.e pointer events to prevent cursor to go 
    // out of the game window)
    modifySettings();
    let currentDate = Date.now();
    let lastDate = Date.now();
    engine.runRenderLoop(() => {
        currentDate = Date.now();
        let deltaTime = engine.getDeltaTime(); // remind you something ?
        let tron = scene.getMeshByName("tron");
        if(tron){
            let followCamera = createFollowCamera(scene, tron);
            
            engine.registerView(document.getElementById("myCanvas"), followCamera);
            engine.registerView(document.getElementById("camera"), cameraMap);
            //scene.activeCamera = followCamera;
            tron.move();

            if(currentDate-lastDate > 300){
                tron.score += 1 ;
                tron.wall();
                lastDate=currentDate;
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
    canvasMap = document.querySelector("#camera");

    let scene = new BABYLON.Scene(engine);


    let camera = createFreeCamera(scene);
    cameraMap = createCameraMap(scene);


    createLights(scene);
    //engine.registerView(document.getElementById("myCanvas"), camera);
    



    let ground = createGround(scene);
    let tron = createTron(scene);
    //scene.activeCamera = freeCamera;
    
    
    
    

    //Tron(scene);
    return scene;
}

function createGround(scene) {
    const groundOptions = { width:400, height:400, subdivisions:20, minHeight:0, maxHeight:100, onReady: onGroundCreated};
    //scene is optional and defaults to the current scene
    

    const ground = BABYLON.SceneLoader.ImportMesh("", "models/TheArena/", "theArenabis.babylon", scene,  (newMeshes, particleSystems, skeletons) => {
        
        let ground = newMeshes[0];
        ground.position = new BABYLON.Vector3(-200, 0, -200); 
        ground.scaling = new BABYLON.Vector3(1  ,1, 1);
        ground.name = "ground";

    
        return ground;
    });

    function onGroundCreated() {
        const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
        groundMaterial.emissiveColor = new BABYLON.Color3.Blue;
        groundMaterial.glow = new BABYLON.GlowLayer("glow", scene, {blurKernelSize : 150});
        groundMaterial.glow.intensity = 5;
        ground.material = groundMaterial;
        // to be taken into account by collision detection
        ground.checkCollisions = true;
        //groundMaterial.wireframe=true;
    }
    return ground;
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
    
    let wall = BABYLON.MeshBuilder.CreateBox(toString(nbWall), { width:longueur, height:5, size : 0.5}, scene);
    wall.checkCollisions = true;
    wall.position = new BABYLON.Vector3(from.x+(diffX / 2)  , 2, from.z +(diffZ / 2) ); 
    wall.rotation.y = angle;
    wall.visibility = 0.5;

    let WallMaterial = new BABYLON.StandardMaterial("wallMaterial", scene);
    WallMaterial.diffuseColor  = new BABYLON.Color3.Yellow;

    wall.material = WallMaterial
    //walls = BABYLON.Mesh.MergeMeshes([walls,wall]);
    walls.push(wall);
    //console.log(wall.position);

}


function createLights(scene) {
    // i.e sun light with all light rays parallels, the vector is the direction.
    let light1 = new BABYLON.DirectionalLight("dir1", new BABYLON.Vector3(-1, -1, -1), scene);
    let light2 = new BABYLON.DirectionalLight("dir2", new BABYLON.Vector3(1, -1, 1), scene);
    let light3 = new BABYLON.DirectionalLight("dir3", new BABYLON.Vector3(1, -1, -1), scene);
    let light4 = new BABYLON.DirectionalLight("dir4", new BABYLON.Vector3(-1, -1, 1), scene);

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
    let camera = new BABYLON.FreeCamera("cameraMap", new BABYLON.Vector3(-100, 100, -100), scene);
    camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
    camera.setTarget(new BABYLON.Vector3(-100,2,-100));
    camera.orthoTop = 300;
    camera.orthoBottom = -300;
    camera.orthoLeft = -300;
    camera.orthoRight = 300;
    //camera.position = new BABYLON.Vector3(-100,50,-100);
    camera.fov = 1;
    //camera.attachControl(canvasMap);
  

    return camera;
}

function createFollowCamera(scene, target) {
    let camera = new BABYLON.FollowCamera("tronFollowCamera", target.position, scene, target);

    camera.radius = 5; // how far from the object to follow
	camera.heightOffset = 7; // how high above the object to place the camera
	camera.rotationOffset = 180; // the viewing angle
	camera.cameraAcceleration = 0.04; // how fast to move
	camera.maxCameraSpeed = 5; // speed limit
    camera.fov = 1.5;

    return camera;
}

let zMovement = 5;



function createTron(scene) {
    BABYLON.SceneLoader.ImportMesh("", "models/Tron/", "Tron_Motorcycle.babylon", scene,  (newMeshes, particleSystems, skeletons) => {
    //BABYLON.SceneLoader.ImportMesh("", "models/car/", "low_poly_car_blend.babylon", scene,  (newMeshes, particleSystems, skeletons) => {
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
            tron.position = new BABYLON.Vector3(0, 2, 0); 

            tron.scaling = new BABYLON.Vector3(1  ,1, 1);
            tron.name = "tron";
            tron.nbWall= 0 ;
            tron.baseRotationZ = -1.5708
            tron.speed = 0.25;
            tron.frontVector = new BABYLON.Vector3(0, 0, 1);
            tron.checkCollisions = true;
           
            tron.score = 0 ;
            tron.highScore = 0;

            tron.lastPos = new BABYLON.Vector3(tron.x-3*tron.frontVector.x, tron.y, tron.z-3*tron.frontVector.z);
            tron.loose = false;
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

            tron.move = () => {
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
                    if((tron.position.x + tron.speed > 100) || (tron.position.z + tron.speed > 100) || (tron.position.x + tron.speed < -300) || (tron.position.z + tron.speed < -300)){
                        resetTron(tron);
                    }
                    for(let i = 0 ; i < walls.length ; i++){
                        if(tron.intersectsMesh(walls[i],true)){
                            console.log("COLLAPSE" , i);
                            resetTron(tron);
                            break;
                        }
                    }
                    tron.moveWithCollisions(tron.frontVector.multiplyByFloats(tron.speed, tron.speed, tron.speed));
                    
                //}
                if(inputStates.left) {
                    tron.rotation.y -= 0.02;
                    if(tron.rotation.z < tron.baseRotationZ+0.8) tron.rotation.z += 0.02;
                    tron.frontVector = new BABYLON.Vector3(Math.sin(tron.rotation.y), 0, Math.cos(tron.rotation.y));
                }
                else if(inputStates.right) {
                    tron.rotation.y += 0.02;
                    if(tron.rotation.z > tron.baseRotationZ-0.8) tron.rotation.z -=0.02;
                    tron.frontVector = new BABYLON.Vector3(Math.sin(tron.rotation.y), 0, Math.cos(tron.rotation.y));
                }else{
                    let diffRotation = tron.rotation.z-tron.baseRotationZ;
                    if(Math.pow(diffRotation,2)<=0.02){
                        tron.rotation.z = tron.baseRotationZ ;
                    }else if(tron.rotation.z > tron.baseRotationZ){
                        tron.rotation.z -= 0.02;
                    }else if(tron.rotation.z < tron.baseRotationZ){
                        tron.rotation.z += 0.02;
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

