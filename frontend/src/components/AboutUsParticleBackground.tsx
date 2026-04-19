import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

const ParticleSphere = () => {
  const ref = useRef<THREE.Points>(null);

  // Generate random points in a sphere
  const positions = useMemo(() => {
    const particleCount = 1500;
    const posArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
        // Random spherical distribution
        const r = 15 * Math.cbrt(Math.random());
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
        
        posArray[i * 3] = r * Math.sin(phi) * Math.cos(theta); // x
        posArray[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta); // y
        posArray[i * 3 + 2] = r * Math.cos(phi); // z
    }
    return posArray;
  }, []);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 25;
      ref.current.rotation.y -= delta / 20;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#d4af37" 
          size={0.05}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  );
};

const AboutUsParticleBackground: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`pointer-events-none absolute inset-0 z-0 ${className}`}>
      <Canvas camera={{ position: [0, 0, 8] }}>
        <ParticleSphere />
      </Canvas>
    </div>
  );
};

export default AboutUsParticleBackground;
