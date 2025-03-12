import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export default class __BTCharacter {
    groupCharInfo;
    labelRenderer;
    #nickName = 'Tatang Tanaka';
    #HP = 0;
    #SP = 0;
    #EXP = 0;
    #LEVEL = 0;
    #POS_X = 0;
    #POS_Y = 0;
    #POS_Z = 0;

    charLoader;
    #action_idle;
    #action_walk;
    #action_run;
    #action_jump;

    #weight_idle;
    #weight_walk;
    #weight_run;

    #actions = [];
    #settings;
    motion = {};
    model;
    #skeleton;
    mixer;
    #clock;
    #singleStepMode = true;
    #sizeOfNextStep = 0;
    #keyfames = [];
    #runningSpeed = .85;
    #crossFadeControls;
    #scene;
    #camera;
    #renderer;

    constructor(scene, renderer, camera) {
        this.#clock = new THREE.Clock();
        this.groupCharInfo = new THREE.Group();
        this.groupCharInfo.position.y = 100;

        this.#scene = scene;
        this.#camera = camera;
        this.#renderer = renderer;
        this.labelRenderer = new CSS2DRenderer();
        
    }

    setNickName() {

        const earthDiv = document.createElement( 'div' );
        earthDiv.className = 'label';
        earthDiv.textContent = 'Earthasdasdadasdasdasd';
        earthDiv.style.backgroundColor = 'transparent';

        const earthLabel = new CSS2DObject( earthDiv );
        earthLabel.position.set( {
            x: 0,
            y: 100,
            z: 0
        } );
        earthLabel.center.set( 0, 1 );
        this.#skeleton.add( earthLabel );
        earthLabel.layers.set( 0 ); 

        this.labelRenderer.setSize( window.innerWidth, window.innerHeight );
        this.labelRenderer.domElement.style.position = 'absolute';
        this.labelRenderer.domElement.style.top = '0px';
        // document.body.appendChild( labelRenderer.domElement );
        
    }

    get inst_model() {
        return this.model;
    }

    async action_stop() {
        // this.prepareCrossFade( this.#action_walk, this.#action_idle, .5 );
    }

    async action_jump() {

        this.prepareCrossFade( this.#action_idle, this.#action_jump, 0 );
        this.prepareCrossFade( this.#action_jump, this.#action_idle, 0 );

    }

    async action_idle() {

        this.prepareCrossFade( this.#action_run, this.#action_idle, .5 );
        // const tester = __this.mixer.clipAction( animations[ 53 ] );
        // tester.play()

    }

    async action_run() {
        
        this.prepareCrossFade( this.#action_idle, this.#action_run, .005 );
        // const tester = __this.mixer.clipAction( animations[ 53 ] );
        // tester.play()

    }

    async action_walk() {
        // this.prepareCrossFade( this.#action_walk, this.#action_run, 2.5 );
    }

    async move(movements) {
        this.#keyfames = [{ time: 0, position: new THREE.Vector3(this.model.position.x, this.model.position.y, this.model.position.z) }]
        this.#keyfames.push({ time: 1, position: new THREE.Vector3(movements.x, movements.y, movements.z) });
        return this.#keyfames;
    }

    get currentKeyframe() {
        return this.#keyfames;
    }

    set modelSet( model ) {
        
        this.model = model;

    }

    async loadModel() {

        return new Promise(async (resolve, reject) => {
            
            this.charLoader = new GLTFLoader();
            var __this = this;

            await this.charLoader.load( './assets/Animated_Low_Poly_Dark_Knight_BAKED_revert.glb', function ( gltf ) {
            // await this.charLoader.load( './assets/Soldier.glb', function ( gltf ) {
                
                __this.model = gltf.scene;
                // __this.model.scale.setScalar(1/150);
                __this.model.scale.setScalar(1/2);

                __this.model.capsuleInfo = {
                	radius: .035,
                	segment: new THREE.Line3( new THREE.Vector3(0, 0, 0), new THREE.Vector3( 0, 2.5, 0.0 ) )
                };
                __this.model.castShadow = true;
                __this.model.receiveShadow = true;
                // __this.model.material.shadowSide = 2;
                __this.#scene.add( __this.model );

                __this.model.traverse( function ( object ) {

                    if ( object.isMesh ) object.castShadow = true;

                } );

                __this.#skeleton = new THREE.SkeletonHelper( __this.model );
                __this.#skeleton.visible = false;
                __this.#scene.add( __this.#skeleton );
                __this.setNickName();

                __this.#settings = {
                    'show model': true,
                    'show skeleton': false,
                    'deactivate all': __this.deactivateAllActions,
                    'activate all': __this.activateAllActions,
                    'pause/continue': __this.pauseContinue,
                    'make single step': __this.toSingleStepMode,
                    'modify step size': 0.05,
                    'from walk to idle': function () {

                        __this.prepareCrossFade( __this.#action_walk, __this.#action_idle, 1.0 );

                    },
                    'from idle to walk': function () {

                        __this.prepareCrossFade( __this.#action_idle, __this.#action_walk, 0.5 );

                    },
                    'from idle to run': function () {

                        __this.prepareCrossFade( __this.#action_idle, __this.#action_run, 0.5 );

                    },
                    'from walk to run': function () {

                        __this.prepareCrossFade( __this.#action_walk, __this.#action_run, 2.5 );

                    },
                    'from run to walk': function () {

                        __this.prepareCrossFade( __this.#action_run, __this.#action_walk, 5.0 );

                    },
                    'use default duration': true,
                    'set custom duration': 3.5,
                    'modify idle weight': 0.0,
                    'modify walk weight': 0.0,
                    'modify run weight': 0.0,
                    'modify jump weight': 0.0,
                    'modify time scale': 1.0
                };

                const animations = gltf.animations;

                // console.log(animations);
                
                if(animations.length > 0) {

                    console.log( animations );

                    __this.mixer = new THREE.AnimationMixer( __this.model );

                    animations.forEach( function ( animationKey ) {

                        const animationPlayer = __this.mixer.clipAction( animationKey );
                        if( !__this.motion[ animationKey.name ] ) {
                            
                            __this.motion[ animationKey.name ] = {

                                ...animationKey,
                                isRunning: false,
                                executor: function() {

                                    return animationPlayer;

                                }

                            };
                            
                            __this.#actions.push( animationPlayer );
                            animationPlayer.play();
                            __this.setWeight( animationPlayer, 0.0 );

                            // __this.setWeight( __this.motion[ animationKey.name ].executor, 0.0 );

                        }

                    } );

                    console.log( __this.motion );

                    __this.setWeight( __this.motion['Stand_Idle_1'].executor(), 1.0 );
                    __this.motion['Stand_Idle_1'].isRunning = true;

                    // const setMotion = __this.motion['Stand_Idle_2'].executor();
                    // __this.prepareCrossFade( animationPlayer, setMotion, .5 );

                    // __this.#action_idle = __this.mixer.clipAction( animations[ 0 ] );
                    // __this.#action_walk = __this.mixer.clipAction( animations[ 115 ] );
                    // __this.#action_run = __this.mixer.clipAction( animations[ 29 ] );

                    // __this.#action_idle = __this.mixer.clipAction( animations[ 68 ] );
                    // __this.#action_walk = __this.mixer.clipAction( animations[ 115 ] );
                    // __this.#action_run = __this.mixer.clipAction( animations[ 29 ] );
                    // __this.#action_jump = __this.mixer.clipAction( animations[ 19 ] );

                    // __this.#actions = [ __this.#action_idle, __this.#action_walk, __this.#action_run, __this.#action_jump ];
                    
                    // __this.activateAllActions(__this.#settings);

                    // __this.setWeight( __this.#action_idle, __this.#settings[ 'modify idle weight' ] );
                    // __this.setWeight( __this.#action_walk, __this.#settings[ 'modify walk weight' ] );
                    // __this.setWeight( __this.#action_run, __this.#settings[ 'modify run weight' ] );
                    // __this.setWeight( __this.#action_jump, __this.#settings[ 'modify jump weight' ] );

                    // __this.#actions.forEach( function ( action ) {

                        // action.play();

                    // } );

                }

                resolve(gltf);

            }, null, reject);

        });

    }

    activateAllActions(settings) {

        if(settings) {
            
            // this.setWeight( this.#action_idle, settings[ 'modify idle weight' ] );
            // this.setWeight( this.#action_walk, settings[ 'modify walk weight' ] );
            // this.setWeight( this.#action_run, settings[ 'modify run weight' ] );
            const __this = this;
            this.#actions.forEach( function ( action ) {
        
                action.play();
                __this.setWeight( action, 0.0 );
        
            } );

        }
    
    }

    setWeight( action, weight ) {

        if(action) {

            action.enabled = true;
            action.setEffectiveTimeScale( 1 );
            action.setEffectiveWeight( weight );

        }
    
    }

    animationCharacter() {

        if(this.#action_idle && this.#action_walk && this.#action_run) {
            this.#weight_idle = this.#action_idle.getEffectiveWeight();
            this.#weight_walk = this.#action_walk.getEffectiveWeight();
            this.#weight_run = this.#action_run.getEffectiveWeight();
        }
        
        
    
        this.updateWeightSliders();
    
        this.updateCrossFadeControls();

        this.labelRenderer.render( this.#scene, this.#camera );
    
        let mixerUpdateDelta = this.#clock.getDelta();
    
        if ( this.#singleStepMode ) {
    
            mixerUpdateDelta = this.#sizeOfNextStep;
            this.#sizeOfNextStep = 0;
    
        }

        if(this.mixer) {
            // this.model.scale.setScalar(1.5);
            // Resize glb object

            // Animation speed : Soldier
            this.mixer.update( .02 );

            // // Animation speed : Ling Xu Zia
            // this.mixer.update( .05 );
            
        }

    }

    prepareCrossFade( startAction, endAction, defaultDuration ) {

        const duration = this.setCrossFadeDuration( defaultDuration );

        this.#singleStepMode = false;
        this.unPauseAllActions();

        if ( startAction === this.#action_idle ) {

            this.executeCrossFade( startAction, endAction, duration );

        } else {

            this.synchronizeCrossFade( startAction, endAction, duration );

        }

    }

    setCrossFadeDuration( defaultDuration ) {

        if(this.#settings) {

            if ( this.#settings[ 'use default duration' ] ) {

                return defaultDuration;
    
            } else {
    
                return this.#settings[ 'set custom duration' ];
    
            }

        }

    }

    executeCrossFade( startAction, endAction, duration ) {

        if(endAction) {

            this.setWeight( endAction, 1 );
            endAction.time = 0;

            startAction.crossFadeTo( endAction, duration, true );
            
        }

    }

    synchronizeCrossFade( startAction, endAction, duration ) {

        const __this = this;

        if(this.mixer) {

            this.mixer.addEventListener( 'loop', onLoopFinished );

            function onLoopFinished( event ) {

                if ( event.action === startAction ) {

                    __this.mixer.removeEventListener( 'loop', onLoopFinished );

                    __this.executeCrossFade( startAction, endAction, duration );

                }

            }

        }

    }

    updateWeightSliders() {

        if(this.#settings) {
            this.#settings[ 'modify idle weight' ] = this.#weight_idle;
            this.#settings[ 'modify walk weight' ] = this.#weight_walk;
            this.#settings[ 'modify run weight' ] = this.#weight_run;
        }
    
    }

    updateCrossFadeControls() {
        
        if(this.#crossFadeControls) {
            
            if ( this.#weight_idle === 1 && this.#weight_walk === 0 && this.#weight_run === 0 ) {
    
                this.#crossFadeControls[ 0 ].disable();
                this.#crossFadeControls[ 1 ].enable();
                this.#crossFadeControls[ 2 ].disable();
                this.#crossFadeControls[ 3 ].disable();
        
            }
        
            if ( this.#weight_idle === 0 && this.#weight_walk === 1 && this.#weight_run === 0 ) {
        
                this.#crossFadeControls[ 0 ].enable();
                this.#crossFadeControls[ 1 ].disable();
                this.#crossFadeControls[ 2 ].enable();
                this.#crossFadeControls[ 3 ].disable();
        
            }
        
            if ( this.#weight_idle === 0 && this.#weight_walk === 0 && this.#weight_run === 1 ) {
        
                this.#crossFadeControls[ 0 ].disable();
                this.#crossFadeControls[ 1 ].disable();
                this.#crossFadeControls[ 2 ].disable();
                this.#crossFadeControls[ 3 ].enable();
        
            }

        }
    
    }

    deactivateAllActions() {

        this.#actions.forEach( function ( action ) {

            action.stop();

        } );

    }

    pauseContinue() {

        if ( this.#singleStepMode ) {

            this.#singleStepMode = false;
            this.unPauseAllActions();

        } else {

            if ( this.#action_idle.paused ) {

                this.unPauseAllActions();

            } else {

                this.pauseAllActions();

            }

        }

    }

    unPauseAllActions() {

        if(this.#actions) {

            this.#actions.forEach( function ( action ) {

                action.paused = false;
    
            } );

        }

    }

    pauseAllActions() {

        this.#actions.forEach( function ( action ) {

            action.paused = true;

        } );

    }

    toSingleStepMode() {

        this.unPauseAllActions();

        this.#singleStepMode = true;
        this.#sizeOfNextStep = this.#settings[ 'modify step size' ];

    }

}