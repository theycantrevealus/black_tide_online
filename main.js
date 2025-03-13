import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import Stats from 'stats.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { MeshBVH, MeshBVHHelper, StaticGeometryGenerator } from 'three-mesh-bvh';
import __BTCharacter from './coordinator/character';

const params = {

	firstPerson: false,

	displayCollider: false,
	displayBVH: false,
	visualizeDepth: 10,
	gravity: - 30,
	playerSpeed: 5,
	playerSpeedForward: 5,
	playerSpeedSide: 2.5,
	playerSpeedBackward: 2,
	physicsSteps: 10,

	reset: reset,

};

let CharacterLoad;
let labelRenderer;
let renderer, camera, scene, clock, gui, stats;
let environment, collider, visualizer, player, controls;
let playerIsOnGround = false;
let fwdPressed = false, bkdPressed = false, lftPressed = false, rgtPressed = false, shiftPressed = false, ctrlPressed = false;
let playerVelocity = new THREE.Vector3();
let upVector = new THREE.Vector3( 0, 1, 0 );
let tempVector = new THREE.Vector3();
let tempVector2 = new THREE.Vector3();
let tempBox = new THREE.Box3();
let tempMat = new THREE.Matrix4();
let tempSegment = new THREE.Line3();
let step = 500;

init();
render();

