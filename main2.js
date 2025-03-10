import * as THREE from 'three';
import __BTCharacter from './coordinator/character'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'stats.js'

let stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

const colorLib = {
    meshLiner: 0x00FF00,
    frameLiner: 0xffff00
}

let camera, controls, scene, renderer;
let myCharacter;
let animationTime = 0;
let towardDirection, step = 500;
let directionMe, coordinateB, runningSpeed = 1.15, directionVector;
let offsetVector;
let isRunning = false;

// ########### CHARACTER PROPERTY
const params = {

	firstPerson: false,

	displayCollider: false,
	displayBVH: false,
	visualizeDepth: 10,
	gravity: - 30,
	playerSpeed: 10,
	physicsSteps: 5,

	reset: reset,

};

let clock;
let playerVelocity = new THREE.Vector3();
let environment, collider, visualizer, player;
let playerIsOnGround = false;
let fwdPressed = false, bkdPressed = false, lftPressed = false, rgtPressed = false;
let upVector = new THREE.Vector3( 0, 1, 0 );
let tempVector = new THREE.Vector3();
let tempVector2 = new THREE.Vector3();
let tempBox = new THREE.Box3();
let tempMat = new THREE.Matrix4();
let tempSegment = new THREE.Line3();

init();

function init() {

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x263238 / 2);
    scene.fog = new THREE.FogExp2(0x263238 / 2, 0.05);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 50 );
	camera.position.set( 10, 10, - 10 );
	camera.far = 100;
	camera.updateProjectionMatrix();
    window.camera = camera;

    clock = new THREE.Clock();

    // controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.listenToKeyEvents(window);
    controls.addEventListener( 'change', function() {
        // Get new target movement
        towardDirection = camera.quaternion;
        towardDirection.x = 0;
        towardDirection.z = 0;
        towardDirection.y = parseFloat(towardDirection.y.toFixed(3));
        towardDirection.w = parseFloat(towardDirection.w.toFixed(3));
        // directionVector = new THREE.Vector3().subVectors(camera.position, myCharacter.position).normalize().multiplyScalar(-1);

        // if(myCharacter.inst_model) {
        //     directionVector = new THREE.Vector3().subVectors(camera.position, myCharacter.inst_model.position).normalize().multiplyScalar(-5);
        // }

    } );

    controls.enableDamping = true;
    controls.enablePan = false;
    controls.dampingFactor = 0.05;

    controls.screenSpacePanning = false;

    controls.minDistance = 4;
    controls.maxDistance = 10;

    controls.maxPolarAngle = Math.PI / 3; // Max rotate to bottom
    controls.minPolarAngle = Math.PI / 3; // Max rotate to top

    stats = new Stats();
	document.body.appendChild( stats.dom );

    // ############################################################################################################################ WORLD
    // terrain
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = true;

    var terrain_geometry = new THREE.PlaneGeometry(2000, 2000, 200, 200);
    var terrain_material = new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true, wireframe: false });

    const terrain = new THREE.Mesh(terrain_geometry, terrain_material);
    terrain.receiveShadow = true;
    terrain.rotation.x = -Math.PI / 2;
    

    loader.load('assets/sand.jpg', function (texture) {
        
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


    // ############################################################################################################################ CHARACTER
    const player_geometry = new THREE.ConeGeometry( 5, 20, 32 ); 
    const player_material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
    player = new THREE.Mesh(player_geometry, player_material );
    // player = new THREE.Mesh(
	// 	new RoundedBoxGeometry( 1.0, 2.0, 1.0, 10, 0.5 ),
	// 	new THREE.MeshStandardMaterial()
    // );

    player.geometry.translate( 0, - 0.5, 0 );
	player.capsuleInfo = {
		radius: 0.5,
		segment: new THREE.Line3( new THREE.Vector3(), new THREE.Vector3( 0, - 1.0, 0.0 ) )
	};
	player.castShadow = true;
	player.receiveShadow = true;
	player.material.shadowSide = 2;
	scene.add( player );

    reset();
    



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

    let targetQuaternion;

    window.addEventListener( 'keyup', function ( e ) {

		switch ( e.code ) {

			case 'KeyW': fwdPressed = false; break;
			case 'KeyS': bkdPressed = false; break;
			case 'KeyD': rgtPressed = false; break;
			case 'KeyA': lftPressed = false; break;

		}

	} );

    document.addEventListener("keydown", function( e ) {

        // 'from walk to idle': __this.prepareCrossFade( __this.#action_walk, __this.#action_idle, 1.0 );
        // 'from idle to walk': __this.prepareCrossFade( __this.#action_idle, __this.#action_walk, 0.5 );
        // 'from walk to run': __this.prepareCrossFade( __this.#action_walk, __this.#action_run, 2.5 );
        // 'from run to walk': __this.prepareCrossFade( __this.#action_run, __this.#action_walk, 5.0 );

        switch ( e.code ) {

			case 'KeyW': fwdPressed = true; break;
			case 'KeyS': bkdPressed = true; break;
			case 'KeyD': rgtPressed = true; break;
			case 'KeyA': lftPressed = true; break;
			case 'Space':
				if ( playerIsOnGround ) {

					playerVelocity.y = 10.0;
					playerIsOnGround = false;

				}

				break;

		}


        targetQuaternion = camera.quaternion;

        // if (keyCode == 87) { // W
            
        // } else if (keyCode == 83) { // S
        //     location.reload();
        // }

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
        
        // }
        
    }, false);

    renderer.setAnimationLoop(render);
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

function xequals( v, w, epsilon = Number.EPSILON ) {

    return ( ( Math.abs( v.x - w.x ) < epsilon ) && ( Math.abs( v.y - w.y ) < epsilon ) && ( Math.abs( v.z - w.z ) < epsilon ) );

}

function animate() {

    // stats.begin();

    // myCharacter.animationCharacter();

    controls.update();

    // animationTime += 0.01;

    // myCharacter.quaternion.rotateTowards(towardDirection, step);

    // const directionVector = new THREE.Vector3().subVectors(camera.position, myCharacter.position).normalize();
    // directionMe = directionVector.multiplyScalar(runningSpeed * -1);

    // if(isRunning) {
    //     //
    //     // camera.position.add(directionVector.x , 0, directionVector.z);
        
    // }

    // cube.position.set(directionVector.x , 0, directionVector.z);

    // if( xequals(cube.position, camera.position, 1) ) {
    //     isRunning = false;
    // }






    // camera.position.lerp(cube.position, animationTime);

    // camera.position.lerp(new THREE.Vector3().subVectors(camera.position, myCharacter.position).normalize().multiplyScalar(-5), .5);

    // if(myCharacter.inst_model && directionMe) {

    //     const keyframes = myCharacter.currentKeyframe;

    //     // Character follow camera direction
    //     myCharacter.inst_model.quaternion.rotateTowards(towardDirection, step);

    //     // Cursor control
    //     cube.position.set(directionVector.x , 0, directionVector.z);

    //     if(isRunning) {
    //         console.clear();
    //         for (let i = 0; i < keyframes.length - 1; i++) {
    //             if (animationTime >= keyframes[i].time && animationTime < keyframes[i + 1].time) {
    //                 const t = (animationTime - keyframes[i].time) / (keyframes[i + 1].time - keyframes[i].time); // Lerp interpolation factor
    //                 const lerpedPosition = keyframes[i].position.clone().lerp(keyframes[i + 1].position, t);
    //                 myCharacter.inst_model.position.copy(lerpedPosition);
    //                 // camera.position.copy(lerpedPosition);
    //                 // camera.position.copy(myCharacter.inst_model.position);
    //                 break;
    //             }
    //         }

    //     }

    //     if( xequals(cube.position, myCharacter.inst_model.position, 1) ) {
                
    //         myCharacter.action_stop();
    //         isRunning = false;
    //     }

    // }

    

    // if(myCharacter.inst_model && directionMe) {

    //     const keyframes = myCharacter.currentKeyframe;

    //     // console.clear();
    //     // console.log(keyframes);

    

    // }

    // if(myCharacter.inst_model && directionMe) {
        
        
    //     console.clear();
    //     // camera.position.copy(myCharacter.inst_model.position).add(offsetVector);

    //     // camera.lookAt(myCharacter.inst_model.position);

    //     // if( xequals(cube.position, myCharacter.inst_model.position, 1) ) {
            
    //     //     myCharacter.action_stop();
    //     //     isRunning = false;

    //     // }

    //     // if( !cube.position.equals(myCharacter.inst_model.position) ) {

    //     //     // myCharacter.inst_model.position.lerpVectors(myCharacter.inst_model.position, cube.position, .025);

            
    //     //     console.log(myCharacter.inst_model.position);
    //     //     console.log(cube.position);

    //     // }

    // }

    render();

    // stats.end();

}

function reset() {

	playerVelocity.set( 0, 0, 0 );
	// player.position.set( 15.75, - 3, 30 );
    player.position.set( 0, 0, 0 );
	camera.position.sub( controls.target );
	controls.target.copy( player.position );
	camera.position.add( player.position );
	controls.update();

}

function render() {

    // stats.update();

    // requestAnimationFrame( render );

    const delta = Math.min( clock.getDelta(), 0.1 );
	if ( params.firstPerson ) {

		controls.maxPolarAngle = Math.PI;
		controls.minDistance = 1e-4;
		controls.maxDistance = 1e-4;

	} else {

		controls.maxPolarAngle = Math.PI / 2;
		controls.minDistance = 1;
		controls.maxDistance = 20;

	}

    if ( collider ) {

		collider.visible = params.displayCollider;
		visualizer.visible = params.displayBVH;

		const physicsSteps = params.physicsSteps;

		for ( let i = 0; i < physicsSteps; i ++ ) {

			// updatePlayer( delta / physicsSteps );

		}

	}

    renderer.render(scene, camera);

}

function updatePlayer( delta ) {

	if ( playerIsOnGround ) {

		playerVelocity.y = delta * params.gravity;

	} else {

		playerVelocity.y += delta * params.gravity;

	}

	player.position.addScaledVector( playerVelocity, delta );

	// move the player
	const angle = controls.getAzimuthalAngle();
	if ( fwdPressed ) {

		tempVector.set( 0, 0, - 1 ).applyAxisAngle( upVector, angle );
		player.position.addScaledVector( tempVector, params.playerSpeed * delta );

	}

	if ( bkdPressed ) {

		tempVector.set( 0, 0, 1 ).applyAxisAngle( upVector, angle );
		player.position.addScaledVector( tempVector, params.playerSpeed * delta );

	}

	if ( lftPressed ) {

		tempVector.set( - 1, 0, 0 ).applyAxisAngle( upVector, angle );
		player.position.addScaledVector( tempVector, params.playerSpeed * delta );

	}

	if ( rgtPressed ) {

		tempVector.set( 1, 0, 0 ).applyAxisAngle( upVector, angle );
		player.position.addScaledVector( tempVector, params.playerSpeed * delta );

	}

	player.updateMatrixWorld();

	// adjust player position based on collisions
	const capsuleInfo = player.capsuleInfo;
	tempBox.makeEmpty();
	tempMat.copy( collider.matrixWorld ).invert();
	tempSegment.copy( capsuleInfo.segment );

	// get the position of the capsule in the local space of the collider
	tempSegment.start.applyMatrix4( player.matrixWorld ).applyMatrix4( tempMat );
	tempSegment.end.applyMatrix4( player.matrixWorld ).applyMatrix4( tempMat );

	// get the axis aligned bounding box of the capsule
	tempBox.expandByPoint( tempSegment.start );
	tempBox.expandByPoint( tempSegment.end );

	tempBox.min.addScalar( - capsuleInfo.radius );
	tempBox.max.addScalar( capsuleInfo.radius );

	collider.geometry.boundsTree.shapecast( {

		intersectsBounds: box => box.intersectsBox( tempBox ),

		intersectsTriangle: tri => {

			// check if the triangle is intersecting the capsule and adjust the
			// capsule position if it is.
			const triPoint = tempVector;
			const capsulePoint = tempVector2;

			const distance = tri.closestPointToSegment( tempSegment, triPoint, capsulePoint );
			if ( distance < capsuleInfo.radius ) {

				const depth = capsuleInfo.radius - distance;
				const direction = capsulePoint.sub( triPoint ).normalize();

				tempSegment.start.addScaledVector( direction, depth );
				tempSegment.end.addScaledVector( direction, depth );

			}

		}

	} );

	// get the adjusted position of the capsule collider in world space after checking
	// triangle collisions and moving it. capsuleInfo.segment.start is assumed to be
	// the origin of the player model.
	const newPosition = tempVector;
	newPosition.copy( tempSegment.start ).applyMatrix4( collider.matrixWorld );

	// check how much the collider was moved
	const deltaVector = tempVector2;
	deltaVector.subVectors( newPosition, player.position );

	// if the player was primarily adjusted vertically we assume it's on something we should consider ground
	playerIsOnGround = deltaVector.y > Math.abs( delta * playerVelocity.y * 0.25 );

	const offset = Math.max( 0.0, deltaVector.length() - 1e-5 );
	deltaVector.normalize().multiplyScalar( offset );

	// adjust the player model
	player.position.add( deltaVector );

	if ( ! playerIsOnGround ) {

		deltaVector.normalize();
		playerVelocity.addScaledVector( deltaVector, - deltaVector.dot( playerVelocity ) );

	} else {

		playerVelocity.set( 0, 0, 0 );

	}

	// adjust the camera
	camera.position.sub( controls.target );
	controls.target.copy( player.position );
	camera.position.add( player.position );

	// if the player has fallen too far below the level reset their position to the start
	if ( player.position.y < - 25 ) {

		reset();

	}

}