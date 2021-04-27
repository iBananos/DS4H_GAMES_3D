

// crée le tron allié 
function createTron(scene,x,y,z,orientation,color) {
    BABYLON.SceneLoader.ImportMesh("", "models/Tron/", "Tron_Motorcycle.babylon", scene,  (newMeshes, particleSystems, skeletons) => {
            let tron = newMeshes[0];
    //        let tron = BABYLON.MeshBuilder.CreateBox(username, { width:3, height:3, size : 3}, scene);
            let tronMaterial = new BABYLON.StandardMaterial("tronMaterial", scene);
            tronMaterial.diffuseTexture = new BABYLON.Texture("models/Tron/Sphere_003_baked_EMIT.jpg");
            tronMaterial.emissiveTexture = new BABYLON.Texture("models/Tron/Sphere_003_baked_EMIT.jpg");
            tronMaterial.emissiveColor = new BABYLON.Color3(colorList[color].r,colorList[color].g,colorList[color].b);
            if(displayEffects){
                tronMaterial.glow = new BABYLON.GlowLayer("glow", scene, {blurKernelSize : 150});
                tronMaterial.glow.intensity = 1;
                tronMaterial.glow.addIncludedOnlyMesh(tron);
            }
            tron.material = tronMaterial;
            tron.color = color;
            tron.x = x;
            tron.y = y;
            tron.z = z;
            tron.base =  new BABYLON.Vector3(tron.x, tron.y, tron.z); 
            tron.baseRotationY = orientation;
            tron.baseRotationZ = -1.5708;
            tron.rotation.y = tron.baseRotationY;
            tron.speed = 0.05;
            tron.basedSpeed = 0.05;
            tron.frontVector = new BABYLON.Vector3(Math.sin(tron.baseRotationY), 0, Math.cos(tron.baseRotationY));
            tron.checkCollisions = false;
            tron.bonus = 0;
            tron.highBonus = 0;
            tron.score = 0;
            tron.highScore = 0;
            tron.bonusSound = new BABYLON.Sound("BONUS", "musique/bonus.wav", scene, null, {
                volume : 0.1
            });

            // JUMP SETUP
            tron.jumpAvailable = false;
            tron.jumping = false ; 
            tron.jumpTimer = Date.now(); 
            tron.jump = new BABYLON.Sound("JUMP", "musique/jump.wav", scene, null, {
                volume : 0.1
            });

            // BRAKE SETUP
            tron.brakeAvailable = false;
            tron.braking = false;
            tron.brakeTimer = Date.now();
            tron.brake = new BABYLON.Sound("BRAKE", "musique/brake.wav", scene, null, {
                volume : 0.1
            });

            // MISSILE SETUP
            tron.missileAvailable = false;
            tron.fire = false;
            tron.missileTimer = Date.now();
            tron.laser = new BABYLON.Sound("SHOT", "musique/laser.wav", scene, null, {
                volume : 0.1
            });
            tron.position = new BABYLON.Vector3(x, y, z); 
            tron.scaling = new BABYLON.Vector3(1  ,1, 1);
            tron.name = "tron";
            tron.nbWall= 0;
            
            
            
            tron.inGame = true;
            tron.lastPos = new BABYLON.Vector3(tron.x-3*tron.frontVector.x, tron.y, tron.z-3*tron.frontVector.z);
            tron.loose = false;
            createCursor(tron);

            // pour la construction des murs 
            tron.wall = (scene,inputs) => {
                if(!tron.jumping && !tron.loose){
                    let newPos = new BABYLON.Vector3(tron.position.x-4*tron.frontVector.x, tron.position.y, tron.position.z-4*tron.frontVector.z);
                    tron.nbWall +=1 ;
                    createWall(scene, tron.lastPos.x, tron.lastPos.z , newPos.x, newPos.z,true,tron.color);
                    tron.lastPos = newPos;
                }else{
                    tron.loose = false;
                    tron.lastPos = new BABYLON.Vector3(tron.position.x, tron.position.y, tron.position.z);
                }
                
                
            }

            // mouvement du tron en fonction de plusieurs facteur, gère également les collisions avec les autres murs
            tron.move = (deltaTime,inputs,walls,bonus) => {
                if(true){
                    let currentDate = Date.now();
                    // si le saut n'est pas disponible
                    if(!tron.jumpAvailable ){
                        let timeElapsedDuringJump = currentDate - tron.jumpTimer ;
                        if(tron.jumping && ( timeElapsedDuringJump < 1000)){
                            fallTron(tron, timeElapsedDuringJump);
                        }else{
                            tron.jumping = false;
                            tron.position.y = 2
                        }if( timeElapsedDuringJump > 5000){
                            tron.jumpAvailable = true;
                            document.getElementById("JUMP").src = "images/JUMP_ENABLE.png";
                        }
                        //si le saut est disponible
                    }else{
                        if(inputs.space){
                            tron.jumpAvailable = false;
                            document.getElementById("JUMP").src = "images/JUMP_DISABLE.png";
                            tron.jumpTimer = currentDate;
                            jumpTron(tron);
                        }
                    }

                    // si le brake est indisponible
                    if(tron.inGame){
                        if(!tron.brakeAvailable){
                                let timeElapsedBrake = currentDate - tron.brakeTimer ;
                                if(tron.braking && ( timeElapsedBrake > 2000)){
                                    tron.speed = tron.basedSpeed;
                                    tron.braking = false ;
                                }if( timeElapsedBrake > 7000){
                                    tron.brakeAvailable = true;
                                    document.getElementById("BRAKE").src = "images/BRAKE_ENABLE.png";
                                }
                        
                            // si le brake est disponile
                        }else{
                            if( inputs.down){
                                tron.brake.play();
                                tron.speed = tron.basedSpeed/2;
                                tron.braking = true; 
                                tron.brakeAvailable = false;
                                document.getElementById("BRAKE").src = "images/BRAKE_DISABLE.png";
                                tron.brakeTimer = currentDate;
                            }
                        }
                    }
                    // missile indiponible
                    if(!tron.missileAvailable ){
                        let timeElapsedFire = currentDate - tron.missileTimer ;
                        if(timeElapsedFire > 10000){
                            tron.missileAvailable = true;
                            document.getElementById("FIRE").src = "images/FIRE_ENABLE.png";
                        }
                        // missile disponible
                    }else{
                        if(inputs.up){
                            let newPos = new BABYLON.Vector3(tron.position.x, 0, tron.position.z);
                            createMissile(scene , newPos , tron);
                            tron.missileAvailable = false;
                            tron.laser.play();
                            document.getElementById("FIRE").src = "images/FIRE_DISABLE.png";
                            tron.missileTimer = currentDate;
                        }
                    }            
                    // check la collision avec les bonus        
                    for(let i = 0 ; i < bonus.length ; i++){
                        if(bonus[i]!=undefined){
                            if(tron.intersectsMesh(bonus[i],true)){
                                tron.bonusSound.play();
                                console.log("BONUS" , i);
                                bonusTron(tron);
                                delete bonusPos[i]; 
                                bonus[i].dispose();
                                delete bonus[i];
                                if(displayParticles){createBonusAnimation(tron);}
                                send('deleteBonus',i);
                                break;
                            }
                        }
                    }
                    let dist = Math.pow((Math.pow(tron.position.x,2)+Math.pow(tron.position.z,2)),0.5)
                    // check si le joueur à dépassé l'arene
                    if(dist>200){
                        stopTron(tron)
                    }
                    //check si le joueur percute un mur
                    for(let i = 0 ; i < walls.length ; i++){
                        if(walls[i]!=undefined){
                            if(tron.intersectsMesh(walls[i],true)){
                                console.log("COLLAPSE" , i);
                                stopTron(tron)
                                break;
                            }
                        }
                    }
                    tron.moveWithCollisions(tron.frontVector.multiplyByFloats(tron.speed*deltaTime, tron.speed*deltaTime, tron.speed*deltaTime));
                    // verifie si le joueur tourne gauche/droite
                    if(inputs.left) {
                        tron.rotation.y -= 0.02*deltaTime/10;
                        if(tron.rotation.z + 0.02*deltaTime/10 < tron.baseRotationZ+0.8){
                            tron.rotation.z += 0.02*deltaTime/10;
                        }else{
                            tron.rotation.z =tron.baseRotationZ+0.8
                        }
                        tron.frontVector = new BABYLON.Vector3(Math.sin(tron.rotation.y), 0, Math.cos(tron.rotation.y));
                    }
                    else if(inputs.right) { 
                        tron.rotation.y += 0.02*deltaTime/10;
                        if(tron.rotation.z - 0.02*deltaTime/10 > tron.baseRotationZ-0.8){
                            tron.rotation.z -= 0.02*deltaTime/10;
                    }else{
                        tron.rotation.z =tron.baseRotationZ-0.8;
                    }
                        tron.frontVector = new BABYLON.Vector3(Math.sin(tron.rotation.y), 0, Math.cos(tron.rotation.y));
                    }else{
                        let diffRotation = tron.rotation.z-tron.baseRotationZ;
                        if(Math.pow(diffRotation,2)<=0.02*deltaTime/10){
                            tron.rotation.z = tron.baseRotationZ;
                        }else if(tron.rotation.z > tron.baseRotationZ){
                            tron.rotation.z -= 0.02*deltaTime/10;
                        }else if(tron.rotation.z < tron.baseRotationZ){
                            tron.rotation.z += 0.02*deltaTime/10;
                        }
                    }
                
                }
                // envoie au serveur la position 
                let data = {'username':username,'x' : tron.position.x, 'y' : tron.position.y , 'z' : tron.position.z, 'orientation' : tron.baseRotationY}
                send("sendpos",data);
            }
            // si le client à choisit d'afficher les particules
            if(displayParticles) {particleTron(tron);}
            return tron;
        });
}
let zMovement = 5;

