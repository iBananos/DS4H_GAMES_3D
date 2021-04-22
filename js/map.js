function createMAP(scene){
    createLights(scene);
    if(displayStars){ space(scene); }
    //stadium = createStadium(scene);
    //sphere = createSphere(scene);
    ground = createGround(scene);
    title = createTitle(scene);
    ring = createRing(scene)
    if(displayPlanets){
        for(let i = 0 ; i < 7 ; i++){
            planet[i]=createPlanet(scene,i);
        }
        sRing = createSaturnRing(scene);
    }
}

let stadium;
let ground;
let title;
let sphere;
let ring;
let sRing;
let planet = [];
var domeRadius =5000;
let vectors = [[300,0,20],[600,0,50],[900,0,40],[-1200,0,400],[1500,0,300],[1800,0,100],[2100,0,100]];
let planetes = ["MERCURE","VENUS","MARS","JUPITER","SATURNE","URANUS","NEPTUNE"];

var myStartPositionFunction = function (worldMatrix, positionToUpdate) {
	var v3 = getCart(domeRadius);
	BABYLON.Vector3.TransformCoordinatesFromFloatsToRef(v3.x, v3.y, v3.z, worldMatrix, positionToUpdate);
};
var randomNumber = function (min, max) {
	if (min === max) {
    	return (min);
	}
	var random = Math.random();
	return ((random * (max - min)) + min);
};
var doubleColor4 = function (min, max) {
    let particleColor = Math.random()*2
    return new BABYLON.Color4(particleColor, particleColor, particleColor, Math.random());
}
function getCart(radius) {
	// var lat = DegtoRad (latlong.Latitude);
	// var lon = DegtoRad (latlong.Longitude);
	var xy = plot1();  // just below
	var lat = xy[0];
	var lon = xy[1];
	var x = radius * Math.cos(lat)*Math.cos(lon);
	var y = radius * Math.sin(lat);
	var z = radius * Math.cos(lat)*Math.sin(lon);
	return new BABYLON.Vector3(x,y,z);
}
var plot1 = function() {
	var theta = Math.random()*2*Math.PI;
	var phi = Math.acos(Math.random()*2-1);
	return [theta, phi];
};
var myUpdateFunction = function (particles) {
	for (var index = 0; index < particles.length; index++) {
    	var particle = particles[index];
    	particle.age += this._scaledUpdateSpeed;
    	if (particle.age >= particle.lifeTime) {
        	this.recycleParticle(particle);
        	index--;
        	continue;
    	}
    	else {
			particle.color = doubleColor4();
			particle.size = randomNumber(this.minSize,this.maxSize);
        	if (particle.color.a < 0)
            	particle.color.a = 0;
    	}
	}
};

function space(scene){
    var ps = new BABYLON.ParticleSystem("particles", 1000, scene);
	ps.startPositionFunction = myStartPositionFunction;
	ps.updateFunction = myUpdateFunction;
	ps.particleTexture = new BABYLON.Texture("https://cdn.rawgit.com/wingnutt/misc/master/star.jpg", scene);
	ps.emitter = new BABYLON.Vector3(0, 15, 0);
	ps.minEmitBox = new BABYLON.Vector3(0, 0, 0); // Starting all from
	ps.maxEmitBox = new BABYLON.Vector3(0, 0, 0); // To...
	ps.color1 = ps.color2 = ps.colorDead = new BABYLON.Color4(1,1,1,1);
	ps.minSize = 50;
	ps.maxSize = 100; 
	ps.minLifeTime = 1000.0;
	ps.maxLifeTime = 1000.0;
	ps.emitRate = 5000;
	ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
	ps.minAngularSpeed = 0;
	ps.maxAngularSpeed = 0;
	ps.minEmitPower = 0;
	ps.maxEmitPower = 0;
	ps.updateSpeed = 0.005;
	ps.start();
}


function createPlanet(scene,num){
    var planet = BABYLON.Mesh.CreateSphere("planet"+toString(num), 16, vectors[num][2], scene);
	var planetMaterial = new BABYLON.StandardMaterial("planetSurface"+toString(num), scene);
    planet.position = new BABYLON.Vector3(vectors[num][0],50,vectors[num][1])
	planet.material = planetMaterial;
    planet.material.diffuseTexture = new BABYLON.Texture("images/"+planetes[num]+".jpg");
    planet.material.specularColor = new BABYLON.Color3(0, 0, 0);
    planet.emissiveColor = new BABYLON.Color3(.7, .4, .4);
    planet.dist =  Math.pow((Math.pow(planet.position.x,2) + Math.pow(planet.position.z,2)),0.5);

    planet.move = (alpha,num) => {
        planet.position = new BABYLON.Vector3(planet.dist * Math.sin(alpha+num),  0, planet.dist * Math.cos(alpha+num));
        
        //planet.rotation.y += .03;
    }
    return planet;
}

function moveAllPlanet(alpha){
    for(let i = 0 ; i < planet.length ; i++){
        if(planet[i]!=undefined){
            planet[i].move(alpha,i);
        }
    }
    sRing.move(alpha)
}

