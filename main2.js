import * as THREE from 'three';

// Buat scene, kamera, dan renderer
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 100);
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('canvas'),
  antialias: true
});

// Buat terrain
const terrainGeometry = new THREE.PlaneGeometry(20, 20, 20, 20);
const terrainMaterial = new THREE.MeshBasicMaterial({ color: 0x444444 });
const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
scene.add(terrain);

// Atur kamera untuk melihat terrain
camera.position.set(0, 5, 0);
camera.lookAt(0, 0, 0);

// Render scene
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();