// crée l'animation lorsque le joueur obtient un bonus 
// grandement inspiré d'un playground mais énormément modifié aussi : 
// https://playground.babylonjs.com/#LNRAI3
function createBonusAnimation(tron){
    const particleSystem = new BABYLON.ParticleSystem("particles", 100);

    //Texture of each particle
    particleSystem.particleTexture = new BABYLON.Texture("images/HOLY.jpg");


    // Colors of all particles
    particleSystem.color1 = new BABYLON.Color3.Red;
    particleSystem.color2 = new BABYLON.Color3.Yellow;
    particleSystem.colorDead = new BABYLON.Color4(0, 0, 0.2, 0.0);

    // Size of each particle (random between...
    particleSystem.minSize = 0.5;
    particleSystem.maxSize = 2;

    // Life time of each particle (random between...
    particleSystem.minLifeTime = 1;
    particleSystem.maxLifeTime = 1;

    // Emission rate
    particleSystem.emitRate = 100;
    // Position where the particles are emitted from
    particleSystem.emitter = tron;
    particleSystem.minEmitBox = new BABYLON.Vector3(-2, -2, -2); // Starting all from
    particleSystem.maxEmitBox = new BABYLON.Vector3(2, 2, 2); // To...
    // Direction of each particle after it has been emitted
    //particleSystem.direction1 = new BABYLON.Vector3(0,1, 0);
    particleSystem.gravity = new BABYLON.Vector3(-2, 100, 0);
    // Angular speed, in radians
    
    // Speed
    particleSystem.minEmitPower = 1;
    particleSystem.maxEmitPower = 2;
    particleSystem.updateSpeed = 0.05;

    
    particleSystem.start();
    particleSystem.targetStopDuration = 1;
}

