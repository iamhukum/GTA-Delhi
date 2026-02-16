import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { MAP_WIDTH, MAP_HEIGHT, DISTRICTS, LANDMARKS, CAR_COLORS } from '../constants';

interface GameCanvasProps {
  onLocationUpdate: (x: number, y: number, district: string) => void;
  isPhoneOpen: boolean;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ onLocationUpdate, isPhoneOpen }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  
  // Game logic refs
  const player = useRef({ x: 2000, y: 2000, angle: 0, speed: 0 });
  const keys = useRef<{ [key: string]: boolean }>({});
  
  // Traffic: Mix of Cars and Autos
  const traffic = useRef(Array.from({ length: 60 }, () => ({
    x: Math.random() * MAP_WIDTH,
    y: Math.random() * MAP_HEIGHT,
    speed: 0.5 + Math.random() * 1.5,
    angle: Math.random() * Math.PI * 2,
    type: Math.random() > 0.6 ? 'auto' : 'car', // 40% Autos
    color: CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)],
    mesh: null as THREE.Group | null
  })));

  // Pedestrians
  const pedestrians = useRef(Array.from({ length: 80 }, () => ({
    x: Math.random() * MAP_WIDTH,
    y: Math.random() * MAP_HEIGHT,
    speed: 0.1 + Math.random() * 0.1, // Walking speed
    angle: Math.random() * Math.PI * 2,
    color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5),
    mesh: null as THREE.Group | null
  })));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    // --- THREE.JS SETUP ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Delhi Sky Blue
    scene.fog = new THREE.Fog(0x87CEEB, 100, 1200);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    // --- LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.2); // Warm sun
    dirLight.position.set(100, 300, 100);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 1000;
    dirLight.shadow.camera.left = -500;
    dirLight.shadow.camera.right = 500;
    dirLight.shadow.camera.top = 500;
    dirLight.shadow.camera.bottom = -500;
    scene.add(dirLight);

    // --- WORLD GENERATION ---
    
    // Ground
    const groundGeo = new THREE.PlaneGeometry(MAP_WIDTH, MAP_HEIGHT);
    const groundMat = new THREE.MeshStandardMaterial({ 
        color: 0x333333,
        roughness: 0.8,
    }); 
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(MAP_WIDTH / 2, -0.1, MAP_HEIGHT / 2);
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid Helper (Road lines)
    const gridHelper = new THREE.GridHelper(MAP_WIDTH, 40, 0xaaaaaa, 0x555555);
    gridHelper.position.set(MAP_WIDTH / 2, 0, MAP_HEIGHT / 2);
    scene.add(gridHelper);

    // Buildings Generator
    const createBuildingGeometry = (width: number, height: number, depth: number, type: string) => {
        const geo = new THREE.BoxGeometry(width, height, depth);
        geo.translate(0, height/2, 0); // Pivot at bottom
        return geo;
    };

    // Trees Storage
    const treeGeo = new THREE.ConeGeometry(8, 25, 8);
    const treeMat = new THREE.MeshLambertMaterial({ color: 0x228b22 });
    const trunkGeo = new THREE.CylinderGeometry(2, 2, 10);
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    const treesGroup = new THREE.Group();

    // Generate Districts
    DISTRICTS.forEach(d => {
        // District Floor Color (Subtle)
        const zoneGeo = new THREE.PlaneGeometry(d.width, d.height);
        const zoneMat = new THREE.MeshBasicMaterial({ color: d.color, transparent: true, opacity: 0.05 });
        const zone = new THREE.Mesh(zoneGeo, zoneMat);
        zone.rotation.x = -Math.PI / 2;
        zone.position.set(d.x + d.width/2, 0.1, d.y + d.height/2);
        scene.add(zone);

        // Determine Building Style
        let buildingColor = 0xcccccc;
        let heightScale = 1;
        let density = 12000; // Lower is denser
        let isGlass = false;

        if (d.name.includes("Connaught")) {
            buildingColor = 0xffffff; // CP White
            heightScale = 0.6; // Lower, spread out
            density = 10000;
        } else if (d.name.includes("Old Delhi")) {
            buildingColor = 0xa52a2a; // Red Brick
            heightScale = 0.4;
            density = 4000; // Very dense
        } else if (d.name.includes("Cyber")) {
            buildingColor = 0x87cefa; // Blue Glass
            heightScale = 2.5; // Skyscrapers
            density = 15000;
            isGlass = true;
        } else {
            buildingColor = 0xf5deb3; // Wheat/Beige Residential
            heightScale = 0.8;
            density = 8000;
        }

        const mat = isGlass 
            ? new THREE.MeshPhongMaterial({ color: buildingColor, shininess: 100, specular: 0x111111, transparent: true, opacity: 0.9 })
            : new THREE.MeshLambertMaterial({ color: buildingColor });

        const boxGeo = new THREE.BoxGeometry(1, 1, 1);
        const numBuildings = Math.floor((d.width * d.height) / density);
        const mesh = new THREE.InstancedMesh(boxGeo, mat, numBuildings);
        const matrix = new THREE.Matrix4();
        
        for (let i = 0; i < numBuildings; i++) {
            const bx = d.x + Math.random() * d.width;
            const by = d.y + Math.random() * d.height;
            
            // Roads Gap
            if (Math.abs(bx % 100) < 12 || Math.abs(by % 100) < 12) {
                // Place a tree on the sidewalk instead
                if (Math.random() > 0.7) {
                    const tree = new THREE.Group();
                    const leaves = new THREE.Mesh(treeGeo, treeMat);
                    leaves.position.y = 15;
                    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
                    trunk.position.y = 5;
                    tree.add(leaves);
                    tree.add(trunk);
                    tree.position.set(bx, 0, by);
                    treesGroup.add(tree);
                }
                continue;
            }

            const bw = 25 + Math.random() * 20;
            const bd = 25 + Math.random() * 20;
            const bh = (30 + Math.random() * 80) * heightScale;

            matrix.makeScale(bw, bh, bd);
            matrix.setPosition(bx, bh/2, by);
            mesh.setMatrixAt(i, matrix);
        }
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
    });
    
    scene.add(treesGroup);

    // Landmarks
    LANDMARKS.forEach(l => {
        let geometry;
        let material = new THREE.MeshPhongMaterial({ color: 0xffd700 }); // Gold default

        if (l.type === 'monument') {
            // Red Fort style walls
            geometry = new THREE.BoxGeometry(120, 40, 120);
            material.color.setHex(0x8b0000); // Dark Red
        } else if (l.type === 'office') {
            // Cyber Hub
            geometry = new THREE.CylinderGeometry(40, 40, 200, 8);
            material.color.setHex(0x1e3a8a); // Dark Blue
        } else if (l.type === 'shop') {
             // Palika
            geometry = new THREE.CylinderGeometry(60, 60, 20, 32);
            material.color.setHex(0xffffff);
        } else {
            geometry = new THREE.ConeGeometry(20, 80, 16);
        }

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(l.x, 20, l.y);
        mesh.castShadow = true;
        scene.add(mesh);
        
        // Text Label Beacon
        const beaconGeo = new THREE.CylinderGeometry(2, 2, 400, 4);
        const beaconMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.set(l.x, 200, l.y);
        scene.add(beacon);
    });

    // --- MESH GENERATORS ---
    
    // 1. Car Generator
    const createCarMesh = (color: string) => {
        const carGroup = new THREE.Group();
        // Chassis
        const chassis = new THREE.Mesh(
            new THREE.BoxGeometry(18, 8, 36),
            new THREE.MeshPhongMaterial({ color: color })
        );
        chassis.position.y = 7;
        chassis.castShadow = true;
        carGroup.add(chassis);
        // Cabin
        const cabin = new THREE.Mesh(
            new THREE.BoxGeometry(16, 6, 20),
            new THREE.MeshPhongMaterial({ color: 0x333333 })
        );
        cabin.position.set(0, 14, -2);
        carGroup.add(cabin);
        // Wheels
        const wheelGeo = new THREE.CylinderGeometry(4, 4, 2, 8);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const wheelPos = [{x:-9,z:12}, {x:9,z:12}, {x:-9,z:-12}, {x:9,z:-12}];
        wheelPos.forEach(p => {
            const w = new THREE.Mesh(wheelGeo, wheelMat);
            w.rotation.z = Math.PI/2;
            w.position.set(p.x, 4, p.z);
            carGroup.add(w);
        });
        return carGroup;
    };

    // 2. Auto Rickshaw Generator (Delhi Style)
    const createAutoMesh = () => {
        const autoGroup = new THREE.Group();
        // Green Lower Body
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(14, 10, 24),
            new THREE.MeshPhongMaterial({ color: 0x006400 }) // Dark Green
        );
        body.position.y = 7;
        body.castShadow = true;
        autoGroup.add(body);
        
        // Yellow Top
        const top = new THREE.Mesh(
            new THREE.BoxGeometry(13, 8, 20),
            new THREE.MeshPhongMaterial({ color: 0xFFD700 }) // Yellow
        );
        top.position.set(0, 16, 0);
        autoGroup.add(top);

        // Wheels (3 wheels)
        const wheelGeo = new THREE.CylinderGeometry(3, 3, 2, 8);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        // Front wheel
        const fw = new THREE.Mesh(wheelGeo, wheelMat);
        fw.rotation.z = Math.PI/2;
        fw.position.set(0, 3, 10); // Front center
        autoGroup.add(fw);
        // Back wheels
        const bw1 = new THREE.Mesh(wheelGeo, wheelMat);
        bw1.rotation.z = Math.PI/2;
        bw1.position.set(-7, 3, -8);
        autoGroup.add(bw1);
        const bw2 = new THREE.Mesh(wheelGeo, wheelMat);
        bw2.rotation.z = Math.PI/2;
        bw2.position.set(7, 3, -8);
        autoGroup.add(bw2);

        return autoGroup;
    };

    // 3. Pedestrian Generator
    const createPedestrianMesh = (color: THREE.Color) => {
        const group = new THREE.Group();
        // Body
        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 5, 8),
            new THREE.MeshLambertMaterial({ color: color })
        );
        body.position.y = 2.5;
        body.castShadow = true;
        group.add(body);
        // Head
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(1.5, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0xd2b48c }) // Skin tone
        );
        head.position.y = 6;
        group.add(head);
        return group;
    }

    // --- INSTANTIATE ACTORS ---

    // Player
    const playerMesh = createCarMesh('#ffffff');
    // Add arrow indicator
    const arrow = new THREE.Mesh(
        new THREE.ConeGeometry(2, 5, 8),
        new THREE.MeshBasicMaterial({ color: 0xffff00 })
    );
    arrow.rotation.x = Math.PI;
    arrow.position.y = 30;
    playerMesh.add(arrow);
    scene.add(playerMesh);

    // Traffic
    traffic.current.forEach(t => {
        let mesh;
        if (t.type === 'auto') {
            mesh = createAutoMesh();
        } else {
            mesh = createCarMesh(t.color);
        }
        mesh.position.set(t.x, 0, t.y);
        scene.add(mesh);
        t.mesh = mesh;
    });

    // Pedestrians
    pedestrians.current.forEach(p => {
        const mesh = createPedestrianMesh(p.color);
        mesh.position.set(p.x, 0, p.y);
        scene.add(mesh);
        p.mesh = mesh;
    });

    // --- GAME LOOP ---
    let animationId: number;

    const gameLoop = () => {
        if (!isPhoneOpen) {
            updatePhysics();
            updateCamera();
        }
        renderer.render(scene, camera);
        animationId = requestAnimationFrame(gameLoop);
    };

    const updatePhysics = () => {
        const p = player.current;

        // Player Controls
        if (keys.current['ArrowUp'] || keys.current['w']) p.speed = Math.min(p.speed + 0.1, 3.5);
        else if (keys.current['ArrowDown'] || keys.current['s']) p.speed = Math.max(p.speed - 0.1, -1.5);
        else p.speed *= 0.96;

        if (keys.current['ArrowLeft'] || keys.current['a']) p.angle += 0.03;
        if (keys.current['ArrowRight'] || keys.current['d']) p.angle -= 0.03;

        p.x -= Math.sin(p.angle) * p.speed;
        p.y -= Math.cos(p.angle) * p.speed;

        // Map Bounds
        p.x = Math.max(0, Math.min(MAP_WIDTH, p.x));
        p.y = Math.max(0, Math.min(MAP_HEIGHT, p.y));

        playerMesh.position.set(p.x, 0, p.y);
        playerMesh.rotation.y = p.angle + Math.PI; 

        // Update Location Name
        let currentDistrict = "Unknown Territory";
        for (const d of DISTRICTS) {
            if (p.x >= d.x && p.x <= d.x + d.width && p.y >= d.y && p.y <= d.y + d.height) {
                currentDistrict = d.name;
                break;
            }
        }
        onLocationUpdate(p.x, p.y, currentDistrict);

        // Update Traffic
        traffic.current.forEach(t => {
            t.x -= Math.sin(t.angle) * t.speed;
            t.y -= Math.cos(t.angle) * t.speed;

            if (t.x < 0) t.x = MAP_WIDTH;
            if (t.x > MAP_WIDTH) t.x = 0;
            if (t.y < 0) t.y = MAP_HEIGHT;
            if (t.y > MAP_HEIGHT) t.y = 0;

            if (Math.random() < 0.005) t.angle += (Math.random() - 0.5);

            if (t.mesh) {
                t.mesh.position.set(t.x, 0, t.y);
                t.mesh.rotation.y = t.angle + Math.PI;
            }
        });

        // Update Pedestrians
        pedestrians.current.forEach(pe => {
            pe.x += Math.sin(pe.angle) * pe.speed;
            pe.y += Math.cos(pe.angle) * pe.speed;

            // Simple bounce bounds
            if (pe.x < 0 || pe.x > MAP_WIDTH) pe.angle += Math.PI;
            if (pe.y < 0 || pe.y > MAP_HEIGHT) pe.angle += Math.PI;

            // Random turn
            if (Math.random() < 0.02) pe.angle += (Math.random() - 0.5);

            if (pe.mesh) {
                pe.mesh.position.set(pe.x, 0, pe.y);
                pe.mesh.rotation.y = pe.angle;
            }
        });
    };

    const updateCamera = () => {
        const p = player.current;
        const dist = 70;
        const height = 35;
        
        const cx = p.x + Math.sin(p.angle) * dist;
        const cz = p.y + Math.cos(p.angle) * dist;
        
        camera.position.x += (cx - camera.position.x) * 0.1;
        camera.position.z += (cz - camera.position.z) * 0.1;
        camera.position.y += (height - camera.position.y) * 0.1;
        
        camera.lookAt(p.x, 0, p.y);
        
        // Sun follows player for optimized shadows
        dirLight.position.set(p.x + 100, 300, p.y + 100);
        dirLight.target = playerMesh;
    };

    const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    gameLoop();

    return () => {
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', handleResize);
        mountRef.current?.removeChild(renderer.domElement);
        renderer.dispose();
    };

  }, [isPhoneOpen, onLocationUpdate]);

  return <div ref={mountRef} className="block w-full h-full" />;
};