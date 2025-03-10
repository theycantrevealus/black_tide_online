// import * as THREE from 'three';

// // Scene Setup
// const scene = new THREE.Scene();
// const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// camera.position.set(0, 0, 0);
// const renderer = new THREE.WebGLRenderer();
// renderer.setSize(window.innerWidth, window.innerHeight);
// document.body.appendChild(renderer.domElement);

// // Create a cube with initial position
// const geometry = new THREE.BoxGeometry(.5, .5, 1);
// const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
// const cube = new THREE.Mesh(geometry, material);
// scene.add(cube);

// // Keyframe animation using lerp
// let animationTime = 0;
// const keyframes = [
//     { time: 0, position: new THREE.Vector3(-1, 0, 0) },
//     { time: 5, position: new THREE.Vector3(1, 0, 0) },
//     { time: 10, position: new THREE.Vector3(-1, 0, 0) },
// ];

// function animate() {
//     requestAnimationFrame(animate);
    
//     animationTime += 0.1; // Adjust animation speed

//     // Find the current keyframe based on time
//     for (let i = 0; i < keyframes.length - 1; i++) {
//         if (animationTime >= keyframes[i].time && animationTime < keyframes[i + 1].time) {
//             const t = (animationTime - keyframes[i].time) / (keyframes[i + 1].time - keyframes[i].time); // Lerp interpolation factor
//             const lerpedPosition = keyframes[i].position.clone().lerp(keyframes[i + 1].position, t);
//             cube.position.copy(lerpedPosition);
//             break;
//         }
//     }

//     renderer.render(scene, camera);
// }

// animate();