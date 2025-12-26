'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface BattedBallData {
  launch_speed: number;
  launch_angle: number;
  spray_angle: number;
  spin_rate: number;
  hit_distance_sc: number;
}

interface SimulationResult {
  path: THREE.Vector3[];
  Cl: number;
  Cd: number;
  releaseH: number;
  spinRpm: number;
}

const SprayVisualization = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentColorGroup, setCurrentColorGroup] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const isPlayingRef = useRef(false);
  const currentColorGroupRef = useRef(0);
  const animationSpeedRef = useRef(1);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    currentColorGroupRef.current = currentColorGroup;
  }, [currentColorGroup]);

  useEffect(() => {
    animationSpeedRef.current = animationSpeed;
  }, [animationSpeed]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Constants from Blender script
    const RHO = 1.2;
    const MASS = 0.145;
    const RADIUS = 0.0366;
    const AREA = Math.PI * RADIUS * RADIUS;
    const GRAVITY = 9.81;

    // Physics simulation
    const simulateHit = (
      evMph: number,
      laDeg: number,
      sprayDeg: number,
      spinRpm: number,
      Cl: number,
      Cd: number,
      releaseH: number,
      dt: number = 0.01
    ): THREE.Vector3[] => {
      const evMps = evMph * 0.44704;
      const la = (laDeg * Math.PI) / 180;
      const sa = (-sprayDeg * Math.PI) / 180;

      let vx = evMps * Math.cos(la) * Math.cos(sa);
      let vy = evMps * Math.cos(la) * Math.sin(sa);
      let vz = evMps * Math.sin(la);

      let x = 0, y = 0, z = releaseH;
      const path: THREE.Vector3[] = [new THREE.Vector3(x, y, z)];

      while (z > 0) {
        const v = Math.sqrt(vx * vx + vy * vy + vz * vz);
        if (v < 1e-6) break;

        // Drag
        const Fd = 0.5 * RHO * AREA * Cd * v * v;
        const axDrag = -(Fd / MASS) * (vx / v);
        const ayDrag = -(Fd / MASS) * (vy / v);
        const azDrag = -(Fd / MASS) * (vz / v);

        // Lift (Magnus force)
        const Fl = 0.5 * RHO * AREA * Cl * v * v;
        const liftZ = (Fl / MASS) * 0.8;
        const vxyHypot = Math.max(1e-6, Math.hypot(vx, vy));
        const liftX = (Fl / MASS) * 0.1 * (-vy / vxyHypot);
        const liftY = (Fl / MASS) * 0.1 * (vx / vxyHypot);

        const ax = axDrag + liftX;
        const ay = ayDrag + liftY;
        const az = azDrag + liftZ - GRAVITY;

        vx += ax * dt;
        vy += ay * dt;
        vz += az * dt;

        x += vx * dt;
        y += vy * dt;
        z += vz * dt;

        path.push(new THREE.Vector3(x, y, Math.max(z, 0)));
      }

      return path;
    };

    // Calibration to match target distance
    const calibrateHit = (hit: BattedBallData): SimulationResult => {
      const targetFt = hit.hit_distance_sc;
      let Cl = 0.2, Cd = 0.5, releaseH = 1.0, spinRpm = hit.spin_rate;
      const tolFt = 1.0;
      const maxIter = 50;

      let path: THREE.Vector3[] = [];

      for (let i = 0; i < maxIter; i++) {
        path = simulateHit(
          hit.launch_speed,
          hit.launch_angle,
          hit.spray_angle,
          spinRpm,
          Cl,
          Cd,
          releaseH
        );

        const lastPoint = path[path.length - 1];
        const simDistanceM = Math.hypot(lastPoint.x, lastPoint.y);
        const simFt = simDistanceM * 3.28084;
        const diff = targetFt - simFt;

        if (Math.abs(diff) < tolFt) break;

        Cl += 0.001 * diff;
        Cd -= 0.0005 * diff;
        releaseH += 0.0005 * diff;
        spinRpm += 0.5 * diff;

        Cl = Math.min(Math.max(0.1, Cl), 0.25);
        Cd = Math.min(Math.max(0.45, Cd), 0.55);
        releaseH = Math.min(Math.max(0.95, releaseH), 1.1);
        spinRpm = Math.min(Math.max(1500, spinRpm), 3000);
      }

      return { path, Cl, Cd, releaseH, spinRpm };
    };

    // Color based on distance
    const glowColorFromDistance = (distFt: number): THREE.Color => {
      if (distFt < 350) return new THREE.Color(0x00ff00); // Green
      else if (distFt < 400) return new THREE.Color(0x0000ff); // Blue
      else if (distFt < 450) return new THREE.Color(0xffff00); // Yellow
      else return new THREE.Color(0xff0000); // Red
    };

    const colorPriority = (distFt: number): number => {
      if (distFt >= 450) return 4; // Red
      else if (distFt >= 400) return 3; // Yellow
      else if (distFt >= 350) return 2; // Blue
      else return 1; // Green
    };

    // Sample hits data
    const hits: BattedBallData[] = [{'launch_speed': 103.4, 'launch_angle': 32, 'spray_angle': 34.78332709281045, 'spin_rate': 2345, 'hit_distance_sc': 385}, 
        {'launch_speed': 106.4, 'launch_angle': 22, 'spray_angle': 30.776287370189404, 'spin_rate': 1101, 'hit_distance_sc': 386}, 
        {'launch_speed': 103.1, 'launch_angle': 13, 'spray_angle': 13.299953544055224, 'spin_rate': 2455, 'hit_distance_sc': 266}, 
        {'launch_speed': 103.6, 'launch_angle': 27, 'spray_angle': 2.9474921575675808, 'spin_rate': 1427, 'hit_distance_sc': 407}, 
        {'launch_speed': 109.9, 'launch_angle': 22, 'spray_angle': -0.6464693722655076, 'spin_rate': 1976, 'hit_distance_sc': 419}, 
        {'launch_speed': 107.5, 'launch_angle': 29, 'spray_angle': 17.62708386887658, 'spin_rate': 2102, 'hit_distance_sc': 416}, 
        {'launch_speed': 108.9, 'launch_angle': 26, 'spray_angle': 1.5261296450290451, 'spin_rate': 2397, 'hit_distance_sc': 446}, 
        {'launch_speed': 97.9, 'launch_angle': 30, 'spray_angle': -32.15351244917092, 'spin_rate': 2520, 'hit_distance_sc': 365}, 
        {'launch_speed': 113.0, 'launch_angle': 21, 'spray_angle': 26.311951643868632, 'spin_rate': 1573, 'hit_distance_sc': 417}, 
        {'launch_speed': 111.4, 'launch_angle': 26, 'spray_angle': 16.539358780356928, 'spin_rate': 1423, 'hit_distance_sc': 439}, 
        {'launch_speed': 97.8, 'launch_angle': 27, 'spray_angle': 45.03452032458378, 'spin_rate': 2014, 'hit_distance_sc': 373}, 
        {'launch_speed': 110.0, 'launch_angle': 39, 'spray_angle': 29.553035462142766, 'spin_rate': 2081, 'hit_distance_sc': 389}, 
        {'launch_speed': 105.5, 'launch_angle': 27, 'spray_angle': 27.658355479277425, 'spin_rate': 2141, 'hit_distance_sc': 393}, 
        {'launch_speed': 108.2, 'launch_angle': 26, 'spray_angle': -4.054256471388851, 'spin_rate': 2278, 'hit_distance_sc': 411}, 
        {'launch_speed': 99.6, 'launch_angle': 25, 'spray_angle': 26.081694613247485, 'spin_rate': 2307, 'hit_distance_sc': 378}, 
        {'launch_speed': 101.8, 'launch_angle': 30, 'spray_angle': -22.94745161028674, 'spin_rate': 2487, 'hit_distance_sc': 388}]

    // Group by color
    const hitsByColor: { [key: number]: BattedBallData[] } = { 1: [], 2: [], 3: [], 4: [] };
    hits.forEach(hit => {
      const prio = colorPriority(hit.hit_distance_sc);
      hitsByColor[prio].push(hit);
    });

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    const camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
    camera.position.set(0, 80, 100);
    camera.lookAt(0, 0, -100);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(800, 600);
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    scene.add(directionalLight);

    // Load ballpark model
    const loader = new GLTFLoader();
    loader.load(
      '/Spray_Charts.glb', // Your file in public/ballpark.glb
      (gltf) => {
        const ballpark = gltf.scene;
        
        // Position and scale as needed
        ballpark.position.set(0, 0, 0);
        ballpark.scale.set(1, 1, 1);
        
        // Rotate 90 degrees counter-clockwise (around Y axis)
        ballpark.rotation.y = Math.PI / 2;
        
        scene.add(ballpark);
        console.log('Ballpark loaded successfully!');
      },
      (progress) => {
        console.log('Loading ballpark:', Math.round(progress.loaded / progress.total * 100) + '%');
      },
      (error) => {
        console.error('Error loading ballpark:', error);
      }
    );

    // Create all trajectories grouped by color
    interface BallAnimationData {
      ball: THREE.Mesh;
      trajectory: THREE.Vector3[];
      line: THREE.Line;
      tubeMesh: THREE.Mesh;
      currentFrame: number;
      totalFrames: number;
      colorGroup: number;
    }

    const allBalls: BallAnimationData[] = [];

    Object.keys(hitsByColor).sort().forEach(colorPrio => {
      const colorHits = hitsByColor[parseInt(colorPrio)];

      colorHits.forEach((hit, idx) => {
        const { path } = calibrateHit(hit);
        const color = glowColorFromDistance(hit.hit_distance_sc);

        // Convert path to Three.js coordinates
        const displayPath = path.map(p => new THREE.Vector3(-p.y, p.z, -p.x));

        // Create glowing tube
        const curve = new THREE.CatmullRomCurve3(displayPath);
        const tubeGeometry = new THREE.TubeGeometry(curve, displayPath.length * 2, 0.08, 12, false);
        const tubeMaterial = new THREE.MeshStandardMaterial({
          color: color,
          emissive: color,
          emissiveIntensity: 0.8,
          transparent: true,
          opacity: 0
        });
        const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
        scene.add(tubeMesh);

        // Create ball
        const ballGeometry = new THREE.SphereGeometry(0.0366, 16, 16);
        const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const ball = new THREE.Mesh(ballGeometry, ballMaterial);
        ball.position.copy(displayPath[0]);
        ball.visible = false;
        scene.add(ball);

        const totalFrames = displayPath.length;

        allBalls.push({
          ball,
          trajectory: displayPath,
          line: new THREE.Line(), // placeholder
          tubeMesh,
          currentFrame: 0,
          totalFrames,
          colorGroup: parseInt(colorPrio)
        });
      });
    });

    // Animation state
    let animationFrame = 0;

    const animate = () => {
      requestAnimationFrame(animate);

      if (isPlayingRef.current) {
        const currentGroup = currentColorGroupRef.current + 1;

        // Get balls in current color group
        const groupBalls = allBalls.filter(b => b.colorGroup === currentGroup);

        if (groupBalls.length > 0) {
          let allFinished = true;

          groupBalls.forEach(ballData => {
            if (ballData.currentFrame < ballData.totalFrames) {
              allFinished = false;

              // Show ball
              ballData.ball.visible = true;

              // Calculate frame step based on speed
              const currentFrameIndex = Math.min(
                Math.floor(ballData.currentFrame),
                ballData.totalFrames - 1
              );
              
              // Update ball position
              ballData.ball.position.copy(ballData.trajectory[currentFrameIndex]);

              // Animate tube growing (progressive reveal)
              const partialPath = ballData.trajectory.slice(0, currentFrameIndex + 1);
              
              if (partialPath.length > 1) {
                // Remove old tube
                scene.remove(ballData.tubeMesh);
                
                // Create new tube with partial path
                const curve = new THREE.CatmullRomCurve3(partialPath);
                const tubeGeometry = new THREE.TubeGeometry(curve, Math.max(partialPath.length, 2), 0.08, 12, false);
                const color = glowColorFromDistance(
                  hits.find(h => colorPriority(h.hit_distance_sc) === ballData.colorGroup)?.hit_distance_sc || 0
                );
                const tubeMaterial = new THREE.MeshStandardMaterial({
                  color: color,
                  emissive: color,
                  emissiveIntensity: 1.2,
                  transparent: true,
                  opacity: 0.8
                });
                ballData.tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
                scene.add(ballData.tubeMesh);
              }

              ballData.currentFrame += animationSpeedRef.current;
            }
          });

          // Move to next color group when all balls finish
          if (allFinished) {
            if (currentGroup < 4) {
              setCurrentColorGroup(currentGroup);
            } else {
              setIsPlaying(false);
            }
          }
        }

        animationFrame++;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      containerRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentColorGroup(0);
    window.location.reload(); // Simple reset for now
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">3D Batted Ball Physics Simulation</h1>

      <div className="mb-4 flex gap-4 items-center">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>

        <button
          onClick={handleReset}
          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Reset
        </button>

        <div className="text-sm">
          Color Group: {currentColorGroup + 1} / 4
        </div>
        
        <div className="flex items-center gap-3 ml-4">
          <label className="text-sm font-medium">Speed:</label>
          <input
            type="range"
            min="0.25"
            max="5"
            step="0.25"
            value={animationSpeed}
            onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
            className="w-32"
          />
          <span className="text-sm w-12">{animationSpeed.toFixed(2)}x</span>
        </div>
      </div>

      <div ref={containerRef} className="border border-gray-300"></div>

      <div className="mt-4">
        <p className="text-gray-600">Physics-based simulation with drag, lift, and calibrated distances</p>
        <div className="mt-2 flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-600 rounded-full"></div>
            <span>&lt;350 ft</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
            <span>350-400 ft</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
            <span>400-450 ft</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-600 rounded-full"></div>
            <span>450+ ft</span>
          </div>
        </div>
      </div>
    </main>
  );
};

export default SprayVisualization;