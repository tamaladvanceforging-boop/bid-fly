"use client";

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function ThreeCanvasBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 220;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Particle Constellation Network
    const particleCount = 180;
    const positions = new Float32Array(particleCount * 3);
    const velocities: THREE.Vector3[] = [];
    const colors = new Float32Array(particleCount * 3);

    const color1 = new THREE.Color('#3b82f6'); // primary blue
    const color2 = new THREE.Color('#8b5cf6'); // purple accent
    const color3 = new THREE.Color('#06b6d4'); // cyan glow

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 400;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 300;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200;

      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.35,
          (Math.random() - 0.5) * 0.35,
          (Math.random() - 0.5) * 0.2
        )
      );

      const mixedColor = color1.clone().lerp(
        Math.random() > 0.5 ? color2 : color3,
        Math.random()
      );
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    particleGeometry.setAttribute(
      'color',
      new THREE.BufferAttribute(colors, 3)
    );

    // Soft glowing circle texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.3, 'rgba(147, 197, 253, 0.8)');
    gradient.addColorStop(0.8, 'rgba(59, 130, 246, 0.2)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);

    const particleMaterial = new THREE.PointsMaterial({
      size: 6.5,
      map: texture,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // 3. Dynamic Connecting Line Mesh
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending
    });

    const lineGeometry = new THREE.BufferGeometry();
    const maxLineConnections = 300;
    const linePositions = new Float32Array(maxLineConnections * 6);
    lineGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(linePositions, 3)
    );

    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    // 4. Central Geometric Wireframe Rings (Orbital Gyroscope)
    const ringGroup = new THREE.Group();
    const ringGeo1 = new THREE.IcosahedronGeometry(80, 2);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      wireframe: true,
      transparent: true,
      opacity: 0.08
    });
    const ringMesh1 = new THREE.Mesh(ringGeo1, ringMat1);
    ringGroup.add(ringMesh1);

    const ringGeo2 = new THREE.TorusGeometry(110, 1.2, 16, 100);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.12
    });
    const ringMesh2 = new THREE.Mesh(ringGeo2, ringMat2);
    ringMesh2.rotation.x = Math.PI / 3;
    ringGroup.add(ringMesh2);

    ringGroup.position.set(120, -20, -50);
    scene.add(ringGroup);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const halfX = window.innerWidth / 2;
      const halfY = window.innerHeight / 2;
      mouseX = (e.clientX - halfX) * 0.15;
      mouseY = (e.clientY - halfY) * 0.15;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Handle Window Resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);

    // 5. Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth camera lerp with mouse movement
      targetX += (mouseX - targetX) * 0.04;
      targetY += (mouseY - targetY) * 0.04;
      camera.position.x = targetX;
      camera.position.y = -targetY;
      camera.lookAt(scene.position);

      // Rotate central orbital rings
      ringGroup.rotation.y += 0.003;
      ringGroup.rotation.x += 0.0015;
      ringMesh2.rotation.z += 0.005;

      // Update particle positions
      const pPos = particleGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        pPos[i * 3] += velocities[i].x;
        pPos[i * 3 + 1] += velocities[i].y;
        pPos[i * 3 + 2] += velocities[i].z;

        // Bounce back inside boundary
        if (pPos[i * 3] < -200 || pPos[i * 3] > 200) velocities[i].x *= -1;
        if (pPos[i * 3 + 1] < -150 || pPos[i * 3 + 1] > 150) velocities[i].y *= -1;
        if (pPos[i * 3 + 2] < -100 || pPos[i * 3 + 2] > 100) velocities[i].z *= -1;
      }
      particleGeometry.attributes.position.needsUpdate = true;

      // Compute dynamic connecting lines
      let lineIndex = 0;
      const lPos = lineGeometry.attributes.position.array as Float32Array;
      const connectDist = 48;

      for (let i = 0; i < particleCount && lineIndex < maxLineConnections; i++) {
        for (let j = i + 1; j < particleCount && lineIndex < maxLineConnections; j++) {
          const dx = pPos[i * 3] - pPos[j * 3];
          const dy = pPos[i * 3 + 1] - pPos[j * 3 + 1];
          const dz = pPos[i * 3 + 2] - pPos[j * 3 + 2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < connectDist) {
            lPos[lineIndex * 6] = pPos[i * 3];
            lPos[lineIndex * 6 + 1] = pPos[i * 3 + 1];
            lPos[lineIndex * 6 + 2] = pPos[i * 3 + 2];

            lPos[lineIndex * 6 + 3] = pPos[j * 3];
            lPos[lineIndex * 6 + 4] = pPos[j * 3 + 1];
            lPos[lineIndex * 6 + 5] = pPos[j * 3 + 2];
            lineIndex++;
          }
        }
      }

      // Zero out remaining line slots
      for (let i = lineIndex * 6; i < maxLineConnections * 6; i++) {
        lPos[i] = 0;
      }
      lineGeometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // 6. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      particleGeometry.dispose();
      particleMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full overflow-hidden opacity-90 transition-opacity duration-1000"
      style={{
        background: 'radial-gradient(ellipse 80% 80% at 50% -20%, rgba(30, 58, 138, 0.25), rgba(9, 13, 22, 1))'
      }}
    />
  );
}
