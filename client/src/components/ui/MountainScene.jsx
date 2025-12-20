import React, { useRef, useEffect } from "react";
import * as THREE from "three";

/**
 * GenerativeMountainScene
 * Renders a dynamic, particle-based mountain landscape using WebGL shaders.
 * Creates a dotted/point cloud effect for the terrain.
 */
export function MountainScene({ 
  color = "#22d3ee", // Cyan color
  secondaryColor = "#3b82f6", // Blue color for gradient
  backgroundColor = "transparent"
}) {
  const mountRef = useRef(null);
  const lightRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;
    
    // SCENE SETUP
    const scene = new THREE.Scene();
    
    // Camera setup - positioned to look down at the terrain from further away
    const camera = new THREE.PerspectiveCamera(
      50,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 3.5, 5);
    camera.lookAt(0, -0.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(backgroundColor, backgroundColor === "transparent" ? 0 : 1);
    currentMount.appendChild(renderer.domElement);

    // GEOMETRY - Create a plane with fewer vertices for sparser particles
    const geometry = new THREE.PlaneGeometry(16, 8, 120, 80);
    
    // Convert to points
    const positions = geometry.attributes.position.array;
    const colors = new Float32Array(positions.length);
    const sizes = new Float32Array(positions.length / 3);
    
    // Initialize colors and sizes
    const color1 = new THREE.Color(color);
    const color2 = new THREE.Color(secondaryColor);
    
    for (let i = 0; i < positions.length / 3; i++) {
      // Blend colors based on position
      const t = (positions[i * 3 + 1] + 4) / 8; // Normalize Y position
      const blendedColor = color1.clone().lerp(color2, t);
      colors[i * 3] = blendedColor.r;
      colors[i * 3 + 1] = blendedColor.g;
      colors[i * 3 + 2] = blendedColor.b;
      
      // Smaller, more uniform sizes
      sizes[i] = 0.8 + Math.random() * 0.6;
    }
    
    geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // SHADER MATERIAL for particles
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        mouseX: { value: 0 },
        mouseY: { value: 0 },
        pixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        uniform float time;
        uniform float mouseX;
        uniform float mouseY;
        uniform float pixelRatio;
        
        attribute vec3 customColor;
        attribute float size;
        
        varying vec3 vColor;
        varying float vAlpha;
        
        // --- PERLIN NOISE FUNCTIONS ---
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
        
        float snoise(vec3 v) {
            const vec2 C = vec2(1.0/6.0, 1.0/3.0);
            const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
            vec3 i = floor(v + dot(v, C.yyy));
            vec3 x0 = v - i + dot(i, C.xxx);
            vec3 g = step(x0.yzx, x0.xyz);
            vec3 l = 1.0 - g;
            vec3 i1 = min(g.xyz, l.zxy);
            vec3 i2 = max(g.xyz, l.zxy);
            vec3 x1 = x0 - i1 + C.xxx;
            vec3 x2 = x0 - i2 + C.yyy;
            vec3 x3 = x0 - D.yyy;
            i = mod289(i);
            vec4 p = permute(permute(permute(
                      i.z + vec4(0.0, i1.z, i2.z, 1.0))
                    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
            float n_ = 0.142857142857;
            vec3 ns = n_ * D.wyz - D.xzx;
            vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
            vec4 x_ = floor(j * ns.z);
            vec4 y_ = floor(j - 7.0 * x_);
            vec4 x = x_ * ns.x + ns.yyyy;
            vec4 y = y_ * ns.x + ns.yyyy;
            vec4 h = 1.0 - abs(x) - abs(y);
            vec4 b0 = vec4(x.xy, y.xy);
            vec4 b1 = vec4(x.zw, y.zw);
            vec4 s0 = floor(b0) * 2.0 + 1.0;
            vec4 s1 = floor(b1) * 2.0 + 1.0;
            vec4 sh = -step(h, vec4(0.0));
            vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
            vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
            vec3 p0 = vec3(a0.xy, h.x);
            vec3 p1 = vec3(a0.zw, h.y);
            vec3 p2 = vec3(a1.xy, h.z);
            vec3 p3 = vec3(a1.zw, h.w);
            vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
            p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
            vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
            m = m * m;
            return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
        }

        void main() {
            vColor = customColor;
            
            vec3 pos = position;
            
            // Create terrain displacement - gentler mountains
            float noiseFreq = 0.4;
            float noiseAmp = 0.7;
            
            // Layer 1: Base mountains - smoother
            float displacement = snoise(vec3(pos.x * noiseFreq, pos.y * noiseFreq - time * 0.1, 0.0)) * noiseAmp;
            
            // Layer 2: Medium detail
            displacement += snoise(vec3(pos.x * noiseFreq * 1.5, pos.y * noiseFreq * 1.5 - time * 0.1, 10.0)) * (noiseAmp * 0.3);
            
            // Mouse interaction - very subtle
            float mouseInfluence = 0.15;
            displacement += sin(pos.x * 1.5 + mouseX * 2.0) * mouseInfluence * 0.15;
            
            // Apply displacement to Z (height)
            pos.z = displacement;
            
            // Calculate alpha based on height for glow effect
            vAlpha = 0.3 + (displacement + 0.5) * 0.35;
            vAlpha = clamp(vAlpha, 0.15, 0.75);
            
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            
            // Size attenuation - smaller points
            gl_PointSize = size * pixelRatio * (180.0 / -mvPosition.z);
            gl_PointSize = clamp(gl_PointSize, 0.5, 4.0);
            
            gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
            // Create circular point
            vec2 center = gl_PointCoord - vec2(0.5);
            float dist = length(center);
            
            // Softer circular falloff
            float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
            
            if (alpha < 0.01) discard;
            
            // Subtle glow
            vec3 glowColor = vColor * (1.0 + vAlpha * 0.3);
            
            gl_FragColor = vec4(glowColor, alpha * vAlpha * 0.7);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    // Create points mesh
    const points = new THREE.Points(geometry, material);
    points.rotation.x = -Math.PI / 2.5; // Gentler tilt
    points.position.y = -2.2; // Position lower in the scene
    points.position.z = -1; // Closer to camera for better visibility
    scene.add(points);

    let frameId;
    const animate = (t) => {
      material.uniforms.time.value = t * 0.0004;
      material.uniforms.mouseX.value = lightRef.current.x;
      material.uniforms.mouseY.value = lightRef.current.y;
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate(0);

    const handleResize = () => {
      if (!currentMount) return;
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
      material.uniforms.pixelRatio.value = Math.min(window.devicePixelRatio, 2);
    };

    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      lightRef.current = { x, y };
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [color, secondaryColor, backgroundColor]);

  return <div ref={mountRef} className="absolute inset-0 w-full h-full z-0" />;
}

export default MountainScene;