// permet le reset de la game et des informations du tron 
function resetTron(tron,reseting){
    tron.inGame = true;
    tron.position = new BABYLON.Vector3(tron.x, tron.y, tron.z);
    tron.rotation.y = tron.baseRotationY
    tron.rotation.z = tron.baseRotationZ
    tron.speed = 0.05;
    tron.basedSpeed = 0.05;
    tron.frontVector = new BABYLON.Vector3(Math.sin(tron.baseRotationY), 0, Math.cos(tron.baseRotationY));

    tron.loose = true ;
    tron.nbWall=0;
    if(tron.highScore < tron.score){
        tron.highScore = tron.score;
    }
    if(tron.highBonus < tron.bonus){
        tron.highBonus = tron.bonus;
    }
    tron.score = 0
    tron.bonus = 0
    
    printBonus(0);
    printHScore(tron.highScore);
    printHBonus(tron.highBonus);
    reset();
    
}

// ajoute un bonus a tron 
function bonusTron(tron){
    tron.bonus += 1;
    printBonus(tron.bonus);
}

// le tron est en JUMP
function jumpTron(tron){
    tron.jumping = true ;
    tron.jump.play();
}

function stopTron(tron){
    if(tron.inGame){
        send('gameEnded',{'username':username , 'points' : tron.bonus});
        tron.loose = true;
        tron.inGame = false ;
        tron.position = new BABYLON.Vector3(0,50,0);
        tron.speed = 0 ;
    }
}

