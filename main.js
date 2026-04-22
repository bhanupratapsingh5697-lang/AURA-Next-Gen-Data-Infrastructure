import './style.css';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

function splitText(selector) {
  const elements = document.querySelectorAll(selector);
  elements.forEach(el => {
    const text = el.innerText;
    const words = text.split(' ');
    el.innerHTML = '';
    words.forEach(word => {
      const lineOuter = document.createElement('span');
      lineOuter.className = 'line';
      const lineInner = document.createElement('span');
      lineInner.className = 'line-inner';
      lineInner.innerHTML = word + '&nbsp;';
      lineOuter.appendChild(lineInner);
      el.appendChild(lineOuter);
    });
  });
}

window.addEventListener('load', () => {
  splitText('.preloader-text');
  splitText('.huge-title');
  splitText('.sub-title');

  const tl = gsap.timeline();
  
  if (document.querySelector('.preloader')) {
    tl.to('.preloader-text .line-inner', { y: '0%', duration: 1, ease: 'power4.out' })
      .to('.preloader-text .line-inner', { y: '-120%', duration: 1, ease: 'power4.in', delay: 0.5 })
      .to('.preloader', { yPercent: -100, duration: 1.2, ease: 'expo.inOut' })
      .add('reveal');
  } else {
    tl.add('reveal');
  }

  tl.to('.huge-title .line-inner', {
    y: '0%',
    duration: 1.5,
    stagger: 0.05,
    ease: 'power4.out'
  }, 'reveal-=0.2')
  .to('.sub-title .line-inner', {
    y: '0%',
    duration: 1.5,
    stagger: 0.02,
    ease: 'power4.out'
  }, 'reveal+=0.2')
  .from('.navbar-wrap', {
    y: -50,
    opacity: 0,
    duration: 1.5,
    ease: 'power4.out'
  }, 'reveal+=0.5');

  // Mobile menu injection
  const navbar = document.querySelector('.navbar');
  if (navbar && window.innerWidth <= 768) {
    const toggle = document.createElement('div');
    toggle.className = 'menu-toggle';
    toggle.innerHTML = '<span></span><span></span>';
    navbar.insertBefore(toggle, navbar.querySelector('.nav-links'));
    
    const navLinks = document.querySelector('.nav-links');
    toggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }
});

const cursor = document.querySelector('.cursor');
const follower = document.querySelector('.cursor-follower');

let mouseX = 0, mouseY = 0;
let cursorX = 0, cursorY = 0;
let followerX = 0, followerY = 0;

if (cursor && follower) {
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    document.querySelectorAll('.adv-card').forEach(card => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  gsap.ticker.add(() => {
    cursorX += (mouseX - cursorX) * 0.5;
    cursorY += (mouseY - cursorY) * 0.5;
    
    followerX += (mouseX - followerX) * 0.15;
    followerY += (mouseY - followerY) * 0.15;
    
    cursor.style.transform = `translate(calc(${cursorX}px - 50%), calc(${cursorY}px - 50%))`;
    follower.style.transform = `translate(calc(${followerX}px - 50%), calc(${followerY}px - 50%))`;
  });

  document.querySelectorAll('a, input, textarea, .btn-magnetic').forEach(el => {
    el.addEventListener('mouseenter', () => {
      const isButton = el.classList.contains('btn-magnetic') || el.classList.contains('nav-item');
      
      if (isButton) {
        const rect = el.getBoundingClientRect();
        cursor.classList.add('cover-btn');
        follower.classList.add('cover-btn');
        gsap.to(cursor, { width: rect.width + 16, height: rect.height + 16, borderRadius: '100px', duration: 0.3, ease: 'power2.out' });
        gsap.to(follower, { opacity: 0, duration: 0.2 });
      } else {
        cursor.classList.add('hovering');
        follower.classList.add('hovering');
        gsap.to(cursor, { width: 80, height: 80, borderRadius: '50%', duration: 0.3, ease: 'power2.out' });
        gsap.to(follower, { width: 100, height: 100, duration: 0.3, ease: 'power2.out' });
      }
    });

    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('cover-btn', 'hovering');
      follower.classList.remove('cover-btn', 'hovering');
      gsap.to(cursor, { width: 12, height: 12, borderRadius: '50%', duration: 0.3, ease: 'power2.out' });
      gsap.to(follower, { width: 50, height: 50, opacity: 1, duration: 0.2 });
    });
  });
}