async function init() {

	// Dark Color
	// const bgColor = 0x263238 / 2;

	// Light Color
	const bgColor = 0x00e0e0e0  / 2;

	// renderer setup
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setClearColor( bgColor, 1 );
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	document.body.appendChild( renderer.domElement );

	labelRenderer = new CSS2DRenderer();
	labelRenderer.setSize( window.innerWidth, window.innerHeight );
	labelRenderer.domElement.style.position = 'absolute';
	labelRenderer.domElement.style.top = '0px';
	document.body.appendChild( labelRenderer.domElement );

	// scene setup
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog( bgColor, 50, 70 );

	// lights
	const light = new THREE.DirectionalLight( 0xffffff, 3 );
	light.position.set( 1, 1.5, 1 ).multiplyScalar( 50 );
	light.shadow.mapSize.setScalar( 2048 );
	light.shadow.bias = - 1e-4;
	light.shadow.normalBias = 0.05;
	light.castShadow = true;

	const shadowCam = light.shadow.camera;
	shadowCam.bottom = shadowCam.left = - 30;
	shadowCam.top = 30;
	shadowCam.right = 45;

	scene.add( light );
	scene.add( new THREE.HemisphereLight( 0xffffff, 0x223344, 0.4 ) );

	// camera setup
	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 50 );
	camera.position.set( 10, 10, - 10 );
	camera.far = 100;
	camera.updateProjectionMatrix();
	window.camera = camera;

	clock = new THREE.Clock();

	controls = new OrbitControls( camera, labelRenderer.domElement );

	// stats setup
	stats = new Stats();
	document.body.appendChild( stats.dom );

	loadColliderEnvironment();

	// character
	// player = new THREE.Mesh(
	// 	new RoundedBoxGeometry( 1.0, 2.0, 1.0, 10, 0.5 ),
	// 	new THREE.MeshStandardMaterial()
	// );

    CharacterLoad = new __BTCharacter( scene, renderer, camera );
    await CharacterLoad.loadModel().then(async () => {
        
        player = await CharacterLoad.inst_model;

		const nickName = document.createElement( 'div' );
		nickName.className = 'label';
		nickName.textContent = 'tatangtanaka';
		nickName.style.backgroundColor = 'transparent';
		nickName.style.position = 'absolute';
		nickName.style.whiteSpace = 'pre';
		nickName.style.width = '150px';
		nickName.style.textShadow = '0px 0px 16px #000';
		nickName.style.left = '-75px';
		nickName.style.textAlign = 'center';
		nickName.style.fontSize = '10pt';
		nickName.style.color = '#7be575';
		nickName.style.padding = '2px';

		const nickNameLabel = new CSS2DObject( nickName );
		nickNameLabel.position.set( 0, 6, 0 );
		nickNameLabel.center.set( 0, 1 );
		player.add( nickNameLabel );
		nickNameLabel.layers.set( 0 );

		const rankName = document.createElement( 'div' );
		rankName.className = 'label';
		rankName.textContent = '<4th RankAsmodian Soldiers>';
		rankName.style.backgroundColor = 'transparent';
		rankName.style.position = 'absolute';
		rankName.style.whiteSpace = 'pre';
		rankName.style.width = '180px';
		rankName.style.textShadow = '0px 0px 16px #000';
		rankName.style.left = '-90px';
		rankName.style.textAlign = 'center';
		rankName.style.fontSize = '10pt';
		rankName.style.color = '#fff';
		rankName.style.padding = '2px';

		const rankLabel = new CSS2DObject( rankName );
		rankLabel.position.set( 0, 5, 0 );
		rankLabel.center.set( 0, 1 );
		player.add( rankLabel );
		rankLabel.layers.set( 0 );

		const hp_bar = document.createElement( 'div' );
		hp_bar.className = 'label';
		hp_bar.style.backgroundImage = 'url("./assets/hp.png")';
		hp_bar.style.backgroundSize = "120px 20px";
		hp_bar.style.backgroundRepeat = 'no-repeat';
		hp_bar.style.position = 'absolute';
		hp_bar.style.whiteSpace = 'pre';
		hp_bar.style.width = '120px';
		hp_bar.style.height = '20px';
		hp_bar.style.textShadow = '0px 0px 16px #000';
		hp_bar.style.left = '-50px';
		hp_bar.style.textAlign = 'center';
		hp_bar.style.fontSize = '10pt';
		hp_bar.style.color = '#fff';
		hp_bar.style.padding = '2px';

		const hp_bar_container = new CSS2DObject( hp_bar );
		hp_bar_container.position.set( 0, -2, 0 );
		hp_bar_container.center.set( 0, 1 );
		player.add( hp_bar_container );
		hp_bar_container.layers.set( 0 );

		// document.body.prependChild( CharacterLoad.inst_label.domElement );

    });
	
	reset();

	// dat.gui
	// gui = new GUI();
	// gui.add( params, 'firstPerson' ).onChange( v => {

	// 	if ( ! v ) {

	// 		camera
	// 			.position
	// 			.sub( controls.target )
	// 			.normalize()
	// 			.multiplyScalar( 10 )
	// 			.add( controls.target );

	// 	}

	// } );

	// const visFolder = gui.addFolder( 'Visualization' );
	// visFolder.add( params, 'displayCollider' );
	// visFolder.add( params, 'displayBVH' );
	// visFolder.add( params, 'visualizeDepth', 1, 20, 1 ).onChange( v => {

	// 	visualizer.depth = v;
	// 	visualizer.update();

	// } );
	// visFolder.open();

	// const physicsFolder = gui.addFolder( 'Player' );
	// physicsFolder.add( params, 'physicsSteps', 0, 30, 1 );
	// physicsFolder.add( params, 'gravity', - 100, 100, 0.01 ).onChange( v => {

	// 	params.gravity = parseFloat( v );

	// } );
	// physicsFolder.add( params, 'playerSpeed', 1, 20 );
	// physicsFolder.open();

	// gui.add( params, 'reset' );
	// gui.open();

	window.addEventListener( 'resize', function () {

		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize( window.innerWidth, window.innerHeight );
		labelRenderer.setSize( window.innerWidth, window.innerHeight );

	}, false );

	window.addEventListener( 'keydown', function ( e ) {

        switch ( e.code ) {

			case 'KeyW':
				fwdPressed = true;
				params.playerSpeed = params.playerSpeedForward;
				break;
			case 'KeyS':
				bkdPressed = true;
				params.playerSpeed = params.playerSpeedBackward;
				break;
			case 'KeyD':
				rgtPressed = true;
				params.playerSpeed = params.playerSpeedSide;
				break;
			case 'KeyA':
				lftPressed = true;
				params.playerSpeed = params.playerSpeedSide;
				break;
			case 'ShiftLeft': shiftPressed = true ;break;
			case 'ControlLeft': ctrlPressed = true ;break;
			case 'Space':
				CharacterLoad.action_jump();
				
				if ( playerIsOnGround ) {

					playerVelocity.y = 10.0;
					playerIsOnGround = false;

				}

				break;

		}

	} );

	window.addEventListener( 'keyup', function ( e ) {

		// CharacterLoad.action_stop();

		switch ( e.code ) {

			case 'KeyW': fwdPressed = false; break;
			case 'KeyS': bkdPressed = false; break;
			case 'KeyD': rgtPressed = false; break;
			case 'KeyA': lftPressed = false; break;
			case 'ShiftLeft': shiftPressed = false ;break;
			case 'ControlLeft': ctrlPressed = false ;break;

		}

	} );

}

