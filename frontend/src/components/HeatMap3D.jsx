import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ChevronDown, Sparkles, Filter, RefreshCw, ZoomIn, ZoomOut, Layers, Eye } from 'lucide-react';
import defaultData from '../data/mumbai_data.json';

export default function HeatMap3D({ customDelta = 0, selectedModel = 'pinn' }) {
  const containerRef = useRef(null);
  const [dataSummary, setDataSummary] = useState(defaultData.summary);
  const [pixels, setPixels] = useState(defaultData.pixels);
  const [hoveredPixel, setHoveredPixel] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [selectedTier, setSelectedTier] = useState('all'); // 'all', 'critical', 'high', 'moderate', 'normal', 'cool'
  const [isAutoRotate, setIsAutoRotate] = useState(false);
  const [cardCollapsed, setCardCollapsed] = useState(false);

  // Fetch real status from API if running
  useEffect(() => {
    fetch('/api/status')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'online') {
          setDataSummary(prev => ({
            ...prev,
            mean_lst: data.mean_lst,
            max_lst: data.max_lst,
            date_range: data.date_range,
            cycle: data.cycle,
            heat_tiers: data.heat_tiers
          }));
        }
      })
      .catch(() => {
        // Fallback to local json data
      });
  }, []);

  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const meshRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0d14);
    scene.fog = new THREE.FogExp2(0x0a0d14, 0.012);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.set(0, -36, 40);
    camera.lookAt(0, 3, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
    dirLight.position.set(20, -30, 40);
    scene.add(dirLight);

    // Subtle coordinate plane grid
    const gridHelper = new THREE.GridHelper(68, 48, 0x1e293b, 0x0f172a);
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.position.z = -0.15;
    scene.add(gridHelper);

    // Bounds & Geometry Setup
    const minLon = 72.75, maxLon = 73.02;
    const minLat = 18.88, maxLat = 19.32;
    const mapWidth = 36;
    const mapHeight = 52;

    const count = pixels.length;
    const boxGeo = new THREE.BoxGeometry(0.70, 0.70, 1);
    const boxMat = new THREE.MeshStandardMaterial({
      roughness: 0.35,
      metalness: 0.15,
    });

    const instancedMesh = new THREE.InstancedMesh(boxGeo, boxMat, count);
    meshRef.current = instancedMesh;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    const getColor = (effectiveLST) => {
      if (effectiveLST >= 38.0) return new THREE.Color(0xef4444); // Critical Red
      if (effectiveLST >= 35.0) return new THREE.Color(0xf97316); // High Orange
      if (effectiveLST >= 32.0) return new THREE.Color(0xeab308); // Moderate Yellow
      if (effectiveLST >= 29.0) return new THREE.Color(0x22c55e); // Normal Green
      return new THREE.Color(0x3b82f6); // Cool Blue
    };

    pixels.forEach((p, i) => {
      const x = ((p.lon - minLon) / (maxLon - minLon) - 0.5) * mapWidth;
      const y = ((p.lat - minLat) / (maxLat - minLat) - 0.5) * mapHeight;
      const effectiveLST = p.lst + customDelta;

      // Filter logic: if tier is selected, dim or scale others
      let matchesTier = true;
      if (selectedTier === 'critical') matchesTier = effectiveLST >= 38.0;
      else if (selectedTier === 'high') matchesTier = effectiveLST >= 35.0 && effectiveLST < 38.0;
      else if (selectedTier === 'moderate') matchesTier = effectiveLST >= 32.0 && effectiveLST < 35.0;
      else if (selectedTier === 'normal') matchesTier = effectiveLST >= 29.0 && effectiveLST < 32.0;
      else if (selectedTier === 'cool') matchesTier = effectiveLST < 29.0;

      const scaleZ = matchesTier ? Math.max(0.4, (effectiveLST - 24) * 0.22) : 0.08;
      dummy.position.set(x, y, scaleZ / 2);
      dummy.scale.set(matchesTier ? 1 : 0.4, matchesTier ? 1 : 0.4, scaleZ);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);

      if (matchesTier) {
        color.copy(getColor(effectiveLST));
      } else {
        color.set(0x1e293b); // Dimmed slate
      }
      instancedMesh.setColorAt(i, color);
    });

    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;
    scene.add(instancedMesh);

    // Raycasting & Mouse Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };

    const onMouseDown = (e) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      mouse.x = (clientX / width) * 2 - 1;
      mouse.y = -(clientY / height) * 2 + 1;
      setMousePos({ x: e.clientX, y: e.clientY });

      if (isDragging) {
        const deltaX = e.clientX - prevMousePos.x;
        const deltaY = e.clientY - prevMousePos.y;
        instancedMesh.rotation.z += deltaX * 0.005;
        camera.position.z = Math.max(14, Math.min(65, camera.position.z + deltaY * 0.05));
        prevMousePos = { x: e.clientX, y: e.clientY };
      } else {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(instancedMesh);
        if (intersects.length > 0) {
          const instanceId = intersects[0].instanceId;
          if (instanceId !== undefined && pixels[instanceId]) {
            setHoveredPixel(pixels[instanceId]);
          }
        } else {
          setHoveredPixel(null);
        }
      }
    };

    const onMouseUp = () => { isDragging = false; };
    const onWheel = (e) => {
      e.preventDefault();
      camera.position.z = Math.max(12, Math.min(75, camera.position.z + e.deltaY * 0.04));
    };

    const el = containerRef.current;
    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    el.addEventListener('wheel', onWheel, { passive: false });

    // Render loop
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (isAutoRotate && instancedMesh) {
        instancedMesh.rotation.z += 0.002;
      }
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const newW = containerRef.current.clientWidth;
      const newH = containerRef.current.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [pixels, customDelta, selectedTier, isAutoRotate]);

  const resetCamera = () => {
    if (cameraRef.current && meshRef.current) {
      cameraRef.current.position.set(0, -36, 40);
      cameraRef.current.lookAt(0, 3, 0);
      meshRef.current.rotation.set(0, 0, 0);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0A0D14] select-none">
      {/* 3D Canvas */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Center: Clean Landmark Badges */}
      <div className="absolute top-4 left-6 z-10 flex items-center gap-3">
        <div className="px-3.5 py-1.5 rounded-xl bg-[#111622]/80 backdrop-blur-md border border-white/10 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="text-xs font-semibold text-white">4,597 Live Satellite Pixels</span>
        </div>

        {/* Camera Tools */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-[#111622]/80 backdrop-blur-md border border-white/10 text-slate-300">
          <button
            onClick={() => {
              if (cameraRef.current) cameraRef.current.position.z = Math.max(12, cameraRef.current.position.z - 5);
            }}
            title="Zoom In"
            className="p-1 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              if (cameraRef.current) cameraRef.current.position.z = Math.min(75, cameraRef.current.position.z + 5);
            }}
            title="Zoom Out"
            className="p-1 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetCamera}
            title="Reset View"
            className="p-1 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Subtle Geographic Watermark Landmarks */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 pointer-events-none text-center opacity-40">
        <span className="text-[10px] font-bold text-slate-400 tracking-[0.3em] uppercase">MIRA-BHAYANDER / THANE</span>
      </div>
      <div className="absolute top-1/2 left-8 pointer-events-none opacity-30">
        <span className="text-[10px] font-bold text-slate-400 tracking-[0.3em] uppercase -rotate-90 block">ARABIAN SEA</span>
      </div>
      <div className="absolute top-1/2 right-96 pointer-events-none opacity-30">
        <span className="text-[10px] font-bold text-slate-400 tracking-[0.3em] uppercase">NAVI MUMBAI</span>
      </div>

      {/* Top-Right Floating Metrics Card (Clean, Non-Overlapping Layout) */}
      <div className="absolute top-4 right-6 w-80 glass-panel rounded-2xl shadow-2xl border border-white/10 z-20 overflow-hidden">
        {/* Card Header with Real Date Badge */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Mumbai, Maharashtra</h2>
            <p className="text-[10px] text-slate-400 font-medium">1-Year Satellite Observation</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
            <span className="text-[10px] font-bold tracking-wider font-mono">NOV 2023 – MAR 2024</span>
          </div>
        </div>

        {/* 2x2 Metric Grid */}
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-[#141A29]/90 border border-white/5 rounded-xl p-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">MEAN LST</span>
              <span className="text-xl font-extrabold text-white">{(dataSummary.mean_lst + customDelta).toFixed(1)}°C</span>
            </div>
            <div className="bg-[#141A29]/90 border border-white/5 rounded-xl p-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">MAX LST</span>
              <span className="text-xl font-extrabold text-red-500">{(dataSummary.max_lst + customDelta).toFixed(1)}°C</span>
            </div>
            <div className="bg-[#141A29]/90 border border-white/5 rounded-xl p-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">HOTSPOT AREA</span>
              <span className="text-xl font-extrabold text-amber-500">155.0 km²</span>
            </div>
            <div className="bg-[#141A29]/90 border border-white/5 rounded-xl p-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">UHI INTENSITY</span>
              <span className="text-xl font-extrabold text-white">+{dataSummary.uhi_intensity}°C</span>
            </div>
          </div>

          {/* Interactive Heat Tiers Filter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">FILTER BY HEAT TIER</span>
              {selectedTier !== 'all' && (
                <button
                  onClick={() => setSelectedTier('all')}
                  className="text-[10px] font-bold text-blue-400 hover:underline"
                >
                  Reset Filter
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                onClick={() => setSelectedTier(selectedTier === 'critical' ? 'all' : 'critical')}
                className={`flex items-center gap-2 p-1.5 rounded-lg border transition-all text-left ${
                  selectedTier === 'critical' ? 'bg-red-500/20 border-red-500/50' : 'bg-[#141A29]/60 border-transparent hover:bg-white/5'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-sm bg-[#EF4444] flex-shrink-0"></span>
                <span className="text-slate-300 text-[11px] font-medium truncate">Critical (≥38°C)</span>
              </button>
              <button
                onClick={() => setSelectedTier(selectedTier === 'high' ? 'all' : 'high')}
                className={`flex items-center gap-2 p-1.5 rounded-lg border transition-all text-left ${
                  selectedTier === 'high' ? 'bg-orange-500/20 border-orange-500/50' : 'bg-[#141A29]/60 border-transparent hover:bg-white/5'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-sm bg-[#F97316] flex-shrink-0"></span>
                <span className="text-slate-300 text-[11px] font-medium truncate">High (35-38°C)</span>
              </button>
              <button
                onClick={() => setSelectedTier(selectedTier === 'moderate' ? 'all' : 'moderate')}
                className={`flex items-center gap-2 p-1.5 rounded-lg border transition-all text-left ${
                  selectedTier === 'moderate' ? 'bg-amber-500/20 border-amber-500/50' : 'bg-[#141A29]/60 border-transparent hover:bg-white/5'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-sm bg-[#EAB308] flex-shrink-0"></span>
                <span className="text-slate-300 text-[11px] font-medium truncate">Moderate (32-35°C)</span>
              </button>
              <button
                onClick={() => setSelectedTier(selectedTier === 'normal' ? 'all' : 'normal')}
                className={`flex items-center gap-2 p-1.5 rounded-lg border transition-all text-left ${
                  selectedTier === 'normal' ? 'bg-green-500/20 border-green-500/50' : 'bg-[#141A29]/60 border-transparent hover:bg-white/5'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-sm bg-[#22C55E] flex-shrink-0"></span>
                <span className="text-slate-300 text-[11px] font-medium truncate">Normal (29-32°C)</span>
              </button>
              <button
                onClick={() => setSelectedTier(selectedTier === 'cool' ? 'all' : 'cool')}
                className={`col-span-2 flex items-center gap-2 p-1.5 rounded-lg border transition-all text-left ${
                  selectedTier === 'cool' ? 'bg-blue-500/20 border-blue-500/50' : 'bg-[#141A29]/60 border-transparent hover:bg-white/5'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-sm bg-[#3B82F6] flex-shrink-0"></span>
                <span className="text-slate-300 text-[11px] font-medium">Cool Coastal/Water (&lt;29°C)</span>
              </button>
            </div>
          </div>

          {/* Validation Banner */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <div className="flex items-center gap-2 text-[11px] font-medium">
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
              <span>PINN Stage 3 Holdout RMSE: 1.864°C</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hover Pixel Inspection Tooltip */}
      {hoveredPixel && (
        <div
          className="fixed pointer-events-none z-50 glass-panel rounded-xl p-3 shadow-2xl border border-white/10 text-xs w-60"
          style={{ left: `${mousePos.x + 16}px`, top: `${mousePos.y + 16}px` }}
        >
          <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
            <span className="font-bold text-white">Zone {hoveredPixel.zone} Coordinate</span>
            <span className="font-extrabold text-red-400">{(hoveredPixel.lst + customDelta).toFixed(1)}°C</span>
          </div>
          <div className="space-y-1 text-slate-300 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Lat, Lon:</span>
              <span className="font-mono text-white">{hoveredPixel.lat.toFixed(3)}, {hoveredPixel.lon.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">NDVI (Vegetation):</span>
              <span className="font-mono text-emerald-400 font-semibold">{hoveredPixel.ndvi}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">NDBI (Built-up):</span>
              <span className="font-mono text-orange-400 font-semibold">{hoveredPixel.ndbi}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Arabian Sea Dist:</span>
              <span className="font-mono text-blue-300">{hoveredPixel.dist_sea} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Population (100m):</span>
              <span className="font-mono text-white">{hoveredPixel.pop}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