const lenis = new Lenis({
  duration: 1.5,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);

const canvas = document.querySelector('#webgl');
if (canvas) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 8;
  
  const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const vertexShader = `
    uniform float uTime;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying float vNoise;
    
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    
    float snoise(vec3 v) { 
      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy) );
      vec3 x0 = v - i + dot(i, C.xxx) ;
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i); 
      vec4 p = permute( permute( permute( 
                i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
              + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
      float n_ = 0.142857142857; 
      vec3  ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m; return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
    }

    void main() {
      vUv = uv;
      vNormal = normal;
      float noise = snoise(vec3(position.x * 1.2, position.y * 1.2 + uTime * 0.3, position.z * 1.2 + uTime * 0.2));
      vNoise = noise;
      vec3 newPosition = position + normal * noise * 0.8;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying float vNoise;
    
    void main() {
      vec3 color1 = vec3(0.05, 0.05, 0.08);
      vec3 color2 = vec3(0.6, 0.6, 0.65);
      vec3 color3 = vec3(1.0, 1.0, 1.0);
      
      vec3 finalColor = mix(color1, color2, vNoise * 2.5);
      finalColor = mix(finalColor, color3, vNoise + 0.3);
      
      float fresnel = dot(vNormal, vec3(0.0, 0.0, 1.0));
      fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
      fresnel = pow(fresnel, 1.5);
      
      finalColor += vec3(fresnel * 1.2);
      
      gl_FragColor = vec4(finalColor, 0.9);
    }
  `;

  const geometry = new THREE.SphereGeometry(2, 128, 128);
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 }
    },
    wireframe: false,
    transparent: true
  });
  
  const blob = new THREE.Mesh(geometry, material);
  scene.add(blob);

  const clock = new THREE.Clock();
  let targetX = 0;
  let targetY = 0;
  
  const tick = () => {
    const elapsedTime = clock.getElapsedTime();
    material.uniforms.uTime.value = elapsedTime;
    
    blob.rotation.y = elapsedTime * 0.1;
    blob.rotation.z = elapsedTime * 0.05;
    
    targetX = (mouseX / window.innerWidth - 0.5) * 2;
    targetY = -(mouseY / window.innerHeight - 0.5) * 2;
    
    blob.position.x += (targetX - blob.position.x) * 0.05;
    blob.position.y += (targetY - blob.position.y) * 0.05;
    
    camera.position.y = -(window.scrollY * 0.005);
    
    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
  };
  tick();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

const horizontalScroll = document.querySelector('.horizontal-scroll-wrapper');
if (horizontalScroll) {
  const container = document.querySelector('.horizontal-scroll-container');
  
  ScrollTrigger.matchMedia({
    "(min-width: 769px)": function() {
      gsap.to(container, {
        x: () => -(container.scrollWidth - window.innerWidth) + "px",
        ease: "none",
        scrollTrigger: {
          trigger: horizontalScroll,
          start: "top top",
          end: () => "+=" + (container.scrollWidth - window.innerWidth),
          scrub: 1,
          pin: true,
          anticipatePin: 1
        }
      });
    }
  });
}

gsap.utils.toArray('.adv-card').forEach(card => {
  gsap.from(card, {
    scrollTrigger: {
      trigger: card,
      start: 'top 85%'
    },
    y: 100,
    opacity: 0,
    duration: 1.5,
    ease: 'power4.out'
  });
});

gsap.utils.toArray('[data-parallax]').forEach(el => {
  const speed = el.dataset.parallax;
  gsap.to(el, {
    y: () => -100 * speed,
    ease: "none",
    scrollTrigger: {
      trigger: el,
      start: "top bottom",
      end: "bottom top",
      scrub: true
    }
  });
});

gsap.utils.toArray('.parallax-wrap').forEach(wrap => {
  const inner = wrap.querySelector('.parallax-inner');
  if(inner) {
    gsap.to(inner, {
      y: '20%',
      ease: "none",
      scrollTrigger: {
        trigger: wrap,
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });
  }
});