function loadColliderEnvironment() {

	new GLTFLoader()
		.load( './assets/maps/mountain/snowy_mountain_-_terrain.glb', res => {
		// .load( './assets/maps/warkarma/scene.gltf', res => {
		

			const gltfScene = res.scene;
			// gltfScene.scale.setScalar( 1 );
			gltfScene.scale.setScalar( 1900 );

			const box = new THREE.Box3();
			box.setFromObject( gltfScene );
			box.getCenter( gltfScene.position ).negate();
			gltfScene.updateMatrixWorld( true );

			// visual geometry setup
			const toMerge = {};
			const texture = new THREE.TextureLoader().load('./assets/maps/mountain/textures/material_0_baseColor.jpeg' );
			gltfScene.traverse( c => {

				// if (
				// 	/Boss/.test( c.name ) ||
				// /Enemie/.test( c.name ) ||
				// /Shield/.test( c.name ) ||
				// /Sword/.test( c.name ) ||
				// /Character/.test( c.name ) ||
				// /Gate/.test( c.name ) ||

				// // spears
				// /Cube/.test( c.name ) ||

				// // pink brick
				// c.material && c.material.color.r === 1.0
				// ) {

				// 	return;

				// }

				if ( c.isMesh ) {

					const hex = c.material.color.getHex();
					c.castShadow = true;
					c.receiveShadow = true;
					toMerge[ hex ] = toMerge[ hex ] || [];
					toMerge[ hex ].push( c );

				}

			} );

			environment = new THREE.Group();
			for ( const hex in toMerge ) {

				const arr = toMerge[ hex ];
				const visualGeometries = [];
				arr.forEach( mesh => {

					if ( mesh.material.emissive.r !== 0 ) {

						environment.attach( mesh );

					} else {

						const geom = mesh.geometry.clone();
						geom.applyMatrix4( mesh.matrixWorld );
						visualGeometries.push( geom );

					}

				} );

				if ( visualGeometries.length ) {

					const newGeom = BufferGeometryUtils.mergeGeometries( visualGeometries );
					// const newMesh = new THREE.Mesh( newGeom, new THREE.MeshStandardMaterial( { color: parseInt( hex ), shadowSide: 2 } ) );
					const newMesh = new THREE.Mesh( newGeom, new THREE.MeshStandardMaterial( { map: texture } ) );
					newMesh.castShadow = true;
					newMesh.receiveShadow = true;
					newMesh.material.shadowSide = 2;

					environment.add( newMesh );

				}

			}

			const staticGenerator = new StaticGeometryGenerator( environment );
			staticGenerator.attributes = [ 'position' ];

			const mergedGeometry = staticGenerator.generate();
			mergedGeometry.boundsTree = new MeshBVH( mergedGeometry );

			collider = new THREE.Mesh( mergedGeometry );
			collider.material.wireframe = true;
			collider.material.opacity = 0.5;
			collider.material.transparent = true;

			visualizer = new MeshBVHHelper( collider, params.visualizeDepth );
			scene.add( visualizer );
			scene.add( collider );
			scene.add( environment );

		} );

}

function reset() {

    if( player ) {

        playerVelocity.set( 0, 0, 0 );
		// Dungeon
		// player.position.set( 15.75, 10 , 30 );

		// Desert
		// player.position.set( 31, -138 , 28 );

		// Mountain - Field
		// player.position.set( 104, -104 , -24 );
		
		// Mountain - Cliff
		// player.position.set( 241, -50 , 41 );

		// Mountain - Top
		player.position.set( 310, -8 , 37 );

        camera.position.sub( controls.target );
        controls.target.copy( player.position );
        camera.position.add( player.position );
        controls.update();

    }

}