// permet de calculer la trajectoire du tron lors du saut
function fallTron(tron, time){
    if(time<250 || time >750){
        tron.rotation.x -=0.008;
    }else{
        tron.rotation.x +=0.008;
    }
    tron.position.y = (-1/50000*Math.pow(time,2)+1/50*time +2);
}

// affiche le meilleur score
function printHScore(highScore){
    let highScorehtml = document.querySelector("#HS");
    highScorehtml.innerHTML = highScore;
}

// affiche le nombre de bonus 
function printBonus(bonus){
    let bonushtml = document.querySelector("#BONUS");
    bonushtml.innerHTML = bonus;
}

// affiche le meilleur score en terme de bonus 
function printHBonus(highBonus){
    let highBonushtml = document.querySelector("#HB");
    highBonushtml.innerHTML = highBonus;
}

// crée l'animation lorsque le joueur avance
// grandement inspiré d'un playground mais énormément modifié aussi : 
// https://playground.babylonjs.com/#LNRAI3
function particleTron(tron){
    
    // Create a particle system
    var particleSystem = new BABYLON.ParticleSystem("particles", 100, scene);

    //Texture of each particle
    particleSystem.particleTexture = new BABYLON.Texture("images/Spark.png", scene);

    // Where the particles come from
    particleSystem.emitter = tron; // the starting object, the emitter
    particleSystem.minEmitBox = new BABYLON.Vector3(-1, -1, -3); // Starting all from
    particleSystem.maxEmitBox = new BABYLON.Vector3(1, 1, -3); // To...

    // Colors of all particles
    particleSystem.color1 = new BABYLON.Color4(colorList[tron.color].r,colorList[tron.color].g,colorList[tron.color].b, 1.0);
    particleSystem.color2 = new BABYLON.Color4(0.2, 0.5, 1.0, 1.0);
    particleSystem.colorDead = new BABYLON.Color4(0, 0, 0.2, 0.0);

    // Size of each particle (random between...
    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.5;

    // Life time of each particle (random between...
    particleSystem.minLifeTime = 0.01;
    particleSystem.maxLifeTime = 0.1;

    // Emission rate
    particleSystem.emitRate = 1500;

    // Blend mode : BLENDMODE_ONEONE, or BLENDMODE_STANDARD
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

    // Set the gravity of all particles
    particleSystem.gravity = new BABYLON.Vector3(0, 0, 0);

    // Direction of each particle after it has been emitted
    particleSystem.direction1 = new BABYLON.Vector3(1,-8, 10);
    particleSystem.direction2 = new BABYLON.Vector3(1, 8, -10);

    // Angular speed, in radians
    particleSystem.minAngularSpeed = 0;
    particleSystem.maxAngularSpeed = Math.PI;

    // Speed
    particleSystem.minEmitPower = 1;
    particleSystem.maxEmitPower = 2;
    particleSystem.updateSpeed = 0.005;

    // Start the particle system
    particleSystem.start();
}