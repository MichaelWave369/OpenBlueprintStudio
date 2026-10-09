import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { wallGeometry } from './model.js';

const SYMBOL_COLORS = {
  door: 0xf7b84b,
  window: 0x57d7ff,
  outlet: 0xa7f3d0,
  network: 0xc4b5fd,
};

function disposeGroup(group) {
  while (group.children.length) {
    const child = group.children.pop();
    child.geometry?.dispose();
    if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose());
    else child.material?.dispose();
  }
}

export default function ThreePreview({ project, selectedId, onStatus }) {
  const mountRef = useRef(null);
  const sceneState = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    const probe = document.createElement('canvas');
    if (!probe.getContext('webgl2')) {
      onStatus({ available: false, message: 'WebGL 2 unavailable — 2D editor remains active.' });
      return undefined;
    }

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    } catch (error) {
      onStatus({ available: false, message: error instanceof Error ? error.message : '3D preview could not start.' });
      return undefined;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x06101c, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x06101c, 45, 90);
    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 500);
    camera.position.set(38, 30, 38);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(17, 2.5, 13);
    controls.maxPolarAngle = Math.PI / 2.04;
    controls.minDistance = 8;
    controls.maxDistance = 120;

    scene.add(new THREE.HemisphereLight(0xbcecff, 0x142338, 1.8));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(18, 32, 12);
    scene.add(key);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 60),
      new THREE.MeshStandardMaterial({ color: 0x091d2e, roughness: 0.92, metalness: 0.05 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(17, -0.04, 13);
    scene.add(floor);

    const grid = new THREE.GridHelper(80, 80, 0x2baed7, 0x14364b);
    grid.position.set(17, 0, 13);
    scene.add(grid);

    const content = new THREE.Group();
    scene.add(content);
    sceneState.current = { renderer, scene, camera, controls, content };

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    let frame;
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    animate();
    onStatus({ available: true, message: 'WebGL 2 live preview' });

    const onLost = (event) => {
      event.preventDefault();
      onStatus({ available: false, message: 'Graphics context lost — reload to restore the 3D preview.' });
    };
    renderer.domElement.addEventListener('webglcontextlost', onLost);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost', onLost);
      controls.dispose();
      disposeGroup(content);
      floor.geometry.dispose();
      floor.material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      sceneState.current = null;
    };
  }, [onStatus]);

  useEffect(() => {
    const state = sceneState.current;
    if (!state) return;
    disposeGroup(state.content);

    project.walls.forEach((wall) => {
      const geometryData = wallGeometry(wall);
      const geometry = new THREE.BoxGeometry(geometryData.length, wall.height, wall.thickness);
      const selected = wall.id === selectedId;
      const material = new THREE.MeshStandardMaterial({
        color: selected ? 0xf7b84b : 0x7ddcff,
        roughness: 0.42,
        metalness: 0.08,
        transparent: true,
        opacity: selected ? 1 : 0.88,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(geometryData.midX, wall.height / 2, geometryData.midY);
      mesh.rotation.y = -geometryData.angle;
      mesh.userData.elementId = wall.id;
      state.content.add(mesh);
    });

    project.symbols.forEach((symbol) => {
      const selected = symbol.id === selectedId;
      const geometry = new THREE.CylinderGeometry(selected ? 0.45 : 0.32, selected ? 0.45 : 0.32, selected ? 1.4 : 0.9, 12);
      const material = new THREE.MeshStandardMaterial({
        color: selected ? 0xffffff : SYMBOL_COLORS[symbol.type],
        emissive: SYMBOL_COLORS[symbol.type],
        emissiveIntensity: selected ? 0.9 : 0.35,
      });
      const marker = new THREE.Mesh(geometry, material);
      marker.position.set(symbol.x, selected ? 0.7 : 0.45, symbol.y);
      marker.userData.elementId = symbol.id;
      state.content.add(marker);
    });
  }, [project, selectedId]);

  return (
    <div className="preview-shell">
      <div ref={mountRef} className="three-mount" aria-label="Live 3D concept preview" />
      <div className="preview-hint">Drag to orbit · wheel to zoom · right-drag to pan</div>
    </div>
  );
}