function updatePlayer( delta ) {


    if( player ) {

		if(playerVelocity.y > 0) {
			
			// CharacterLoad.action_jump();

		}

        if ( playerIsOnGround ) {

            playerVelocity.y = delta * params.gravity;

        } else {

            playerVelocity.y += delta * params.gravity;

        }

        player.position.addScaledVector( playerVelocity, delta );

        // move the player
        const angle = controls.getAzimuthalAngle();
        if ( fwdPressed ) {

			CharacterLoad.action_run();

            tempVector.set( 0, 0, - 1 ).applyAxisAngle( upVector, angle );
            player.position.addScaledVector( tempVector, params.playerSpeed * delta );

        }

        if ( bkdPressed ) {

			CharacterLoad.action_run_back();

            tempVector.set( 0, 0, 1 ).applyAxisAngle( upVector, angle );
            player.position.addScaledVector( tempVector, params.playerSpeed * delta );

        }

        if ( lftPressed ) {

			if( fwdPressed ) {

				CharacterLoad.action_run();
				params.playerSpeed = params.playerSpeedForward;
				
			} else if ( bkdPressed ) {

				CharacterLoad.action_run_back();
				params.playerSpeed = params.playerSpeedBackward;

			} else {

				CharacterLoad.action_run_left();

			}

            tempVector.set( - 1, 0, 0 ).applyAxisAngle( upVector, angle );
            player.position.addScaledVector( tempVector, params.playerSpeed * delta );

        }

        if ( rgtPressed ) {

			if( fwdPressed ) {

				CharacterLoad.action_run();
				params.playerSpeed = params.playerSpeedForward;

			} else if ( bkdPressed ) {

				CharacterLoad.action_run_back();
				params.playerSpeed = params.playerSpeedBackward;

			} else {

				CharacterLoad.action_run_right();

			}

            tempVector.set( 1, 0, 0 ).applyAxisAngle( upVector, angle );
            player.position.addScaledVector( tempVector, params.playerSpeed * delta );

        }

		if ( playerVelocity.y <= 0 && !fwdPressed && !bkdPressed && !lftPressed && !rgtPressed) {

			CharacterLoad.action_idle();

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

		// player.quaternion.rotateTowards(deltaVector, step);

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
		// console.clear();
		// console.log( JSON.stringify( player.position ) );

        // if the player has fallen too far below the level reset their position to the start
        if ( player.position.y < - 305 ) {

            reset();

        }

    }

}

function render() {

	stats.update();
	requestAnimationFrame( render );

    if( CharacterLoad && player ) {
        
        CharacterLoad.animationCharacter();

		const cameraQuaternion = camera.quaternion;
		const oppositeQuaternion = new THREE.Quaternion(-cameraQuaternion.x, -cameraQuaternion.y, -cameraQuaternion.z, -cameraQuaternion.w);
		oppositeQuaternion.x = 0;
		oppositeQuaternion.z = 0;


		if(!ctrlPressed) {

			player.quaternion.rotateTowards(oppositeQuaternion, step);
			
		}

    }

	const delta = Math.min( clock.getDelta(), 0.1 );
	if ( params.firstPerson ) {

		controls.maxPolarAngle = Math.PI;
		controls.minDistance = 1e-4;
		controls.maxDistance = 1e-4;
		

	} else {

		// controls.maxPolarAngle = Math.PI / 2;
		controls.maxPolarAngle = Math.PI / 3; // Max rotate to bottom
    	controls.minPolarAngle = Math.PI / 4; // Max rotate to top
		controls.minDistance = 4;
    	controls.maxDistance = 20;

	}

	if ( collider ) {

        collider.visible = params.displayCollider;
		visualizer.visible = params.displayBVH;

		const physicsSteps = params.physicsSteps;

		for ( let i = 0; i < physicsSteps; i ++ ) {

			updatePlayer( delta / physicsSteps );

		}

	}

	// TODO: limit the camera movement based on the collider
	// raycast in direction of camera and move it if it's further than the closest point

	controls.update();

	renderer.render( scene, camera );
	labelRenderer.render( scene, camera );

}