function createSaturnRing(scene){
    var ring = BABYLON.MeshBuilder.CreateTorus("torus", {tessellation:32 ,thickness: 80, diameter: vectors[4][2]*2});
    ring.scaling = new BABYLON.Vector3(1,0.1,1)
    ring.rotation.z = -0.2;
    var ringMaterial = new BABYLON.StandardMaterial("ringSurface", scene);
    ring.material = ringMaterial;
    ring.position = new BABYLON.Vector3(vectors[4][0],25,vectors[4][1])
    ring.material.diffuseTexture = new BABYLON.Texture("images/SATURNERING.png");
    ring.dist =  Math.pow((Math.pow(ring.position.x,2) + Math.pow(ring.position.z,2)),0.5);
    ring.material.specularColor = new BABYLON.Color3(0, 0, 0);
    
    ring.move = (alpha) => {
        ring.position = new BABYLON.Vector3(ring.dist * Math.sin(alpha+4),  50, ring.dist * Math.cos(alpha+4));
    }
    return ring
}

function createTitle(scene){
    var title = BABYLON.MeshBuilder.CreateBox("title", { width:400, height:0.1, size: 400}, scene);
    title.checkCollisions = false;
    title.position = new BABYLON.Vector3(0, 300, 0); 
    title.rotation.y = -Math.PI/2
    let titleMaterial = new BABYLON.StandardMaterial("titleMaterial", scene);
    titleMaterial.diffuseTexture  = new BABYLON.Texture("images/TRON FEVER.png");
    titleMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    
    title.material = titleMaterial
    return title;
}

function createGround(scene) {
    var ground = BABYLON.MeshBuilder.CreateSphere("title", {diameter: 400, segments: 64}, scene);
        ground.position = new BABYLON.Vector3(0, -1000, 0); 
        ground.scaling = new BABYLON.Vector3(1, 0.001, 1); 
        let groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
        groundMaterial.diffuseTexture  = new BABYLON.Texture("images/ground.jpg");
        groundMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        ground.material = groundMaterial
        ground.name = "ground";
        ground.checkCollisions = false;
    /*
    const ground = BABYLON.SceneLoader.ImportMesh("Plane", "models/TronFloor/", "GroundSansObstacle.babylon", scene,  (newMeshes, particleSystems, skeletons) => {
        let ground = newMeshes[0];
        ground.checkCollisions = true;
        ground.position = new BABYLON.Vector3(0, 0, 0); 
        ground.scaling = new BABYLON.Vector3(9  ,9, 9);
        ground.name = "ground";
        ground.checkCollisions = false;
        
    return ground;
    });
    */
   return ground;
}

function createStadium(scene) {
    const stadium = BABYLON.SceneLoader.ImportMesh("Roof Shade", "models/TronStadium/", "TronArena.babylon", scene,  (newMeshes, particleSystems, skeletons) => {
        let stadium = newMeshes[0];
        stadium.checkCollisions = true;
        stadium.position = new BABYLON.Vector3(0, 0, 0); 
        stadium.scaling = new BABYLON.Vector3(4  ,2, 3);
        stadium.name = "stadium";
        stadium.checkCollisions = true;
    return stadium;
    });
}

function createSphere(scene) {
var sphere = BABYLON.Mesh.CreateSphere("sphere", {diameter: 100, segments: 64/*, sideOrientation: BABYLON.Mesh.DOUBLESIDE*/}, scene);
    sphere.checkCollisions = false;
    sphere.position = new BABYLON.Vector3(0, 0, 0); 
    sphere.name = "sphere";


    let sphereMaterial = new BABYLON.StandardMaterial("sphereMaterial", scene);
    sphereMaterial.diffuseColor  = new BABYLON.Color3.White;
    sphereMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    sphere.material = sphereMaterial;
    sphere.checkCollisions = false;


    return sphere;
}


function createRing(scene) {
    var ring = BABYLON.MeshBuilder.CreateTorus("ringg", {tessellation:256 ,thickness: 2, diameter: 400});
    ring.scaling = new BABYLON.Vector3(1,1,1)
    var ringMaterial = new BABYLON.StandardMaterial("ring", scene);
    /*ringMaterial.emissiveColor = new BABYLON.Color3.White;
    ringMaterial.glow = new BABYLON.GlowLayer("glowRing", scene, {blurKernelSize : 30});
    ringMaterial.glow.intensity = 0.5;
    ringMaterial.glow.addIncludedOnlyMesh(ring);
    */ring.material = ringMaterial;
    ring.position = new BABYLON.Vector3(0,0,0)
    ring.material.diffuseTexture = new BABYLON.Texture("images/RAINBOW.jpg");
    ring.material.specularColor = new BABYLON.Color3(0, 0, 0);
    ring.rotation.y = Math.PI;
    
    return ring
    }



function createLights(scene) {
    let light1 = new BABYLON.DirectionalLight("dir1", new BABYLON.Vector3(-1, -1, -1), scene);
    light1.position = new BABYLON.Vector3(-200, 200, -200);
    let light2 = new BABYLON.DirectionalLight("dir2", new BABYLON.Vector3(1, -1, 1), scene);
    light2.position = new BABYLON.Vector3(200, 200, 200);
    let light3 = new BABYLON.DirectionalLight("dir3", new BABYLON.Vector3(1, -1, -1), scene);
    light3.position = new BABYLON.Vector3(200, 200, -200);
    let light4 = new BABYLON.DirectionalLight("dir4", new BABYLON.Vector3(-1, -1, 1), scene);
    light4.position = new BABYLON.Vector3(-200, 200, 200);

}