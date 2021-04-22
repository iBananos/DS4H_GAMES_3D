function createEnemie(scene,username,x,y,z,orientation,color) {
    //BABYLON.SceneLoader.ImportMesh("", "models/Tron/", "Tron_Motorcycle.babylon", scene,  (newMeshes, particleSystems, skeletons) => {
    //        let tron = newMeshes[0];
            let tron = BABYLON.MeshBuilder.CreateBox(username, { width:3, height:3, size : 3}, scene);
            let tronMaterial = new BABYLON.StandardMaterial(username+"Material", scene);
            tronMaterial.diffuseTexture = new BABYLON.Texture("models/Tron/Sphere_003_baked_EMIT.jpg");
            tronMaterial.emissiveTexture = new BABYLON.Texture("models/Tron/Sphere_003_baked_EMIT.jpg");
            /*if(displayEffects){
                tronMaterial.emissiveColor = new BABYLON.Color3(colorList[color].r,colorList[color].g,colorList[color].b);
                tronMaterial.glow = new BABYLON.GlowLayer("glow"+toString(color), scene, {blurKernelSize : 150});
                tronMaterial.glow.intensity = 0.2;
                tronMaterial.glow.addIncludedOnlyMesh(tron);
            }*/

            tron.material = tronMaterial;
            tron.color = color;
            tron.x = x;
            tron.y = y;
            tron.z = z;
            tron.base =  new BABYLON.Vector3(tron.x, tron.y, tron.z); 
            tron.baseRotationY = orientation;
            tron.baseRotationZ = -1.5708;
            tron.rotation.y = tron.baseRotationY;
            tron.frontVector = new BABYLON.Vector3(0, 0, 0);
            tron.checkCollisions = false;
            tron.position = new BABYLON.Vector3(tron.x,tron.y,tron.z);
       
            
            
            tron.move = (x,y,z) => {
                tron.position = new BABYLON.Vector3(x,y,z);
            }
            console.log("creation du tron enemis " , username)
            return tron;
    //    });
}