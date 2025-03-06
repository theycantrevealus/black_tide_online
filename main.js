import * as THREE from 'three';
import __BTCharacter from './coordinator/character'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'stats.js'

const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

const colorLib = {
    meshLiner: 0x00FF00,
    frameLiner: 0xffff00
}

let camera, controls, scene, renderer;
let myCharacter;

init();

function init() {

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcccccc);
    scene.fog = new THREE.FogExp2(0xcccccc, 0.05);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    

    camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, .1, 1000);
    camera.position.set(40, 40, 0);

    // controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.listenToKeyEvents(window);

    controls.enableDamping = true;
    controls.enablePan = false;
    controls.dampingFactor = 0.05;

    controls.screenSpacePanning = false;

    controls.minDistance = 5;
    controls.maxDistance = 10;

    controls.maxPolarAngle = Math.PI / 3; // Max rotate to bottom
    controls.minPolarAngle = Math.PI / 3; // Max rotate to top

    // world

    const geometry = new THREE.ConeGeometry(10, 30, 5, 1);
    const material = new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true });

    // terrain
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = true;

    var terrain_geometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
    var terrain_material = new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true, wireframe: false });

    const terrain = new THREE.Mesh(terrain_geometry, terrain_material);
    terrain.receiveShadow = true;
    terrain.rotation.x = -Math.PI / 2;
    

    loader.load('assets/grass.jpg', function (texture) {
        
        texture.repeat.x = 1;
        texture.repeat.y = 1;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(500, 500);
        terrain_material.map = texture;
        terrain_material.needsUpdate = true;
        terrain_material.flatShading = false;

    }, function (xhr) {
        
        //

    }, function (xhr) {
        
        console.log('An error happened', xhr);

    });

    const peak = 0;
    const vertices = terrain.geometry.attributes.position.array;
    for (let i = 0; i <= vertices.length; i += 3) {

        vertices[i + 2] = peak * Math.random();

    }

    terrain.geometry.attributes.position.needsUpdate = true;
    terrain.geometry.computeVertexNormals();

    scene.add(terrain);


    // character
    myCharacter = new __BTCharacter( scene, renderer, camera );
    myCharacter.loadModel()
    



    // lights
    const dirLight1 = new THREE.DirectionalLight(0x00CCFFFF, 3);
    dirLight1.position.set(1, 1, 1);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x002288, 3);
    dirLight2.position.set(- 1, - 1, - 1);
    dirLight2.castShadow = true;
    scene.add(dirLight2);

    const ambientLight = new THREE.AmbientLight(0x555555);
    scene.add(ambientLight);

    const runningSpeed = .85;

    let targetQuaternion = camera.quaternion;

    document.addEventListener("keyup", function(event) {
        myCharacter.action_stop();
    });

    document.addEventListener("keydown", function(event) {
        var keyCode = event.which;

        // 'from walk to idle': __this.prepareCrossFade( __this.#action_walk, __this.#action_idle, 1.0 );
        // 'from idle to walk': __this.prepareCrossFade( __this.#action_idle, __this.#action_walk, 0.5 );
        // 'from walk to run': __this.prepareCrossFade( __this.#action_walk, __this.#action_run, 2.5 );
        // 'from run to walk': __this.prepareCrossFade( __this.#action_run, __this.#action_walk, 5.0 );

        // const cameraDirection = camera.getWorldDirection(getCameraRotate);
        // console.log(cameraDirection);
        // const {x, y, z, w} = targetQuaternion;
        // console.clear();
        // console.table({x, y, z, w});
        // const {x, y, z} = mesh.quaternion;
        // console.table({x, y, z});
        // console.log(`X : ${targetQuaternion.x} compare ${mesh.quaternion.x}`);
        // console.log(`Y : ${targetQuaternion.y} compare ${mesh.quaternion.y}`);
        // console.log(`Z : ${targetQuaternion.z} compare ${mesh.quaternion.z}`);
        // console.log(`W : ${targetQuaternion.w} compare ${mesh.quaternion.w}`);

        if (keyCode == 87) { // W
            if (!myCharacter.inst_model.quaternion.equals(targetQuaternion)) {
            
                var step = 2000;
                const towardDirection = targetQuaternion;
                towardDirection.x = 0;
                towardDirection.z = 0;
                myCharacter.inst_model.quaternion.rotateTowards(towardDirection, step);
                myCharacter.action_walk();
            }
        }

        // let direction = 0;
        // if (keyCode == 87) { // W
        //     direction = runningSpeed * -.05;
        //     myCharacter.inst_model.translateX(direction);
        //     // camera.position.addScaledVector(getCameraRotate, runningSpeed);
        // } else if (keyCode == 83) { // S
        //     myCharacter.inst_model.translateX(runningSpeed);
        // } else if (keyCode == 65) { //A
        //     myCharacter.inst_model.translateZ(runningSpeed);
        // } else if (keyCode == 68) { // D
        //     myCharacter.inst_model.translateZ(runningSpeed * -1);
        // } else if (keyCode == 32) { // Space
        //     // cube.position.set(0, 0, 0);
        // }
        
        // camera.position.x = mesh.position.x;
        // camera.position.z = mesh.position.z + 10;
        camera.lookAt(myCharacter.inst_model.position);
        
    }, false);

    renderer.setAnimationLoop(animate);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    //

    window.addEventListener('resize', onWindowResize);

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}


function animate() {

    stats.begin();

    myCharacter.animationCharacter();

    controls.update();
    render();

    stats.end();

}

function render() {

    renderer.render(scene, camera);

}