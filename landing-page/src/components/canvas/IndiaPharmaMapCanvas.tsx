/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

interface SVGPathData {
  id: string;
  name: string;
  d: string;
}

interface LocationDetails {
  name: string;
  x: number;
  y: number;
}

const locations: LocationDetails[] = [
  { name: 'Ahmedabad (HQ)', x: 92, y: 350 },
  { name: 'Vadodara Plant', x: 46, y: 328 },
  { name: 'Ankleshwar Site', x: 55, y: 370 }
];

// Module-level cache to prevent duplicate fetches in React Strict Mode
let cachedSVGTextPromise: Promise<string> | null = null;
const fetchSVGText = (url: string): Promise<string> => {
  if (!cachedSVGTextPromise) {
    cachedSVGTextPromise = fetch(url).then((res) => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.text();
    });
  }
  return cachedSVGTextPromise;
};

// Module-level cache for parsed paths
let cachedSVGPaths: SVGPathData[] | null = null;

// Generate background dust particles once (more particles, glass colors)
const particlesData = Array.from({ length: 65 }).map((_, i) => {
  const rand = Math.random();
  let colorClass = 'bg-white';
  let shadowClass = 'shadow-[0_0_4px_rgba(255,255,255,0.6)]';
  if (rand < 0.45) {
    colorClass = 'bg-[#23D5FF]'; // Cyan
    shadowClass = 'shadow-[0_0_6px_rgba(35,213,255,0.7)]';
  } else if (rand < 0.75) {
    colorClass = 'bg-[#4F46E5]'; // Indigo
    shadowClass = 'shadow-[0_0_6px_rgba(79,70,229,0.7)]';
  }
  return {
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2.5 + 1.2, // 1.2px to 3.7px
    duration: Math.random() * 14 + 10,
    delay: Math.random() * -24,
    colorClass,
    shadowClass
  };
});

