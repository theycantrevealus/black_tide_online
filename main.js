import * as THREE from 'three';
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

init();

function init() {

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcccccc);
    scene.fog = new THREE.FogExp2(0xcccccc, 0.002);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, .1, 1000);
    camera.position.set(400, 400, 0);

    // controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.listenToKeyEvents(window);

    controls.enableDamping = true;
    controls.enablePan = false;
    controls.dampingFactor = 0.05;

    controls.screenSpacePanning = false;

    controls.minDistance = 50;
    controls.maxDistance = 100;

    controls.maxPolarAngle = Math.PI / 2.5;

    // world

    const geometry = new THREE.ConeGeometry(10, 30, 4, 1);
    const material = new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true });

    // terrain
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = true;

    var terrain_geometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
    var terrain_material = new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true });

    const terrain = new THREE.Mesh(terrain_geometry, terrain_material);
    terrain.receiveShadow = true;
    terrain.rotation.x = -Math.PI / 2;
    

    loader.load('assets/grass.jpg', function (texture) {
        
        texture.repeat.x = 1;
        texture.repeat.y = 1;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(50, 50);
        terrain_material.map = texture;
        terrain_material.needsUpdate = true;
        terrain_material.flatShading = false;

    }, function (xhr) {
        
        //

    }, function (xhr) {
        
        console.log('An error happened', xhr);

    });

    const peak = 10;
    const vertices = terrain.geometry.attributes.position.array;
    for (let i = 0; i <= vertices.length; i += 3) {

        vertices[i + 2] = peak * Math.random();

    }

    terrain.geometry.attributes.position.needsUpdate = true;
    terrain.geometry.computeVertexNormals();

    scene.add(terrain);
    
    for (let i = 0; i < 1; i ++) {

        const mesh = new THREE.Mesh(geometry, material);
        // mesh.position.x = Math.random() * 1600 - 800;
        mesh.position.x = 0;

        mesh.position.y = 15;

        // mesh.position.z = Math.random() * 1600 - 800;
        mesh.position.z = 0;
        
        mesh.updateMatrix();
        mesh.matrixAutoUpdate = false;
        scene.add(mesh);

    }

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

    controls.update();
    render();

    stats.end();

}

function render() {

    renderer.render(scene, camera);

}