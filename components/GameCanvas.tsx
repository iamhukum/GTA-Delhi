import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { MAP_WIDTH, MAP_HEIGHT, DISTRICTS, LANDMARKS, CAR_COLORS } from '../constants';
import { GameState } from '../types';

interface GameCanvasProps {
  onLocationUpdate: (x: number, y: number, district: string) => void;
  onGameUpdate: (stats: Partial<GameState>) => void;
  isPhoneOpen: boolean;
  navigationTarget: { x: number, y: number, name: string } | null;
  teleportTarget: { x: number, y: number } | null;
}

// Interface for articulated parts
interface HumanoidParts {
    mesh: THREE.Group;
    armL: THREE.Group;
    armR: THREE.Group;
    legL: THREE.Group;
    legR: THREE.Group;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ onLocationUpdate, onGameUpdate, isPhoneOpen, navigationTarget, teleportTarget }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [cursorClass, setCursorClass] = useState('cursor-grab');
  
  // Use refs for callbacks
  const onLocationUpdateRef = useRef(onLocationUpdate);
  const onGameUpdateRef = useRef(onGameUpdate);
  const navTargetRef = useRef(navigationTarget);

  // Camera State
  const cameraDist = useRef(70);
  const cameraRotation = useRef(0);
  const isDragging = useRef(false);
  const lastMouseX = useRef(0);

  useEffect(() => {
      onLocationUpdateRef.current = onLocationUpdate;
      onGameUpdateRef.current = onGameUpdate;
      navTargetRef.current = navigationTarget;
  }, [onLocationUpdate, onGameUpdate, navigationTarget]);

  // --- Game State Logic ---
  const player = useRef<{
      x: number, y: number, angle: number, speed: number,
      inVehicle: boolean, vehicleType: string, vehicleColor: string,
      health: number, money: number, wanted: number, hitCount: number,
      width: number, height: number,
      parts?: HumanoidParts // Store 3D parts for animation
  }>({ 
      x: 2000, y: 2000, 
      angle: 0, speed: 0, 
      inVehicle: true,
      vehicleType: 'ferrari', 
      vehicleColor: '#ff2800', 
      health: 100, 
      money: 500, 
      wanted: 0,
      hitCount: 0, 
      width: 18, height: 36
  });

  // Handle Teleportation
  useEffect(() => {
      if (teleportTarget) {
          player.current.x = teleportTarget.x;
          player.current.y = teleportTarget.y;
          // Offset slightly so we don't spawn inside a building center
          player.current.x += 60; 
          player.current.y += 60;
          player.current.speed = 0;
      }
  }, [teleportTarget]);

  const cheatBuffer = useRef(''); 
  const keys = useRef<{ [key: string]: boolean }>({});
  const obstacles = useRef<{x: number, y: number, w: number, h: number}[]>([]);
  
  // Traffic
  const traffic = useRef(Array.from({ length: 60 }, () => ({
    x: Math.random() * MAP_WIDTH,
    y: Math.random() * MAP_HEIGHT,
    speed: 0.5 + Math.random() * 1.5,
    angle: Math.random() * Math.PI * 2,
    type: Math.random() > 0.6 ? 'auto' : 'car', 
    color: CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)],
    mesh: null as THREE.Group | null,
    active: true,
    lastHit: 0 
  })));

  // Police
  const policeCars = useRef<{
      x: number, y: number, 
      speed: number, angle: number, 
      mesh: THREE.Group, 
      active: boolean 
  }[]>([]);

  // Pedestrians (Updated with Parts)
  const pedestrians = useRef(Array.from({ length: 80 }, () => ({
    x: Math.random() * MAP_WIDTH,
    y: Math.random() * MAP_HEIGHT,
    speed: 0.2 + Math.random() * 0.3, 
    angle: Math.random() * Math.PI * 2,
    colorTop: Math.random() * 0xffffff,
    colorBot: Math.random() * 0x555555,
    parts: null as HumanoidParts | null, // Store parts
    dead: false,
    animOffset: Math.random() * 100
  })));

  // Parked Cars
  const parkedCars = useRef<{x: number, y: number, angle: number, type: string, color: string, mesh: THREE.Group}[]>([]);

  // Input Handling (Keyboard + Mouse)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { 
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        keys.current[e.key] = true; 

        // Cheat Codes
        if (e.key.length === 1) {
            cheatBuffer.current += e.key.toLowerCase();
            if (cheatBuffer.current.length > 20) cheatBuffer.current = cheatBuffer.current.slice(-20);
            if (cheatBuffer.current.endsWith("policecome")) {
                player.current.wanted = 5; player.current.hitCount = 10;
                onGameUpdateRef.current({ wantedLevel: 5 });
            }
            if (cheatBuffer.current.endsWith("policego")) {
                player.current.wanted = 0; player.current.hitCount = 0;
                onGameUpdateRef.current({ wantedLevel: 0 });
            }
        }
        if (e.key.toLowerCase() === 'f') handleInteraction();
        if (e.code === 'Space' && !player.current.inVehicle) handleCombat();
    };
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.key] = false; };
    
    // Mouse Interaction for Camera
    const handleWheel = (e: WheelEvent) => {
        const zoomSpeed = 10;
        const delta = Math.sign(e.deltaY) * zoomSpeed;
        cameraDist.current = Math.max(20, Math.min(400, cameraDist.current + delta));
    };

    const handleMouseDown = (e: MouseEvent) => {
        if (isPhoneOpen) return;
        isDragging.current = true;
        lastMouseX.current = e.clientX;
        setCursorClass('cursor-grabbing');
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging.current) return;
        const delta = e.clientX - lastMouseX.current;
        cameraRotation.current -= delta * 0.01; 
        lastMouseX.current = e.clientX;
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        setCursorClass('cursor-grab');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('wheel', handleWheel);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPhoneOpen]);

  // --- LOGIC: INTERACTION ---
  const handleInteraction = () => {
      const p = player.current;
      if (p.inVehicle) {
          // EXIT VEHICLE
          p.inVehicle = false;
          p.speed = 0;
          p.width = 6; p.height = 6; // Human size logic
      } else {
          // ENTER VEHICLE
          let closestCarIndex = -1;
          let minDst = 30;
          parkedCars.current.forEach((c, i) => {
              const d = Math.hypot(c.x - p.x, c.y - p.y);
              if (d < minDst) { minDst = d; closestCarIndex = i; }
          });

          if (closestCarIndex !== -1) {
              const car = parkedCars.current[closestCarIndex];
              p.x = car.x; p.y = car.y; p.angle = car.angle;
              p.inVehicle = true; p.vehicleType = car.type; p.vehicleColor = car.color;
              p.width = 18; p.height = 36;
              car.mesh.visible = false; 
              parkedCars.current.splice(closestCarIndex, 1);
              onGameUpdateRef.current({ inVehicle: true });
              return;
          }

          traffic.current.forEach((t) => {
             if (!t.active) return;
             const d = Math.hypot(t.x - p.x, t.y - p.y);
             if (d < 30) {
                 p.x = t.x; p.y = t.y; p.angle = t.angle;
                 p.inVehicle = true; p.vehicleType = t.type; p.vehicleColor = t.color;
                 p.width = 18; p.height = 36;
                 p.wanted = Math.min(5, p.wanted + 1);
                 t.active = false;
                 if (t.mesh) t.mesh.visible = false;
             }
          });
      }
      onGameUpdateRef.current({ inVehicle: p.inVehicle, wantedLevel: p.wanted });
  };

  const handleCombat = () => {
      const p = player.current;
      let hit = false;
      pedestrians.current.forEach(ped => {
          if (ped.dead) return;
          const dist = Math.hypot(ped.x - p.x, ped.y - p.y);
          if (dist < 15) {
              ped.dead = true;
              p.money += Math.floor(Math.random() * 50);
              p.wanted = Math.min(5, p.wanted + 1);
              hit = true;
              if (ped.parts) {
                  ped.parts.mesh.rotation.x = -Math.PI / 2;
                  ped.parts.mesh.position.y = 2;
              }
          }
      });
      if (hit) onGameUpdateRef.current({ money: p.money, wantedLevel: p.wanted });
  };

  useEffect(() => {
    if (!mountRef.current) return;
    obstacles.current = [];

    // --- THREE.JS SETUP ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); 
    scene.fog = new THREE.Fog(0x87CEEB, 100, 1200);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    dirLight.position.set(100, 300, 100);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048; dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5; dirLight.shadow.camera.far = 1000;
    dirLight.shadow.camera.left = -500; dirLight.shadow.camera.right = 500;
    dirLight.shadow.camera.top = 500; dirLight.shadow.camera.bottom = -500;
    scene.add(dirLight);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(MAP_WIDTH, MAP_HEIGHT), new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 }));
    ground.rotation.x = -Math.PI / 2; ground.position.set(MAP_WIDTH / 2, -0.1, MAP_HEIGHT / 2); ground.receiveShadow = true; scene.add(ground);
    const gridHelper = new THREE.GridHelper(MAP_WIDTH, 40, 0xaaaaaa, 0x555555);
    gridHelper.position.set(MAP_WIDTH / 2, 0, MAP_HEIGHT / 2); scene.add(gridHelper);

    const arrowGroup = new THREE.Group();
    const arrowShaft = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 10), new THREE.MeshBasicMaterial({ color: 0xFFFF00 }));
    arrowShaft.position.z = 5; arrowGroup.add(arrowShaft);
    const arrowHead = new THREE.Mesh(new THREE.ConeGeometry(5, 10, 4), new THREE.MeshBasicMaterial({ color: 0xFFFF00 }));
    arrowHead.rotation.x = Math.PI / 2; arrowHead.rotation.y = Math.PI / 4; arrowHead.position.z = 12; arrowGroup.add(arrowHead);
    arrowGroup.visible = false; scene.add(arrowGroup);

    // --- MESH GENERATORS (VEHICLES) ---
    const createCarMesh = (color: string) => {
        const g = new THREE.Group();
        const chassis = new THREE.Mesh(new THREE.BoxGeometry(18, 8, 36), new THREE.MeshPhongMaterial({ color }));
        chassis.position.y = 7; chassis.castShadow = true; g.add(chassis);
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(16, 6, 20), new THREE.MeshPhongMaterial({ color: 0x333333 }));
        cabin.position.set(0, 14, -2); g.add(cabin);
        const wGeo = new THREE.CylinderGeometry(4, 4, 2, 8); const wMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        [{x:-9,z:12}, {x:9,z:12}, {x:-9,z:-12}, {x:9,z:-12}].forEach(p => {
            const w = new THREE.Mesh(wGeo, wMat); w.rotation.z = Math.PI/2; w.position.set(p.x, 4, p.z); g.add(w);
        });
        return g;
    };

    const createAutoMesh = () => {
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(14, 10, 24), new THREE.MeshPhongMaterial({ color: 0x006400 }));
        body.position.y = 7; body.castShadow = true; g.add(body);
        const top = new THREE.Mesh(new THREE.BoxGeometry(13, 8, 20), new THREE.MeshPhongMaterial({ color: 0xFFD700 }));
        top.position.set(0, 16, 0); g.add(top);
        const wGeo = new THREE.CylinderGeometry(3, 3, 2, 8); const wMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const fw = new THREE.Mesh(wGeo, wMat); fw.rotation.z = Math.PI/2; fw.position.set(0, 3, 10); g.add(fw);
        const bw1 = new THREE.Mesh(wGeo, wMat); bw1.rotation.z = Math.PI/2; bw1.position.set(-7, 3, -8); g.add(bw1);
        const bw2 = new THREE.Mesh(wGeo, wMat); bw2.rotation.z = Math.PI/2; bw2.position.set(7, 3, -8); g.add(bw2);
        return g;
    }

    const createPoliceCarMesh = () => {
        const g = new THREE.Group();
        const bodyMat = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
        const chassis = new THREE.Mesh(new THREE.BoxGeometry(20, 10, 40), bodyMat);
        chassis.position.y = 8; chassis.castShadow = true; g.add(chassis);
        
        const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (ctx) { ctx.fillStyle = 'white'; ctx.fillRect(0,0,256,64); ctx.fillStyle = '#000080'; ctx.font = 'bold 30px Arial'; ctx.fillText('DELHI POLICE', 20, 42); }
        const textTex = new THREE.CanvasTexture(canvas); const textMat = new THREE.MeshBasicMaterial({ map: textTex });
        const leftPanel = new THREE.Mesh(new THREE.PlaneGeometry(30, 8), textMat); leftPanel.rotation.y = -Math.PI/2; leftPanel.position.set(-10.1, 8, 0); g.add(leftPanel);
        const rightPanel = new THREE.Mesh(new THREE.PlaneGeometry(30, 8), textMat); rightPanel.rotation.y = Math.PI/2; rightPanel.position.set(10.1, 8, 0); g.add(rightPanel);
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(18, 6, 22), new THREE.MeshPhongMaterial({ color: 0x222222 })); cabin.position.set(0, 16, -2); g.add(cabin);
        const sirenBar = new THREE.Mesh(new THREE.BoxGeometry(14, 2, 4), new THREE.MeshLambertMaterial({color: 0x333333})); sirenBar.position.set(0, 20, -2); g.add(sirenBar);
        const redLight = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 3), new THREE.MeshBasicMaterial({color: 0xff0000})); redLight.position.set(-4, 21, -2); g.add(redLight);
        const blueLight = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 3), new THREE.MeshBasicMaterial({color: 0x0000ff})); blueLight.position.set(4, 21, -2); g.add(blueLight);
        const wGeo = new THREE.CylinderGeometry(4.5, 4.5, 3, 16); const wMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        [{x:-10,z:12}, {x:10,z:12}, {x:-10,z:-12}, {x:10,z:-12}].forEach(p => { const w = new THREE.Mesh(wGeo, wMat); w.rotation.z = Math.PI/2; w.position.set(p.x, 4.5, p.z); g.add(w); });
        return { mesh: g, red: redLight, blue: blueLight };
    };

    const createFerrariMesh = () => {
        const carGroup = new THREE.Group();
        const ferrariRed = 0xff2800; const paintMat = new THREE.MeshPhongMaterial({ color: ferrariRed, specular: 0xffffff, shininess: 100 });
        const glassMat = new THREE.MeshPhongMaterial({ color: 0x111111, shininess: 200 }); const blackMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const chassis = new THREE.Mesh(new THREE.BoxGeometry(20, 6, 44), paintMat); chassis.position.y = 5; chassis.castShadow = true; carGroup.add(chassis);
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(16, 5, 20), glassMat); cabin.position.set(0, 10, -4); carGroup.add(cabin);
        const rearDeck = new THREE.Mesh(new THREE.BoxGeometry(18, 2, 12), paintMat); rearDeck.position.set(0, 8, -16); carGroup.add(rearDeck);
        const spoiler = new THREE.Mesh(new THREE.BoxGeometry(22, 1, 6), paintMat); spoiler.position.set(0, 10, -22); carGroup.add(spoiler);
        const post1 = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 2), blackMat); post1.position.set(-8, 7, -22); carGroup.add(post1);
        const post2 = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 2), blackMat); post2.position.set(8, 7, -22); carGroup.add(post2);
        const wGeo = new THREE.CylinderGeometry(4.5, 4.5, 3.5, 16); const wMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
        [{x:-10,z:14}, {x:10,z:14}, {x:-10,z:-14}, {x:10,z:-14}].forEach(p => { const w = new THREE.Mesh(wGeo, wMat); w.rotation.z = Math.PI/2; w.position.set(p.x, 4.5, p.z); carGroup.add(w); const rim = new THREE.Mesh(new THREE.CylinderGeometry(2,2,3.6,8), new THREE.MeshBasicMaterial({color: 0xffff00})); rim.rotation.z = Math.PI/2; rim.position.set(p.x, 4.5, p.z); carGroup.add(rim); });
        return carGroup;
    }

    // --- HUMANOID CHARACTER GENERATOR ---
    const createHumanoid = (shirtColor: THREE.Color | number, pantColor: THREE.Color | number): HumanoidParts => {
        const group = new THREE.Group();
        const skinMat = new THREE.MeshLambertMaterial({ color: 0xffdbac });
        const shirtMat = new THREE.MeshLambertMaterial({ color: shirtColor });
        const pantMat = new THREE.MeshLambertMaterial({ color: pantColor });
        
        // Head
        const head = new THREE.Mesh(new THREE.BoxGeometry(3, 3.5, 3), skinMat);
        head.position.y = 15.5; head.castShadow = true; group.add(head);

        // Torso
        const torso = new THREE.Mesh(new THREE.BoxGeometry(6, 7, 3.5), shirtMat);
        torso.position.y = 10.5; torso.castShadow = true; group.add(torso);

        // Arms
        const armGeo = new THREE.BoxGeometry(2, 6, 2);
        
        const armLGroup = new THREE.Group(); armLGroup.position.set(-4, 13, 0);
        const armL = new THREE.Mesh(armGeo, skinMat); armL.position.y = -2.5; armL.castShadow = true;
        armLGroup.add(armL); group.add(armLGroup);

        const armRGroup = new THREE.Group(); armRGroup.position.set(4, 13, 0);
        const armR = new THREE.Mesh(armGeo, skinMat); armR.position.y = -2.5; armR.castShadow = true;
        armRGroup.add(armR); group.add(armRGroup);

        // Legs
        const legGeo = new THREE.BoxGeometry(2.2, 7, 2.2);

        const legLGroup = new THREE.Group(); legLGroup.position.set(-1.6, 7, 0);
        const legL = new THREE.Mesh(legGeo, pantMat); legL.position.y = -3.5; legL.castShadow = true;
        legLGroup.add(legL); group.add(legLGroup);

        const legRGroup = new THREE.Group(); legRGroup.position.set(1.6, 7, 0);
        const legR = new THREE.Mesh(legGeo, pantMat); legR.position.y = -3.5; legR.castShadow = true;
        legRGroup.add(legR); group.add(legRGroup);

        return { mesh: group, armL: armLGroup, armR: armRGroup, legL: legLGroup, legR: legRGroup };
    };

    // --- ENHANCED PROCEDURAL LANDMARKS ---

    const createRedFort = () => {
        const g = new THREE.Group();
        const redStone = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
        const whiteStone = new THREE.MeshLambertMaterial({ color: 0xDDDDDD });
        
        // Main Walls
        const wallL = new THREE.Mesh(new THREE.BoxGeometry(120, 40, 20), redStone); wallL.position.set(-80, 20, 0); g.add(wallL);
        const wallR = new THREE.Mesh(new THREE.BoxGeometry(120, 40, 20), redStone); wallR.position.set(80, 20, 0); g.add(wallR);
        
        // Lahori Gate (Central Structure)
        const gateBase = new THREE.Mesh(new THREE.BoxGeometry(60, 50, 60), redStone); gateBase.position.set(0, 25, 0); g.add(gateBase);
        
        // Octagonal Towers
        const towerGeo = new THREE.CylinderGeometry(12, 12, 60, 8);
        const towerL = new THREE.Mesh(towerGeo, redStone); towerL.position.set(-30, 30, 30); g.add(towerL);
        const towerR = new THREE.Mesh(towerGeo, redStone); towerR.position.set(30, 30, 30); g.add(towerR);
        
        // Domes (Chhatris)
        const domeGeo = new THREE.SphereGeometry(10, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const domeL = new THREE.Mesh(domeGeo, whiteStone); domeL.position.set(-30, 60, 30); g.add(domeL);
        const domeR = new THREE.Mesh(domeGeo, whiteStone); domeR.position.set(30, 60, 30); g.add(domeR);
        
        // Main Row of Chhatris on top of gate
        for(let i=-20; i<=20; i+=10) {
            const smallDome = new THREE.Mesh(new THREE.SphereGeometry(3, 8, 8, 0, Math.PI*2, 0, Math.PI/2), whiteStone);
            smallDome.position.set(i, 50, 30); g.add(smallDome);
        }

        return g;
    };

    const createIndiaGate = () => {
        const g = new THREE.Group();
        const stone = new THREE.MeshLambertMaterial({ color: 0xD2B48C }); // Sandstone
        
        // Legs
        const legGeo = new THREE.BoxGeometry(12, 80, 12);
        const leftLeg = new THREE.Mesh(legGeo, stone); leftLeg.position.set(-20, 40, 0); g.add(leftLeg);
        const rightLeg = new THREE.Mesh(legGeo, stone); rightLeg.position.set(20, 40, 0); g.add(rightLeg);
        
        // Arch top
        const topBlock = new THREE.Mesh(new THREE.BoxGeometry(60, 15, 15), stone); topBlock.position.set(0, 85, 0); g.add(topBlock);
        
        // Stepped top
        const step1 = new THREE.Mesh(new THREE.BoxGeometry(50, 5, 12), stone); step1.position.set(0, 95, 0); g.add(step1);
        const step2 = new THREE.Mesh(new THREE.BoxGeometry(40, 5, 10), stone); step2.position.set(0, 100, 0); g.add(step2);
        
        // Cornice/Detailing
        const cornice = new THREE.Mesh(new THREE.BoxGeometry(62, 2, 16), stone); cornice.position.set(0, 78, 0); g.add(cornice);

        return g;
    };

    const createLotusTemple = () => {
        const g = new THREE.Group();
        const marble = new THREE.MeshPhongMaterial({ color: 0xFFFFFF, shininess: 100 });
        
        // Central Bud
        const center = new THREE.Mesh(new THREE.ConeGeometry(20, 60, 32, 1, true), marble);
        center.position.y = 30;
        g.add(center);
        
        // Petals - 3 Layers
        const createPetalLayer = (count: number, radius: number, tilt: number, scaleY: number, yPos: number) => {
            for(let i=0; i<count; i++) {
                const angle = (i / count) * Math.PI * 2;
                // Use a stretched sphere half as a petal
                const petalGeo = new THREE.SphereGeometry(15, 16, 16, 0, Math.PI * 2, 0, Math.PI/2.5);
                const petal = new THREE.Mesh(petalGeo, marble);
                petal.position.set(Math.cos(angle) * radius, yPos, Math.sin(angle) * radius);
                petal.rotation.y = -angle - Math.PI/2;
                petal.rotation.z = tilt;
                petal.scale.set(1, scaleY, 0.5);
                g.add(petal);
            }
        }

        // Inner Petals (standing up)
        createPetalLayer(9, 15, Math.PI / 8, 2.5, 0);
        // Outer Petals (opening out)
        createPetalLayer(9, 25, -Math.PI / 4, 1.5, 5);
        
        // Base Pools
        const pool = new THREE.Mesh(new THREE.CircleGeometry(80, 32), new THREE.MeshLambertMaterial({color: 0x0099ff}));
        pool.rotation.x = -Math.PI/2;
        pool.position.y = 0.5;
        g.add(pool);

        return g;
    };

    const createQutubMinar = () => {
        const g = new THREE.Group();
        const redSandstone = new THREE.MeshLambertMaterial({ color: 0xA0522D });
        const marble = new THREE.MeshLambertMaterial({ color: 0xF5F5F5 });

        // Base diameter starts wide and gets narrow
        const levels = [
            { bottom: 12, top: 10, height: 30 },
            { bottom: 10, top: 8, height: 25 },
            { bottom: 8, top: 6, height: 20 },
            { bottom: 6, top: 5, height: 15 },
            { bottom: 5, top: 4, height: 10 },
        ];
        
        let currentY = 0;
        
        levels.forEach((lvl, idx) => {
            const geo = new THREE.CylinderGeometry(lvl.top, lvl.bottom, lvl.height, 16);
            const mat = idx > 2 ? marble : redSandstone;
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.y = currentY + lvl.height / 2;
            g.add(mesh);
            
            // Balcony
            const balcony = new THREE.Mesh(new THREE.TorusGeometry(lvl.top + 1, 1, 8, 16), redSandstone);
            balcony.rotation.x = Math.PI/2;
            balcony.position.y = currentY + lvl.height;
            g.add(balcony);
            
            currentY += lvl.height;
        });

        return g;
    };

    const createCyberHub = () => {
        const g = new THREE.Group();
        const glassMat = new THREE.MeshPhongMaterial({ color: 0x88ccff, opacity: 0.7, transparent: true, shininess: 100 });
        const steelMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.2, metalness: 0.8 });
        
        // Main Tower 1
        const t1 = new THREE.Mesh(new THREE.BoxGeometry(40, 180, 40), glassMat);
        t1.position.y = 90;
        g.add(t1);
        
        // Main Tower 2 (curved)
        const t2 = new THREE.Mesh(new THREE.CylinderGeometry(20, 20, 150, 32), glassMat);
        t2.position.set(50, 75, 20);
        g.add(t2);
        
        // Connecting Bridge
        const bridge = new THREE.Mesh(new THREE.BoxGeometry(60, 10, 20), steelMat);
        bridge.position.set(25, 100, 10);
        g.add(bridge);
        
        // Plaza Base
        const plaza = new THREE.Mesh(new THREE.BoxGeometry(120, 5, 100), steelMat);
        plaza.position.y = 2.5;
        g.add(plaza);
        
        // Neon Sign
        const signGeo = new THREE.BoxGeometry(30, 5, 2);
        const signMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Green neon
        const sign = new THREE.Mesh(signGeo, signMat);
        sign.position.set(0, 170, 21);
        g.add(sign);

        return g;
    };

    const createAkshardham = () => {
         const g = new THREE.Group();
         const stone = new THREE.MeshLambertMaterial({ color: 0xFF9966 }); // Pink sandstone
         
         // Main Mandir Base
         const base = new THREE.Mesh(new THREE.BoxGeometry(100, 20, 100), stone);
         base.position.y = 10;
         g.add(base);
         
         // Central Dome Structure
         const core = new THREE.Mesh(new THREE.BoxGeometry(60, 40, 60), stone);
         core.position.y = 40;
         g.add(core);
         
         const mainDome = new THREE.Mesh(new THREE.SphereGeometry(25, 32, 16, 0, Math.PI*2, 0, Math.PI/2), stone);
         mainDome.position.y = 60;
         g.add(mainDome);
         
         // Corner Spires (Shikhars)
         const positions = [
             {x: 40, z: 40}, {x: -40, z: 40}, {x: 40, z: -40}, {x: -40, z: -40},
             {x: 0, z: 50}, {x: 0, z: -50}, {x: 50, z: 0}, {x: -50, z: 0}
         ];
         
         positions.forEach(pos => {
             const spire = new THREE.Mesh(new THREE.ConeGeometry(6, 25, 8), stone);
             spire.position.set(pos.x, 30, pos.z);
             g.add(spire);
         });

         return g;
    };

    // --- GENERATE DISTRICTS & COLLIDERS ---
    DISTRICTS.forEach(d => {
        const zone = new THREE.Mesh(new THREE.PlaneGeometry(d.width, d.height), new THREE.MeshBasicMaterial({ color: d.color, transparent: true, opacity: 0.05 }));
        zone.rotation.x = -Math.PI / 2; zone.position.set(d.x + d.width/2, 0.1, d.y + d.height/2); scene.add(zone);
        let bCol = 0xcccccc; let den = 12000; let hS = 1;
        if (d.name.includes("Connaught")) { bCol = 0xffffff; hS = 0.6; den = 10000; }
        else if (d.name.includes("Old Delhi")) { bCol = 0xa52a2a; hS = 0.4; den = 4000; }
        else if (d.name.includes("Cyber")) { bCol = 0x87cefa; hS = 2.5; den = 15000; }
        const mat = new THREE.MeshLambertMaterial({ color: bCol });
        const num = Math.floor((d.width * d.height) / den);
        const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, num);
        const matrix = new THREE.Matrix4();
        for (let i = 0; i < num; i++) {
            const bx = d.x + Math.random() * d.width; const by = d.y + Math.random() * d.height;
            if (Math.abs(bx % 100) < 12 || Math.abs(by % 100) < 12) continue;
            const bw = 25 + Math.random() * 20; const bd = 25 + Math.random() * 20; const bh = (30 + Math.random() * 80) * hS;
            matrix.makeScale(bw, bh, bd); matrix.setPosition(bx, bh/2, by); mesh.setMatrixAt(i, matrix);
            obstacles.current.push({ x: bx, y: by, w: bw, h: bd });
        }
        mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh);
    });

    // --- PLACE 3D LANDMARKS (Correctly Linked) ---
    LANDMARKS.forEach(lm => {
        let mesh: THREE.Group | null = null;
        if (lm.name === 'Akshardham Temple') mesh = createAkshardham();
        else if (lm.name === 'Red Fort') mesh = createRedFort();
        else if (lm.name === 'Lotus Temple') mesh = createLotusTemple();
        else if (lm.name === 'India Gate') mesh = createIndiaGate();
        else if (lm.name === 'Qutub Minar') mesh = createQutubMinar();
        else if (lm.name === 'Cyber Hub') mesh = createCyberHub();
        else { mesh = new THREE.Group(); mesh.add(new THREE.Mesh(new THREE.BoxGeometry(40, 30, 40), new THREE.MeshLambertMaterial({color: 0xFFA500}))); mesh.children[0].position.y=15; }
        if (mesh) { mesh.position.set(lm.x, 0, lm.y); mesh.castShadow = true; scene.add(mesh); obstacles.current.push({ x: lm.x, y: lm.y, w: 50, h: 50 }); }
    });

    // --- PLAYER & ACTORS ---
    // Player Character (Humanoid)
    // Shirt: Teal (Vercetti style), Pants: Blue Jeans
    const playerParts = createHumanoid(0x008080, 0x00008B);
    player.current.parts = playerParts;
    const playerMesh = playerParts.mesh; // Main group
    
    const playerFerrari = createFerrariMesh();
    const playerCar = createCarMesh('#ffffff');
    const playerAuto = createAutoMesh();
    
    playerFerrari.visible = false; playerCar.visible = false; playerAuto.visible = false; playerMesh.visible = false;
    scene.add(playerFerrari); scene.add(playerCar); scene.add(playerAuto); scene.add(playerMesh);

    // Traffic Init
    traffic.current.forEach(t => {
        let mesh = t.type === 'auto' ? createAutoMesh() : createCarMesh(t.color);
        mesh.position.set(t.x, 0, t.y); scene.add(mesh); t.mesh = mesh;
    });

    // Peds Init (Humanoids)
    pedestrians.current.forEach(p => {
        const parts = createHumanoid(p.colorTop, p.colorBot);
        p.parts = parts;
        parts.mesh.position.set(p.x, 0, p.y);
        scene.add(parts.mesh);
    });

    // --- GAME LOOP ---
    let animationId: number;
    let lastInVehicle = true;
    let frameCount = 0;

    const gameLoop = () => {
        frameCount++;
        if (!isPhoneOpen) {
            updatePhysics();
            updateCamera();
        }
        renderer.render(scene, camera);
        animationId = requestAnimationFrame(gameLoop);
    };

    const updatePhysics = () => {
        const p = player.current;
        const now = Date.now();

        // Arrow
        if (navTargetRef.current) {
            arrowGroup.visible = true; arrowGroup.position.set(p.x, 25, p.y);
            arrowGroup.rotation.y = Math.atan2(navTargetRef.current.x - p.x, navTargetRef.current.y - p.y);
        } else arrowGroup.visible = false;

        // Vehicle Logic
        if (p.inVehicle !== lastInVehicle) {
            if (p.inVehicle) { playerMesh.visible = false; } else {
                playerMesh.visible = true;
                let staticMesh: THREE.Group;
                if (p.vehicleType === 'ferrari') staticMesh = createFerrariMesh();
                else if (p.vehicleType === 'auto') staticMesh = createAutoMesh();
                else staticMesh = createCarMesh(p.vehicleColor);
                staticMesh.position.set(p.x, 0, p.y); staticMesh.rotation.y = p.angle + Math.PI; scene.add(staticMesh);
                parkedCars.current.push({ x: p.x, y: p.y, angle: p.angle, type: p.vehicleType, color: p.vehicleColor, mesh: staticMesh });
                p.x -= Math.cos(p.angle) * 15; p.y += Math.sin(p.angle) * 15;
            }
            lastInVehicle = p.inVehicle;
        }

        if (p.inVehicle) {
            playerFerrari.visible = (p.vehicleType === 'ferrari');
            playerCar.visible = (p.vehicleType === 'car');
            playerAuto.visible = (p.vehicleType === 'auto');
        } else {
            playerFerrari.visible = false; playerCar.visible = false; playerAuto.visible = false;
        }

        // Movement
        let isMoving = false;
        if (p.inVehicle) {
            const maxSpeed = p.vehicleType === 'ferrari' ? 5.0 : (p.vehicleType === 'auto' ? 2.5 : 3.5);
            const accel = p.vehicleType === 'ferrari' ? 0.15 : 0.1;
            if (keys.current['ArrowUp'] || keys.current['w']) p.speed = Math.min(p.speed + accel, maxSpeed);
            else if (keys.current['ArrowDown'] || keys.current['s']) p.speed = Math.max(p.speed - accel, -1.5);
            else p.speed *= 0.96;
            if (p.speed !== 0) {
                const turnSpeed = 0.03 * (Math.abs(p.speed) / maxSpeed);
                if (keys.current['ArrowLeft'] || keys.current['a']) p.angle += turnSpeed;
                if (keys.current['ArrowRight'] || keys.current['d']) p.angle -= turnSpeed;
            }
            if (keys.current[' ']) p.speed *= 0.85;
        } else {
            const walkSpeed = 1.2;
            if (keys.current['ArrowLeft'] || keys.current['a']) p.angle += 0.1;
            if (keys.current['ArrowRight'] || keys.current['d']) p.angle -= 0.1;
            
            if (keys.current['ArrowUp'] || keys.current['w'] || keys.current['ArrowDown'] || keys.current['s']) {
                p.speed = walkSpeed; isMoving = true;
            } else { p.speed = 0; }
        }

        const nextX = p.x - Math.sin(p.angle) * p.speed;
        const nextY = p.y - Math.cos(p.angle) * p.speed;

        // Collision
        let collision = false;
        if (nextX < 0 || nextX > MAP_WIDTH || nextY < 0 || nextY > MAP_HEIGHT) collision = true;
        if (!collision) {
             const pW = p.width / 2; const pL = p.height / 2;
             for (const ob of obstacles.current) {
                 if (Math.abs(ob.x - nextX) > 100 || Math.abs(ob.y - nextY) > 100) continue;
                 if (nextX + pW > ob.x - ob.w/2 && nextX - pW < ob.x + ob.w/2 &&
                     nextY + pL > ob.y - ob.h/2 && nextY - pL < ob.y + ob.h/2) {
                     collision = true; break;
                 }
             }
        }
        
        if (!collision && p.inVehicle) {
            for (const t of traffic.current) {
                if (!t.active) continue;
                if (Math.hypot(t.x - nextX, t.y - nextY) < 25) { 
                    collision = true; p.health = Math.max(0, p.health - 2); p.speed = -p.speed * 0.5; 
                    onGameUpdateRef.current({ health: p.health });
                    if (now - t.lastHit > 2000) { 
                        t.lastHit = now; p.hitCount = (p.hitCount || 0) + 1;
                        if (p.hitCount > 3 && p.wanted === 0) { p.wanted = 1; onGameUpdateRef.current({ wantedLevel: 1 }); }
                    }
                    break; 
                }
            }
        }

        if (!collision) { p.x = nextX; p.y = nextY; } 
        else {
            if (!p.inVehicle) { p.speed = 0; p.x += Math.sin(p.angle)*2; p.y += Math.cos(p.angle)*2; }
            else p.speed = -p.speed * 0.5;
        }

        // Update Active Mesh
        const activeMesh = p.inVehicle 
            ? (p.vehicleType === 'ferrari' ? playerFerrari : (p.vehicleType === 'auto' ? playerAuto : playerCar))
            : playerMesh;
        activeMesh.position.set(p.x, 0, p.y); activeMesh.rotation.y = p.angle + Math.PI;

        // Player Animation (Walking)
        if (!p.inVehicle && p.parts) {
            if (isMoving) {
                const time = now * 0.01;
                const legAmp = 0.6; const armAmp = 0.5;
                p.parts.legL.rotation.x = Math.sin(time * 1.5) * legAmp;
                p.parts.legR.rotation.x = Math.sin(time * 1.5 + Math.PI) * legAmp;
                p.parts.armL.rotation.x = Math.sin(time * 1.5 + Math.PI) * armAmp;
                p.parts.armR.rotation.x = Math.sin(time * 1.5) * armAmp;
            } else {
                p.parts.legL.rotation.x = 0; p.parts.legR.rotation.x = 0;
                p.parts.armL.rotation.x = 0; p.parts.armR.rotation.x = 0;
            }
        }

        let currentDistrict = "Unknown Territory";
        for (const d of DISTRICTS) { if (p.x >= d.x && p.x <= d.x + d.width && p.y >= d.y && p.y <= d.y + d.height) { currentDistrict = d.name; break; } }
        onLocationUpdateRef.current(p.x, p.y, currentDistrict);

        // --- POLICE AI (Condensed) ---
        if (p.wanted > 0) {
            const desiredPolice = Math.min(p.wanted, 5); 
            if (policeCars.current.length < desiredPolice) {
                const pm = createPoliceCarMesh(); const spawnAngle = Math.random() * Math.PI * 2; const dist = 300;
                const px = p.x + Math.sin(spawnAngle) * dist; const py = p.y + Math.cos(spawnAngle) * dist;
                if (px > 0 && px < MAP_WIDTH && py > 0 && py < MAP_HEIGHT) {
                    pm.mesh.position.set(px, 0, py); scene.add(pm.mesh);
                    policeCars.current.push({ x: px, y: py, speed: 0, angle: Math.atan2(p.x - px, p.y - py), mesh: pm.mesh, active: true, ...pm });
                }
            }
        } else { policeCars.current.forEach(pc => { scene.remove(pc.mesh); pc.active = false; }); policeCars.current = []; }

        policeCars.current.forEach(pc => {
            if (!pc.active) return;
            const dx = p.x - pc.x; const dy = p.y - pc.y; const targetAngle = Math.atan2(dx, dy); 
            const diff = targetAngle - pc.angle; let dAngle = Math.atan2(Math.sin(diff), Math.cos(diff));
            pc.angle += dAngle * 0.05; if (pc.speed < 4.5) pc.speed += 0.1;
            const nx = pc.x + Math.sin(pc.angle) * pc.speed; const ny = pc.y + Math.cos(pc.angle) * pc.speed;
            let pCol = false;
            for (const ob of obstacles.current) { if (Math.abs(ob.x - nx) > 80 || Math.abs(ob.y - ny) > 80) continue; if (nx > ob.x - ob.w/2 - 10 && nx < ob.x + ob.w/2 + 10 && ny > ob.y - ob.h/2 - 10 && ny < ob.y + ob.h/2 + 10) { pCol = true; break; } }
            if (pCol) { pc.speed *= -0.5; pc.angle += (Math.random() > 0.5 ? 1 : -1) * Math.PI / 2; } else { pc.x = nx; pc.y = ny; }
            pc.mesh.position.set(pc.x, 0, pc.y); pc.mesh.rotation.y = pc.angle + Math.PI;
            const sirenState = Math.floor(frameCount / 10) % 2 === 0; (pc as any).red.material.color.setHex(sirenState ? 0xff0000 : 0x330000); (pc as any).blue.material.color.setHex(!sirenState ? 0x0000ff : 0x000033);
            if (Math.hypot(p.x - pc.x, p.y - pc.y) < 25) { p.health = Math.max(0, p.health - 1); onGameUpdateRef.current({ health: p.health }); p.speed += 0.5; pc.speed = -2; }
        });

        // Traffic AI
        traffic.current.forEach(t => {
            if (!t.active) return;
            let tx = t.x - Math.sin(t.angle) * t.speed; let ty = t.y - Math.cos(t.angle) * t.speed;
            if (tx < 0) tx = MAP_WIDTH; if (tx > MAP_WIDTH) tx = 0; if (ty < 0) ty = MAP_HEIGHT; if (ty > MAP_HEIGHT) ty = 0;
            let tCol = false;
            for (const ob of obstacles.current) { if (Math.abs(ob.x - tx) > 60 || Math.abs(ob.y - ty) > 60) continue; if (tx > ob.x - ob.w/2 - 5 && tx < ob.x + ob.w/2 + 5 && ty > ob.y - ob.h/2 - 5 && ty < ob.y + ob.h/2 + 5) { tCol = true; break; } }
            if (tCol) t.angle += Math.PI / 2; else { t.x = tx; t.y = ty; if (Math.random() < 0.005) t.angle += (Math.random() - 0.5); }
            if (t.mesh) { t.mesh.position.set(t.x, 0, t.y); t.mesh.rotation.y = t.angle + Math.PI; }
        });

        // Pedestrian AI & Animation
        pedestrians.current.forEach(pe => {
            if (pe.dead) return;
            pe.x += Math.sin(pe.angle) * pe.speed; pe.y += Math.cos(pe.angle) * pe.speed;
            if (pe.x < 0 || pe.x > MAP_WIDTH) pe.angle += Math.PI; if (pe.y < 0 || pe.y > MAP_HEIGHT) pe.angle += Math.PI;
            if (Math.random() < 0.02) pe.angle += (Math.random() - 0.5);
            if (pe.parts) { 
                pe.parts.mesh.position.set(pe.x, 0, pe.y); 
                pe.parts.mesh.rotation.y = pe.angle; 
                // Walk Cycle
                const time = now * 0.01 + pe.animOffset;
                const legAmp = 0.5; const armAmp = 0.4;
                pe.parts.legL.rotation.x = Math.sin(time * 2) * legAmp;
                pe.parts.legR.rotation.x = Math.sin(time * 2 + Math.PI) * legAmp;
                pe.parts.armL.rotation.x = Math.sin(time * 2 + Math.PI) * armAmp;
                pe.parts.armR.rotation.x = Math.sin(time * 2) * armAmp;
            }
        });
    };

    const updateCamera = () => {
        const p = player.current;
        const dist = cameraDist.current;
        const height = Math.max(20, dist * 0.5); 
        
        // Combine player angle with manual rotation
        const angle = p.angle + cameraRotation.current;
        
        const cx = p.x + Math.sin(angle) * dist; 
        const cz = p.y + Math.cos(angle) * dist;
        
        camera.position.x += (cx - camera.position.x) * 0.1; 
        camera.position.z += (cz - camera.position.z) * 0.1; 
        camera.position.y += (height - camera.position.y) * 0.1;
        camera.lookAt(p.x, 0, p.y);
        dirLight.position.set(p.x + 100, 300, p.y + 100);
        const activeMesh = p.inVehicle 
            ? (p.vehicleType === 'ferrari' ? playerFerrari : (p.vehicleType === 'auto' ? playerAuto : playerCar))
            : playerMesh;
        dirLight.target = activeMesh;
    };

    const handleResize = () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); };
    window.addEventListener('resize', handleResize);
    gameLoop();
    return () => { cancelAnimationFrame(animationId); window.removeEventListener('resize', handleResize); mountRef.current?.removeChild(renderer.domElement); renderer.dispose(); };
  }, [isPhoneOpen, navigationTarget]);

  return <div ref={mountRef} className={`block w-full h-full ${cursorClass}`} role="img" aria-label="3D Game Canvas" aria-hidden="true" />;
};