export default function IndiaPharmaMapCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgPaths, setSvgPaths] = useState<SVGPathData[]>([]);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(true);

  // Motion values for hardware-accelerated, re-render free mouse-tilt
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  
  // Spring config for smooth interpolation
  const rotateX = useSpring(tiltX, { stiffness: 90, damping: 25 });
  const rotateY = useSpring(tiltY, { stiffness: 90, damping: 25 });

  // 1. Check for touch/mobile devices
  useEffect(() => {
    const checkMobile = () => {
      const hasTouch = window.matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window);
      setIsMobile(hasTouch);
    };
    checkMobile();
  }, []);

  // 2. IntersectionObserver to pause out-of-view animations
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold: 0.05 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    if (cachedSVGPaths) {
      setSvgPaths(cachedSVGPaths);
      setIsLoaded(true);
      return;
    }

    fetchSVGText('/india.svg')
      .then((data) => {
        if (!active) return;
        const parser = new DOMParser();
        const doc = parser.parseFromString(data, 'image/svg+xml');
        const paths = Array.from(doc.querySelectorAll('path')).map((p) => ({
          id: p.getAttribute('id') || '',
          name: p.getAttribute('name') || '',
          d: p.getAttribute('d') || ''
        }));
        cachedSVGPaths = paths;
        setSvgPaths(paths);
        
        // Let the outer border line animation draw completely (2.8 seconds) before filling states
        timerId = setTimeout(() => {
          if (active) {
            setIsLoaded(true);
          }
        }, 2800);
      })
      .catch((err) => {
        if (active) {
          console.error('Failed to load India map SVG:', err);
        }
      });

    return () => {
      active = false;
      if (timerId !== null) {
        clearTimeout(timerId);
      }
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const relativeX = mouseX / width - 0.5;
    const relativeY = mouseY / height - 0.5;

    tiltX.set(relativeY * -10); // Pitch (up/down)
    tiltY.set(relativeX * 10);  // Yaw (left/right)
  };

  const handleMouseLeave = () => {
    tiltX.set(0);
    tiltY.set(0);
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden flex items-center justify-center p-4 md:p-8 bg-transparent z-0 select-none"
      id="three-showcase-stage"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: '1200px'
      }}
    >
      {/* 1. Glow Backdrop behind the map (Creates a premium glass glow) */}
      <div className="absolute w-[300px] h-[300px] md:w-[380px] md:h-[380px] rounded-full bg-brand-secondary/15 blur-[100px] pointer-events-none z-0" />
      <div className="absolute w-[200px] h-[200px] md:w-[240px] md:h-[240px] rounded-full bg-brand-accent-light/10 blur-[80px] pointer-events-none z-0" />

      {/* 2. Floating Dust & Glass Micro-Particles (High-contrast, glowing starry crystalline suspension) */}
      {isIntersecting && (
        <motion.div 
          className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 1.2 }}
        >
          {(isMobile ? particlesData.slice(0, 15) : particlesData).map((p) => (
            <div
              key={p.id}
              className={`absolute rounded-full ${p.colorClass} ${p.shadowClass} animate-particle`}
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                '--float-duration': `${p.duration}s`,
                '--float-delay': `${p.delay}s`
              } as React.CSSProperties}
            />
          ))}
        </motion.div>
      )}

      {/* 3. Interactive SVG Map Wrapper */}
      <motion.div
        className="relative w-full h-full max-w-[340px] md:max-w-[440px] lg:max-w-[540px] max-h-[65vh] md:max-h-[72vh] lg:max-h-[82vh] aspect-[612/696] lg:ml-auto lg:mr-[2%] lg:-translate-y-6 z-10 flex items-center justify-center"
        animate={isIntersecting ? {
          y: [0, -8, 0]
        } : {
          y: 0
        }}
        transition={{
          y: isIntersecting ? {
            repeat: Infinity,
            duration: 7,
            ease: 'easeInOut'
          } : {
            duration: 0.3
          }
        }}
        style={{
          rotateX: isMobile ? 0 : rotateX,
          rotateY: isMobile ? 0 : rotateY,
          transformStyle: 'preserve-3d'
        }}
      >
        {svgPaths.length > 0 ? (
          <svg
            viewBox="0 0 612 696"
            className="w-full h-full drop-shadow-[0_20px_35px_rgba(0,0,0,0.7)] select-none pointer-events-auto overflow-visible"
            style={{ transform: 'translateZ(10px)' }}
          >
            <defs>
              {/* Map Gradient */}
              <linearGradient id="map-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0B1329" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#0d1836" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#030712" stopOpacity="0.95" />
              </linearGradient>

              {/* Glowing Filter for Borders */}
              <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Geographical State Paths */}
            <g id="states-group">
              {svgPaths.map((path, idx) => {
                const isGujarat = path.id === 'gj';
                const isHovered = hoveredState === path.id;
                
                return (
                  <motion.path
                    key={path.id}
                    d={path.d}
                    className="transition-all duration-300 cursor-pointer"
                    fill={isHovered ? 'rgba(79, 70, 229, 0.28)' : isGujarat ? 'rgba(79, 70, 229, 0.15)' : 'url(#map-grad)'}
                    stroke={
                      !isLoaded
                        ? '#23D5FF'
                        : isHovered
                        ? '#23D5FF'
                        : isGujarat
                        ? 'rgba(35, 213, 255, 0.85)'
                        : '#3b82f6'
                    }
                    strokeWidth={
                      !isLoaded
                        ? 1.8
                        : isHovered
                        ? 1.6
                        : isGujarat
                        ? 1.3
                        : 0.8
                    }
                    
                    // Initial border tracing scan line animation
                    initial={{ pathLength: 0, fillOpacity: 0 }}
                    animate={
                      !isIntersecting
                        ? { pathLength: 1, fillOpacity: isLoaded ? 1.0 : 0, strokeOpacity: isHovered ? 1.0 : isGujarat ? 0.85 : 0.4 }
                        : isMobile
                        ? {
                            pathLength: 1,
                            fillOpacity: isLoaded ? 1.0 : 0,
                            strokeOpacity: isHovered ? 1.0 : isGujarat ? [0.6, 0.95, 0.6] : 0.3
                          }
                        : {
                            pathLength: 1,
                            fillOpacity: isLoaded ? 1.0 : 0,
                            strokeOpacity: isHovered ? 1.0 : isGujarat ? [0.6, 0.95, 0.6] : [0.25, 0.55, 0.25]
                          }
                    }
                    transition={{
                      pathLength: { duration: 2.8, ease: 'easeInOut' },
                      fillOpacity: { duration: 1.2, ease: 'easeOut' },
                      strokeOpacity: (!isIntersecting || (isMobile && !isGujarat))
                        ? { duration: 0 }
                        : {
                            duration: 4.5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                            delay: idx * 0.04
                          }
                    }}
                    whileHover={{
                      scale: 1.025,
                      translateZ: 10
                    }}
                    style={{
                      transformBox: 'fill-box',
                      transformOrigin: 'center'
                    }}
                    onMouseEnter={() => isLoaded && setHoveredState(path.id)}
                    onMouseLeave={() => isLoaded && setHoveredState(null)}
                  />
                );
              })}
            </g>

            {/* 2. Glowing Flowing Lights Traveling Along the Borders (Only active when fully loaded, on screen, and on desktop) */}
            {isLoaded && isIntersecting && !isMobile && (
              <g id="border-flowing-pulses" style={{ pointerEvents: 'none' }}>
                {svgPaths.map((path) => (
                  <motion.path
                    key={`pulse-${path.id}`}
                    d={path.d}
                    fill="none"
                    stroke="#23D5FF"
                    strokeWidth="1.2"
                    strokeOpacity="0.55"
                    strokeDasharray="35 180"
                    animate={{
                      strokeDashoffset: [0, -215]
                    }}
                    transition={{
                      duration: 4.5,
                      repeat: Infinity,
                      ease: 'linear'
                    }}
                  />
                ))}
              </g>
            )}

            {/* Connecting Logistics Lines & Active Data Pulses (Fades in at the end of entry animation) */}
            {isLoaded && (
              <motion.g 
                id="logistics-lines" 
                style={{ transform: 'translateZ(15px)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
              >
                {/* Line 1: Ahmedabad -> Vadodara */}
                <line x1="92" y1="350" x2="46" y2="328" stroke="rgba(35, 213, 255, 0.25)" strokeWidth="1" strokeDasharray="3,3" />
                {isIntersecting && (
                  <motion.circle
                    cx="92"
                    cy="350"
                    r="2"
                    fill="#23D5FF"
                    className="filter drop-shadow-[0_0_3px_#23D5FF]"
                    animate={{
                      cx: [92, 46],
                      cy: [350, 328]
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: 'linear'
                    }}
                  />
                )}

                {/* Line 2: Vadodara -> Ankleshwar */}
                <line x1="46" y1="328" x2="55" y2="370" stroke="rgba(35, 213, 255, 0.25)" strokeWidth="1" strokeDasharray="3,3" />
                {isIntersecting && (
                  <motion.circle
                    cx="46"
                    cy="328"
                    r="2"
                    fill="#23D5FF"
                    className="filter drop-shadow-[0_0_3px_#23D5FF]"
                    animate={{
                      cx: [46, 55],
                      cy: [328, 370]
                    }}
                    transition={{
                      duration: 2.0,
                      repeat: Infinity,
                      ease: 'linear'
                    }}
                  />
                )}

                {/* Line 3: Ankleshwar -> Ahmedabad */}
                <line x1="55" y1="370" x2="92" y2="350" stroke="rgba(35, 213, 255, 0.25)" strokeWidth="1" strokeDasharray="3,3" />
                {isIntersecting && (
                  <motion.circle
                    cx="55"
                    cy="370"
                    r="2"
                    fill="#23D5FF"
                    className="filter drop-shadow-[0_0_3px_#23D5FF]"
                    animate={{
                      cx: [55, 92],
                      cy: [370, 350]
                    }}
                    transition={{
                      duration: 3.0,
                      repeat: Infinity,
                      ease: 'linear'
                    }}
                  />
                )}
              </motion.g>
            )}

            {/* Gujarat Site Radar Beacons (Fades in at the end of entry animation) */}
            {isLoaded && (
              <motion.g 
                id="radar-beacons" 
                style={{ transform: 'translateZ(20px)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
              >
                {locations.map((loc, idx) => {
                  return (
                    <g
                      key={loc.name}
                      transform={`translate(${loc.x}, ${loc.y})`}
                    >
                      {/* Outer Pulse Ring 1 */}
                      {isIntersecting && (
                        <>
                          <motion.circle
                            r="12"
                            fill="#23D5FF"
                            fillOpacity="0.3"
                            initial={{ scale: 0.2, opacity: 0.8 }}
                            animate={{ scale: 2.0, opacity: 0 }}
                            transition={{
                              duration: 2.0,
                              repeat: Infinity,
                              ease: 'easeOut',
                              delay: idx * 0.45
                            }}
                          />

                          {/* Outer Pulse Ring 2 */}
                          <motion.circle
                            r="12"
                            fill="#23D5FF"
                            fillOpacity="0.2"
                            initial={{ scale: 0.2, opacity: 0.8 }}
                            animate={{ scale: 2.0, opacity: 0 }}
                            transition={{
                              duration: 2.0,
                              repeat: Infinity,
                              ease: 'easeOut',
                              delay: idx * 0.45 + 1.0
                            }}
                          />
                        </>
                      )}

                      {/* Beacon Core Pin */}
                      <circle
                        r="3.8"
                        fill="#FFFFFF"
                        className="filter drop-shadow-[0_0_5px_#23D5FF]"
                      />
                    </g>
                  );
                })}
              </motion.g>
            )}
          </svg>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#020617]/40 backdrop-blur-md rounded-3xl border border-white/5">
            <span className="text-[10px] tracking-widest text-slate-500 uppercase animate-pulse">
              Generating Vector Stage...
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
