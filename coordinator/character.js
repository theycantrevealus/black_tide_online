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

    #weight_idle;
    #weight_walk;
    #weight_run;

    #actions;
    #settings;
    #model;
    #skeleton;
    mixer;
    #clock;
    #singleStepMode = true;
    #sizeOfNextStep = 0;
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
        return this.#model;
    }

    async action_stop() {
        this.prepareCrossFade( this.#action_walk, this.#action_idle, .5 );
    }

    async action_walk() {
        this.prepareCrossFade( this.#action_idle, this.#action_walk, .5 );
    }

    async loadModel() {
        this.charLoader = new GLTFLoader();
        var __this = this;
        await this.charLoader.load( './assets/Soldier.glb', function ( gltf ) {
            
            __this.#model = gltf.scene;
            __this.#scene.add( __this.#model );

            __this.#model.traverse( function ( object ) {

                if ( object.isMesh ) object.castShadow = true;

            } );

            __this.#skeleton = new THREE.SkeletonHelper( __this.#model );
            __this.#skeleton.visible = true;
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
                'from walk to run': function () {

                    __this.prepareCrossFade( __this.#action_walk, __this.#action_run, 2.5 );

                },
                'from run to walk': function () {

                    __this.prepareCrossFade( __this.#action_run, __this.#action_walk, 5.0 );

                },
                'use default duration': true,
                'set custom duration': 3.5,
                'modify idle weight': 0.0,
                'modify walk weight': 1.0,
                'modify run weight': 0.0,
                'modify time scale': 1.0
            };

            const animations = gltf.animations;

            __this.mixer = new THREE.AnimationMixer( __this.#model );

            __this.#action_idle = __this.mixer.clipAction( animations[ 0 ] );
            __this.#action_walk = __this.mixer.clipAction( animations[ 3 ] );
            __this.#action_run = __this.mixer.clipAction( animations[ 1 ] );

            __this.#actions = [ __this.#action_idle, __this.#action_walk, __this.#action_run ];
            
            __this.activateAllActions(__this.#settings);

            __this.setWeight( __this.#action_idle, __this.#settings[ 'modify idle weight' ] );
            __this.setWeight( __this.#action_walk, __this.#settings[ 'modify walk weight' ] );
            __this.setWeight( __this.#action_run, __this.#settings[ 'modify run weight' ] );

            __this.#actions.forEach( function ( action ) {

                action.play();

            } );
            

        });
    }

    activateAllActions(settings) {

        if(settings) {
            
            this.setWeight( this.#action_idle, settings[ 'modify idle weight' ] );
            this.setWeight( this.#action_walk, settings[ 'modify walk weight' ] );
            this.setWeight( this.#action_run, settings[ 'modify run weight' ] );
        
            this.#actions.forEach( function ( action ) {
        
                action.play();
        
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

            this.mixer.update( mixerUpdateDelta );
            
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