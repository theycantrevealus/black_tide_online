import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export default class __BTCharacter {
    groupCharInfo;
    #nickName = 'Tatang Tanaka';
    nickNameRenderer;
    #HP = 0;
    #SP = 0;
    #EXP = 0;
    #LEVEL = 0;
    #POS_X = 0;
    #POS_Y = 0;
    #POS_Z = 0;

    charLoader;
    #action_idle;

    #weight_idle;
    #weight_walk;
    #weight_run;

    #actions = [];
    #settings;
    motion_initial = 'Stand_Idle_1';
    motion_once = [ 'Jump' ];
    motion = {};
    motion_active;
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

        this.nickNameRenderer = new CSS2DRenderer();
        this.nickNameRenderer.setSize( window.innerWidth, window.innerHeight );
        this.nickNameRenderer.domElement.style.position = 'absolute';
        this.nickNameRenderer.domElement.style.top = '0px';
        // document.body.appendChild( this.nickNameRenderer.domElement );

        this.#scene = scene;
        this.#camera = camera;
        this.#renderer = renderer;
        
    }

    async setNickName(target) {

        const earthDiv = document.createElement( 'div' );
        earthDiv.className = 'label';
        earthDiv.textContent = 'Earth';
        earthDiv.style.backgroundColor = 'transparent';

        const earthLabel = new CSS2DObject( earthDiv );
        earthLabel.position.set( 1.5 * EARTH_RADIUS, 0, 0 );
        earthLabel.center.set( 0, 1 );
        target.add( earthLabel );
        earthLabel.layers.set( 0 );
        
    }

    async updateLabelPosition(object, label) {
        const vector = new THREE.Vector3();
        object.getWorldPosition(vector);
        const x = vector.x;
        const y = vector.y;
        const z = vector.z;
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const canvasWidth = this.#renderer.domElement.offsetWidth;
        const canvasHeight = this.#renderer.domElement.offsetHeight;
        const labelX = (x * screenWidth) / canvasWidth + this.#renderer.domElement.offsetLeft;
        const labelY = (y * screenHeight) / canvasHeight + this.#renderer.domElement.offsetTop;
        label.style.left = `${labelX}px`;
        label.style.top = `${labelY}px`;
      }

    get inst_model() {
        return this.model;
    }

    get inst_label() {
        return this.nickNameRenderer;
    }

    get inst_mixer() {
        return this.mixer;
    }

    get inst_motion_active() {
        return this.motion[ this.motion_active ];
    }

    async action_stop() {

        //

    }

    async action_jump() {

        if(this.motion['Jump'].isRunning == 0) {

            this.prepareCrossFade( this.motion_active, 'Jump', .005 );

        }

    }

    async action_run() {
        
        if(this.motion['Run'].isRunning == 0) {

            this.prepareCrossFade( this.motion_active, 'Run', .005 );

        }

    }

    async action_run_left() {
        
        if(this.motion['Walk_Left'].isRunning == 0) {

            this.prepareCrossFade( this.motion_active, 'Walk_Left', .005 );

        }

    }

    async action_run_right() {
        
        if(this.motion['Walk_Right'].isRunning == 0) {

            this.prepareCrossFade( this.motion_active, 'Walk_Right', .005 );

        }

    }

    async action_run_back() {
        
        if(this.motion['Walk_to_Back'].isRunning == 0) {

            this.prepareCrossFade( this.motion_active, 'Walk_to_Back', .005 );

        }

    }

    async action_idle() {
        
        if(this.motion[ this.motion_initial ].isRunning == 0) {

            this.prepareCrossFade( this.motion_active, this.motion_initial, 1 );

        }

    }

    async action_walk() {
        
        //

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

            await this.charLoader.load( './assets/Animated_Low_Poly_Dark_Knight_BAKED.glb' , function ( gltf ) {
                
                __this.model = gltf.scene;
                __this.model.scale.setScalar( .5 );

                console.log( __this.model );

                __this.model.capsuleInfo = {
                    tolerance: .5,
                    // radius: .035,
                    radius: .5,
                	segment: new THREE.Line3( new THREE.Vector3(0, 0, 0), new THREE.Vector3( 0, 2.5, 0.0 ) )
                };
                __this.#scene.add( __this.model );

                __this.model.traverse( function ( object ) {

                    if ( object.isMesh ) {

                        object.castShadow = true;
                        object.receiveShadow = true;

                    }

                } );

                __this.#skeleton = new THREE.SkeletonHelper( __this.model );
                __this.#skeleton.visible = false;
                __this.#scene.add( __this.#skeleton );
                // __this.setNickName(__this.model);

                __this.#settings = {
                    'show model': true,
                    'show skeleton': false,
                    'deactivate all': __this.deactivateAllActions,
                    'pause/continue': __this.pauseContinue,
                    'make single step': __this.toSingleStepMode,
                    'modify step size': 0.05,
                    'use default duration': true,
                    'set custom duration': 3.5,
                    'modify idle weight': 0.0,
                    'modify walk weight': 0.0,
                    'modify run weight': 0.0,
                    'modify jump weight': 0.0,
                    'modify time scale': 1.0
                };

                const animations = gltf.animations;
                
                if(animations.length > 0) {
                    
                    __this.mixer = new THREE.AnimationMixer( __this.model );

                    animations.forEach( function ( animationKey ) {

                        const animationPlayer = __this.mixer.clipAction( animationKey );
                        if( !__this.motion[ animationKey.name ] ) {
                            
                            __this.motion[ animationKey.name ] = {

                                ...animationKey,
                                isRunning: 0.0,
                                animationSpeed: .02,
                                runOnce: __this.motion_once.indexOf( animationKey.name ) >= 0,
                                executor: function() {

                                    return animationPlayer;

                                }

                            };
                            
                            animationPlayer.play();
                            if( __this.motion_once.indexOf( animationKey.name ) >= 0 ) {

                                animationPlayer.setLoop( THREE.LoopOnce );

                            }
                            
                            __this.setWeight( animationKey.name, __this.motion[ animationKey.name ].isRunning );

                        }

                    } );

                    __this.setWeight( __this.motion_initial, 1.0 );
                    __this.motion_active = __this.motion_initial;

                    console.log( __this.motion );

                }

                resolve( gltf );

            }, null, reject);

        });

    }

    setWeight( targetMotion, weight ) {

        if( this.motion[ targetMotion ]) {

            this.motion[ targetMotion ].executor().enabled = true;
            this.motion[ targetMotion ].isRunning = weight;
            this.motion[ targetMotion ].executor().setEffectiveTimeScale( 1 );
            this.motion[ targetMotion ].executor().setEffectiveWeight( weight );

        }
    
    }

    animationCharacter() {

        const __this = this;
        
        this.updateWeightSliders();
    
        this.updateCrossFadeControls();
    
        let mixerUpdateDelta = this.#clock.getDelta();
    
        if ( this.#singleStepMode ) {
    
            mixerUpdateDelta = this.#sizeOfNextStep;
            this.#sizeOfNextStep = 0;
    
        }

        if(this.mixer) {

            this.mixer.update( __this.motion[ __this.motion_active ].animationSpeed );

            // // Animation speed : Ling Xu Zia
            // this.mixer.update( .05 );
            
        }

    }

    prepareCrossFade( startAction, endAction, defaultDuration ) {

        const duration = this.setCrossFadeDuration( defaultDuration );

        this.#singleStepMode = false;
        this.unPauseAllActions();


        if( this.motion[ startAction ] ) {

            if ( startAction === this.motion_initial ) {

                this.executeCrossFade( startAction, endAction, duration );
                // this.synchronizeCrossFade( startAction, endAction, duration );

            } else {

                // this.synchronizeCrossFade( startAction, endAction, duration );
                this.executeCrossFade( startAction, endAction, duration );

            }

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

        const __this = this;

        if( __this.motion[ endAction ] ) {

            // __this.motion[ startAction ].executor().crossFadeTo( __this.motion[ endAction ].executor(), duration, true );
            __this.motion[ startAction ].executor().crossFadeTo( __this.motion[ endAction ].executor(), duration, false);
            __this.setWeight( startAction, 0 );
            // __this.motion[ startAction ].executor().reset();
            // __this.motion[ startAction ].executor().fadeOut(1);

            // __this.motion[ endAction ].executor().fadeIn(1);
            __this.setWeight( endAction, 1 );
            __this.motion[ endAction ].executor().time = 0;
            __this.motion[ endAction ].isRunning = 1;
            __this.motion_active = endAction;
            
            
        }

    }

    synchronizeCrossFade( startAction, endAction, duration ) {

        const __this = this;

        if(__this.mixer) {

            __this.mixer.addEventListener( 'loop', onLoopFinished );

            // __this.mixer.addEventListener( 'finished', function ( event ) {
                
            //     if( __this.motion[ endAction ].runOnce ) {
                    
            //         __this.action_idle();

            //     }

            // } );

            function onLoopFinished( event ) {

                __this.mixer.removeEventListener( 'loop', onLoopFinished );

                __this.executeCrossFade( startAction, endAction, duration );

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