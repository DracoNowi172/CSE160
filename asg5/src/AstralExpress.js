import * as THREE from '../lib/three.js-master/build/three.module.js';
import { OrbitControls } from '../lib/three.js-master/examples/jsm/controls/OrbitControls.js';
//import { OBJLoader } from '../lib/three.js-master/examples/jsm/loaders/OBJLoader.js';
//import { MTLLoader } from '../lib/three.js-master/examples/jsm/loaders/MTLLoader.js';
import { FBXLoader } from '../lib/three.js-master/examples/jsm/loaders/FBXLoader.js';

function main() {
    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(window.innerWidth, window.innerHeight); // Set size here to avoid resizing issues at load

    // Camera setup
    const fov = 75;
    const aspect = window.innerWidth / window.innerHeight;  // Use window dimensions instead of hardcoded aspect
    const near = 0.1;
    const far = 1000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 10, 20);

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 5, 0);
    controls.update();

    const scene = new THREE.Scene();

    // Skybox using equirectangular image
    const loader = new THREE.TextureLoader();
    const texture = loader.load('resources/images/Space.jpg', () => {
        const rt = new THREE.WebGLCubeRenderTarget(texture.image.height);
        rt.fromEquirectangularTexture(renderer, texture);
        scene.background = rt.texture;
    });

    // Playmat
    const woodTexture = loader.load('resources/images/yugiohPlaymat.jpg', function(texture) {
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
    });
    woodTexture.wrapS = THREE.RepeatWrapping;
    woodTexture.wrapT = THREE.RepeatWrapping;
    const planeGeo = new THREE.PlaneGeometry(30, 20);
    const planeMat = new THREE.MeshPhongMaterial({ map: woodTexture });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);

    // Cards' position and individual textures
    const cardGeo = new THREE.PlaneGeometry(2.9, 4.5);
    const cardTextures = [
        'resources/images/yugiohBackground.JPG',
        'resources/images/yugiohBackground.JPG',
        'resources/images/PomPomofTheTrailblaze.jpeg',
        'resources/images/yugiohBackground.JPG',
        'resources/images/yugiohBackground.JPG'
    ];

    const cardDetails = [
        { x: -8.3, y: 0.3, z: -2.6 },
        { x: -4.1, y: 0.3, z: -2.6 },
        { x: 0, y: 0.3, z: -2.6 },
        { x: 4.1, y: 0.3, z: -2.6 },
        { x: 8.3, y: 0.3, z: -2.6 }
    ];

    cardDetails.forEach((detail, index) => {
        const texture = loader.load(cardTextures[index]); // Load each card texture
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide
        });
        const card = new THREE.Mesh(cardGeo, material);
        card.position.set(detail.x, detail.y, detail.z);
        //necessary to make it face down
        card.rotation.x = Math.PI/2;
        //use Math.PI/2; to flip to defense mode
        card.rotation.y = Math.PI;
        //orient card to be player sided
        card.rotation.z = Math.PI;
        scene.add(card);
    });

    //Pendelum indicators
    const sphereTexture1 = loader.load('resources/images/PendulumRed.jpg');
    const sphereTexture2 = loader.load('resources/images/PendulumBlue.jpg');
    const sphereMaterial1 = new THREE.MeshPhongMaterial({ map: sphereTexture1 });
    const sphereMaterial2 = new THREE.MeshPhongMaterial({ map: sphereTexture2 });
    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);

    const sphere1 = new THREE.Mesh(sphereGeometry, sphereMaterial1);
    sphere1.position.set(12, 2, 3);
    sphere1.rotation.y = -Math.PI / 4; // spin to proper face
    const light1 = new THREE.PointLight(0xfc0f03, 21, 100); // Red Pendulum light
    light1.position.set(12, 2, 3);
    const sphere2 = new THREE.Mesh(sphereGeometry, sphereMaterial2);
    sphere2.position.set(-12, 2, 3);
    sphere2.rotation.y = -Math.PI / 4; // spin to proper face
    const light2 = new THREE.PointLight(0x036bfc, 21, 100); // Blue pendulum light
    light2.position.set(-12, 2, 3);
    scene.add(sphere1);
    scene.add(sphere2);
    scene.add(light1);
    scene.add(light2);


    //Millenium puzzle
    
    const pyramidGeometry = new THREE.ConeGeometry(1, 2, 4); // radius, height, radial segments
    pyramidGeometry.rotateY(Math.PI / 4); // Align the pyramid base to square
    const pyramidTexture = loader.load('resources/images/MilleniumPuzzle.JPG');
    const pyramidMaterial = new THREE.MeshPhongMaterial({
        map: pyramidTexture,
        side: THREE.DoubleSide
    });
    const pyramid = new THREE.Mesh(pyramidGeometry, pyramidMaterial);
    pyramid.position.set(10, 1, 9);
    //Attach a point light to the FBX model
                                            //color, intensity, 
    const pointLight = new THREE.PointLight(0xFFD700, 10, 10);
    pointLight.position.set(pyramid.position); //Set the light at the model's origin
    pyramid.add(pointLight); //This makes the light move with the model
    scene.add(pyramid);

    //Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 7, -4);
    scene.add(directionalLight);

    //helper function for model loading
    function loadFBXModel(scene, filePath, position, scale){
        const loader = new FBXLoader();
        loader.load(
            filePath, // path to the FBX file
            (object)=>{
                //This callback function is called when the load is completed
                scene.add(object); //Add the loaded object to the scene
                object.position.set(position[0], position[1], position[2]);//Set the position of the model
                object.rotation.y = Math.PI;//rotate to the proper face
                object.scale.set(scale, scale, scale);

                //Attach a point light to the FBX model
                                                        //color, intensity, 
                const pointLight = new THREE.PointLight(0xFF0000, 21, 100);
                pointLight.position.set(0, 0, 0); //Set the light at the model's origin
                object.add(pointLight); //This makes the light move with the model
                console.log('FBX model loaded successfully!');
            },
            (xhr)=>{
                //This function is called while loading is progressing
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            (error)=>{
                //This function is called if there is an error loading the model
                console.error('An error happened during loading the FBX model:', error);
            }
        );
    }
                        // x,y,z
    const pomposition = [0, .4, -2.4];
    //const monadoposition = [0, .4,, -5];
    loadFBXModel(scene, 'resources/models/pompom/source/PomPom.fbx', pomposition, 2.3);
    //loadFBXModel(scene, 'resources/models/monado/MonadoFinal.fbx', pomposition, .01);


    //Resize function to maintain aspect ratio and camera frustum
    function resizeRendererToDisplaySize(renderer){
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width||canvas.height !== height;
        if(needResize){
            renderer.setSize(width, height, false);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        }
    }

    //Render loop
    function render(time){
        //rotate the pyramid
        time *= 0.001;//convert time to seconds
        pyramid.rotation.y = time;
        sphere1.rotation.y = time;
        sphere2.rotation.y = time;
        if(resizeRendererToDisplaySize(renderer)){
            //update the canvas
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}
main();
