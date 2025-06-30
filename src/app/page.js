'use client'

import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import styles from "./page.module.css"
import Image from 'next/image'
import * as THREE from 'three'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry'

// Import all page components
import Dashboard from '../Pages/Dashboard'
import Balance from '../Pages/Balance'
import StockScreener from '../Pages/stockScreener'
import WatchList from '../Pages/watchList'
import Portfolio from '../Pages/Portfolio'
import StockGraph from '../Pages/StockGraph'
import News from '../Pages/News'
import LakshmiAi from '../Pages/LakshmiAi'

// SVGs
import GlobeSVG from '../../public/globe.svg';
import FileSVG from '../../public/file.svg';
import WindowSVG from '../../public/window.svg';
import NextSVG from '../../public/next.svg';
import VercelSVG from '../../public/vercel.svg';
import BitcoinSVG from '../../public/bitcoin-svgrepo-com.svg';
import MoneyBagSVG from '../../public/money-bag-svgrepo-com.svg';
import DollarCoinSVG from '../../public/dollar-coin-svgrepo-com.svg';
import TrendUpSVG from '../../public/trend-upward-svgrepo-com.svg';
import TrendDownSVG from '../../public/trend-down-thin-svgrepo-com.svg';

export default function Home() {
  const { user, loading } = useAuth()
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [isInitialized, setIsInitialized] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [scrollY, setScrollY] = useState(0)
  const [isMouseMoving, setIsMouseMoving] = useState(false)
  const bannerRef = useRef(null)
  const featuresRef = useRef(null)
  const ctaRef = useRef(null)
  const mouseTimeoutRef = useRef(null)
  const [tickerData, setTickerData] = useState([]);
  const [tickerLoading, setTickerLoading] = useState(true);
  const [confetti, setConfetti] = useState([]);
  const confettiRef = useRef(null);
  const threeCanvasRef = useRef(null);
  const threeContainerRef = useRef(null);
  const [coinPos, setCoinPos] = useState({ top: 120, left: 0 });
  const [coinTransform, setCoinTransform] = useState({ scale: 1, rotation: 0 });
  const coinAnimRef = useRef({ top: 120, left: 0, scale: 1, rotation: 0 });
  const coinTargetRef = useRef({ top: 120, left: 0, scale: 1, rotation: 0 });
  const [coinAnimState, setCoinAnimState] = useState({ top: 120, left: 0, scale: 1, rotation: 0 });

  // Define all application routes/paths in this file
  const APP_ROUTES = useMemo(() => ({
    dashboard: {
      path: 'dashboard',
      component: Dashboard,
      label: 'Dashboard',
      icon: '📊'
    },
    balance: {
      path: 'balance',
      component: Balance,
      label: 'Balance',
      icon: '💰'
    },
    stockScreener: {
      path: 'stockScreener',
      component: StockScreener,
      label: 'Stock Screener',
      icon: '🔍'
    },
    watchList: {
      path: 'watchList',
      component: WatchList,
      label: 'Watch List',
      icon: '👁️'
    },
    portfolio: {
      path: 'portfolio',
      component: Portfolio,
      label: 'Portfolio',
      icon: '💼'
    },
    stockGraph: {
      path: 'stockGraph',
      component: StockGraph,
      label: 'Stock Graph',
      icon: '📈'
    },
    news: {
      path: 'news',
      component: News,
      label: 'News',
      icon: '📰'
    },
    lakshmiAi: {
      path: 'lakshmiAi',
      component: LakshmiAi,
      label: 'Lakshmi AI',
      icon: '🤖'
    }
  }), [])

  // Mouse tracking effect with enhanced interactions
  useEffect(() => {
    if (user) return; // Only run on homepage (unauthenticated)

    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
      setIsMouseMoving(true)
      if (mouseTimeoutRef.current) {
        clearTimeout(mouseTimeoutRef.current)
      }
      mouseTimeoutRef.current = setTimeout(() => {
        setIsMouseMoving(false)
      }, 100)
      createRipple(e.clientX, e.clientY)
    }

    const createRipple = (x, y) => {
      const ripple = document.createElement('div')
      ripple.className = styles.mouseRipple
      ripple.style.left = `${x}px`
      ripple.style.top = `${y}px`
      document.body.appendChild(ripple)
      setTimeout(() => {
        ripple.remove()
      }, 1000)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (mouseTimeoutRef.current) {
        clearTimeout(mouseTimeoutRef.current)
      }
    }
  }, [user])

  // Scroll tracking for parallax with smooth interpolation
  useEffect(() => {
    let ticking = false
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY)
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Add tilt effect to feature cards
  useEffect(() => {
    const cards = document.querySelectorAll(`.${styles.featureCard}`)
    
    const handleCardMouseMove = (e, card) => {
      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      
      const rotateX = (y - centerY) / 10
      const rotateY = (centerX - x) / 10
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`
    }
    
    const handleCardMouseLeave = (card) => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)'
    }
    
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => handleCardMouseMove(e, card))
      card.addEventListener('mouseleave', () => handleCardMouseLeave(card))
    })
    
    return () => {
      cards.forEach(card => {
        card.removeEventListener('mousemove', (e) => handleCardMouseMove(e, card))
        card.removeEventListener('mouseleave', () => handleCardMouseLeave(card))
      })
    }
  }, [user])

  // Custom hook for route validation
  const useRouteValidator = useCallback((route) => {
    return Object.keys(APP_ROUTES).includes(route)
  }, [APP_ROUTES])

  // Custom hook for getting initial route
  const useInitialRoute = useCallback(() => {
    if (!user) return 'dashboard'
    
    // Check URL parameter first
    const urlParams = new URLSearchParams(window.location.search)
    const pageParam = urlParams.get('page')
    
    if (pageParam && useRouteValidator(pageParam)) {
      return pageParam
    }
    
    // Check localStorage for last visited page
    if (typeof window !== 'undefined') {
      const lastVisited = localStorage.getItem('lastVisitedPage')
      if (lastVisited && useRouteValidator(lastVisited)) {
        return lastVisited
      }
    }
    
    // Default to dashboard
    return 'dashboard'
  }, [user, useRouteValidator])

  // Custom hook for navigation
  const useNavigation = useCallback(() => {
    const navigate = (route) => {
      if (!useRouteValidator(route)) {
        console.warn(`Invalid route: ${route}`)
        return
      }
      
      setCurrentPage(route)
      
      if (user && typeof window !== 'undefined') {
        // Store in localStorage
        localStorage.setItem('lastVisitedPage', route)
        
        // Update URL without page reload
        const url = new URL(window.location)
        url.searchParams.set('page', route)
        window.history.pushState({ page: route }, '', url)
        
        // Dispatch event to notify navbar and other components
        const event = new CustomEvent('pageChanged', { 
          detail: { page: route } 
        })
        window.dispatchEvent(event)
      }
    }
    
    return navigate
  }, [useRouteValidator, user])

  // Custom hook for handling browser navigation (back/forward)
  const useBrowserNavigation = useCallback(() => {
    const handlePopState = (event) => {
      const route = event.state?.page || 'dashboard'
      if (useRouteValidator(route)) {
        setCurrentPage(route)
      }
    }
    
    return handlePopState
  }, [useRouteValidator])

  // Custom hook for handling external navigation events
  const useExternalNavigation = useCallback(() => {
    const navigate = useNavigation()
    
    const handleNavigationEvent = (event) => {
      const { page } = event.detail
      navigate(page)
    }
    
    return handleNavigationEvent
  }, [useNavigation])

  // Initialize the application route
  useEffect(() => {
    if (user && !isInitialized) {
      const initialRoute = useInitialRoute()
      setCurrentPage(initialRoute)
      setIsInitialized(true)
      
      if (typeof window !== 'undefined') {
        // Set initial URL
        const url = new URL(window.location)
        url.searchParams.set('page', initialRoute)
        window.history.replaceState({ page: initialRoute }, '', url)
        
        // Notify navbar of initial page
        const event = new CustomEvent('pageChanged', { 
          detail: { page: initialRoute } 
        })
        window.dispatchEvent(event)
      }
    }
  }, [user, isInitialized, useInitialRoute])

  // Set up browser navigation listener
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handlePopState = useBrowserNavigation()
      window.addEventListener('popstate', handlePopState)
      
      return () => {
        window.removeEventListener('popstate', handlePopState)
      }
    }
  }, [useBrowserNavigation])

  // Set up external navigation event listener (for navbar)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleNavigationEvent = useExternalNavigation()
      window.addEventListener('navigate', handleNavigationEvent)
      
      return () => {
        window.removeEventListener('navigate', handleNavigationEvent)
      }
    }
  }, [useExternalNavigation])

  // Custom hook for rendering current page component
  const usePageRenderer = useCallback(() => {
    const route = APP_ROUTES[currentPage]
    if (route && route.component) {
      const PageComponent = route.component
      return <PageComponent />
    }
    
    // Fallback to dashboard
    const DashboardComponent = APP_ROUTES.dashboard.component
    return <DashboardComponent />
  }, [currentPage, APP_ROUTES])

  // Expose navigation function globally for navbar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const navigate = useNavigation()
      window.navigateApp = navigate
      
      return () => {
        delete window.navigateApp
      }
    }
  }, [useNavigation])

  // Fetch ticker tape data
  useEffect(() => {
    async function fetchTicker() {
      setTickerLoading(true);
      try {
        const res = await fetch('/api/stock-prices?symbols=TCS.NS,INFY.NS,HDFCBANK.NS,ICICIBANK.NS,RELIANCE.NS,ITC.NS,BTCINR,ETHINR');
        const json = await res.json();
        if (json.success) setTickerData(json.data);
        else setTickerData([]);
      } catch {
        setTickerData([]);
      }
      setTickerLoading(false);
    }
    fetchTicker();
    const interval = setInterval(fetchTicker, 20000);
    return () => clearInterval(interval);
  }, []);

  // Confetti/Coin burst on button click
  const handleButtonBurst = (e) => {
    const confettiArr = [];
    for (let i = 0; i < 18; i++) {
      confettiArr.push({
        id: Math.random(),
        dx: Math.random() * 200 - 100,
        dy: Math.random() * 120 - 60,
        type: i % 3
      });
    }
    setConfetti(confettiArr);
    setTimeout(() => setConfetti([]), 1200);
  };

  // Update the coin's target position/scale/rotation on scroll
  useEffect(() => {
    function handleCoinScroll() {
      const pageHeight = document.body.scrollHeight - window.innerHeight;
      const scrollY = window.scrollY;
      const progress = Math.max(0, Math.min(1, scrollY / pageHeight));
      const minLeft = 60;
      const maxLeft = window.innerWidth - 280;
      const left = maxLeft - (maxLeft - minLeft) * progress;
      const minTop = 120;
      const maxTop = pageHeight + 120;
      const easedProgress = Math.pow(progress, 0.7);
      const top = minTop + (maxTop - minTop) * easedProgress;
      const scale = 1 + 2 * progress;
      const rotation = Math.PI * 8 * progress;
      coinTargetRef.current = { top, left, scale, rotation };
    }
    window.addEventListener('scroll', handleCoinScroll);
    handleCoinScroll();
    return () => window.removeEventListener('scroll', handleCoinScroll);
  }, []);

  // --- Three.js scene initialization (top-level useEffect) ---
  useEffect(() => {
    if (!threeCanvasRef.current) return;
    let renderer, scene, camera, coin, glowMesh, rimMesh, shineMesh, symbolMesh;
    const width = 220, height = 220;
    // Scene setup
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, canvas: threeCanvasRef.current });
    renderer.setSize(width, height);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 5;
    // Coin geometry (cylinder with bevel)
    const geometry = new THREE.CylinderGeometry(1, 1, 0.25, 96, 1, false);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xFFD700,
      metalness: 1,
      roughness: 0.09,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      reflectivity: 1,
      transmission: 0.1,
      ior: 1.45,
      sheen: 1,
      sheenColor: new THREE.Color(0xFFFACD),
      sheenRoughness: 0.1,
      thickness: 0.1,
      envMapIntensity: 1.5
    });
    coin = new THREE.Mesh(geometry, material);
    scene.add(coin);
    // Rim mesh (thin, bright edge)
    const rimGeometry = new THREE.CylinderGeometry(1.01, 1.01, 0.27, 96, 1, true);
    const rimMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFACD, side: THREE.DoubleSide });
    rimMesh = new THREE.Mesh(rimGeometry, rimMaterial);
    scene.add(rimMesh);
    // Glow mesh (soft, bright outer glow)
    const glowMaterial = new THREE.MeshBasicMaterial({ color: 0xFFD700, transparent: true, opacity: 0.13 });
    const glowGeometry = new THREE.CylinderGeometry(1.22, 1.22, 0.35, 96, 1, true);
    glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glowMesh);
    // Shine mesh (fake white shine overlay)
    const shineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 });
    const shineGeometry = new THREE.CylinderGeometry(0.7, 0.7, 0.251, 32, 1, true, Math.PI / 2, Math.PI / 1.2);
    shineMesh = new THREE.Mesh(shineGeometry, shineMaterial);
    shineMesh.position.set(0.3, 0.3, 0.13);
    scene.add(shineMesh);
    // Raised symbol ($) on the coin face
    const loader = new FontLoader();
    loader.load('https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', function (font) {
      const textGeometry = new TextGeometry('$', {
        font: font,
        size: 0.55,
        height: 0.09,
        curveSegments: 8,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.02,
        bevelOffset: 0,
        bevelSegments: 3
      });
      const textMaterial = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0.7, roughness: 0.2 });
      symbolMesh = new THREE.Mesh(textGeometry, textMaterial);
      symbolMesh.position.set(-0.23, -0.23, 0.13);
      symbolMesh.rotation.x = Math.PI / 2;
      scene.add(symbolMesh);
    });
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xFFFACD, 1.5, 10);
    pointLight.position.set(3, 5, 5);
    scene.add(pointLight);
    const rimLight = new THREE.PointLight(0xFFFFFF, 1.1, 10);
    rimLight.position.set(-3, -5, 5);
    scene.add(rimLight);
    // Store refs for animation loop
    window.__lakshmiCoinScene = { renderer, scene, camera, coin, rimMesh, glowMesh, shineMesh, symbolMesh };
    return () => {
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      rimGeometry.dispose();
      rimMaterial.dispose();
      glowGeometry.dispose();
      glowMaterial.dispose();
      shineGeometry.dispose();
      shineMaterial.dispose();
      if (symbolMesh && symbolMesh.geometry) symbolMesh.geometry.dispose();
      if (symbolMesh && symbolMesh.material) symbolMesh.material.dispose();
      window.__lakshmiCoinScene = null;
    };
  }, []);

  // --- Animation loop (top-level useEffect) ---
  useEffect(() => {
    let animationId;
    function lerp(a, b, t) { return a + (b - a) * t; }
    function animate() {
      // Lerp coinAnim towards coinTarget
      const prev = coinAnimRef.current;
      const target = coinTargetRef.current;
      const t = 0.10;
      const next = {
        top: lerp(prev.top, target.top, t),
        left: lerp(prev.left, target.left, t),
        scale: lerp(prev.scale, target.scale, t),
        rotation: lerp(prev.rotation, target.rotation, t),
      };
      coinAnimRef.current = next;
      // Only update React state if position/scale/rotation changed enough (for CSS)
      if (
        Math.abs(next.top - coinAnimState.top) > 0.5 ||
        Math.abs(next.left - coinAnimState.left) > 0.5 ||
        Math.abs(next.scale - coinAnimState.scale) > 0.01 ||
        Math.abs(next.rotation - coinAnimState.rotation) > 0.01
      ) {
        setCoinAnimState(next);
      }
      // Render three.js scene if initialized
      const coinScene = window.__lakshmiCoinScene;
      if (coinScene && coinScene.coin && coinScene.rimMesh && coinScene.glowMesh && coinScene.shineMesh) {
        const { renderer, scene, camera, coin, rimMesh, glowMesh, shineMesh, symbolMesh } = coinScene;
        const pulse = 1 + Math.sin(Date.now() * 0.002) * 0.04;
        const scale = next.scale * pulse;
        coin.scale.set(scale, scale, scale);
        coin.rotation.x = next.rotation;
        coin.rotation.y = Math.sin(next.rotation) * 0.2 + Date.now() * 0.0002;
        rimMesh.scale.set(scale * 1.01, scale * 1.01, scale * 1.01);
        rimMesh.rotation.x = coin.rotation.x;
        rimMesh.rotation.y = coin.rotation.y;
        glowMesh.scale.set(scale * 1.18, scale * 1.18, scale * 1.18);
        glowMesh.rotation.x = coin.rotation.x;
        glowMesh.rotation.y = coin.rotation.y;
        shineMesh.scale.set(scale, scale, scale);
        shineMesh.rotation.x = coin.rotation.x;
        shineMesh.rotation.y = coin.rotation.y;
        if (symbolMesh) {
          symbolMesh.scale.set(scale, scale, scale);
          symbolMesh.rotation.x = coin.rotation.x + Math.PI / 2;
          symbolMesh.rotation.y = coin.rotation.y;
        }
        renderer.render(scene, camera);
      }
      animationId = requestAnimationFrame(animate);
    }
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Remove any remaining mouseRipple elements when user logs in
  useEffect(() => {
    if (user) {
      // Remove all ripple elements
      document.querySelectorAll(`.${styles.mouseRipple}`).forEach(el => el.remove());
    }
  }, [user])

  // Only show the animated homepage (hero, SVGs, 3D coin) to unauthenticated users
    return (
    <>
      {loading ? (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}>
          <div className={styles.goldenSpinner}></div>
          <span>Loading...</span>
        </div>
      </div>
      ) : user ? (
        usePageRenderer()
      ) : (
        <>
          {/* 3D Coin Canvas - zig-zag path, always visible above content */}
          <div style={{ position: 'fixed', pointerEvents: 'none', zIndex: 9999, left: `${coinAnimState.left}px`, top: `${coinAnimState.top}px`, width: 220 * coinAnimState.scale, height: 220 * coinAnimState.scale }}>
            <canvas ref={threeCanvasRef} width={220} height={220} style={{ width: 220 * coinAnimState.scale, height: 220 * coinAnimState.scale }} />
          </div>

          {/* Banner Section with SVGs */}
          <section className={styles.bannerSection + ' ' + styles.sectionFadeIn} style={{ position: 'relative', zIndex: 2 }}>
            {/* SVGs - visually prominent in hero */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
              <Image src="/globe.svg" alt="globe" className={styles.parallaxSvg + ' ' + styles.floatUpDown} style={{ position: 'absolute', top: 40, left: '8vw', width: 120, zIndex: 2 }} width={120} height={120} />
              <Image src="/bitcoin-svgrepo-com.svg" alt="bitcoin" className={styles.parallaxSvg + ' ' + styles.floatLeftRight} style={{ position: 'absolute', top: 120, right: '10vw', width: 90, zIndex: 2 }} width={90} height={90} />
              <Image src="/money-bag-svgrepo-com.svg" alt="money bag" className={styles.parallaxSvg + ' ' + styles.spinSlow} style={{ position: 'absolute', top: 200, left: '18vw', width: 80, zIndex: 2 }} width={80} height={80} />
              <Image src="/dollar-coin-svgrepo-com.svg" alt="dollar coin" className={styles.parallaxSvg + ' ' + styles.floatUpDown} style={{ position: 'absolute', top: 260, right: '18vw', width: 70, zIndex: 2 }} width={70} height={70} />
              <Image src="/trend-upward-svgrepo-com.svg" alt="trend up" className={styles.parallaxSvg + ' ' + styles.floatLeftRight} style={{ position: 'absolute', top: 80, left: '40vw', width: 60, zIndex: 2 }} width={60} height={60} />
              <Image src="/trend-down-thin-svgrepo-com.svg" alt="trend down" className={styles.parallaxSvg + ' ' + styles.spinSlow} style={{ position: 'absolute', top: 320, left: '60vw', width: 60, zIndex: 2 }} width={60} height={60} />
        </div>
            {/* Hero Content */}
            <div className={styles.bannerContainer} style={{ position: 'relative', transform: 'translateX(-8px)' }}>
              <h1 className={styles.bannerTitle + ' ' + styles.gradientText}>Lakshmi AI <span className={styles.gradientTextAlt}>Trade. Grow. Win.</span></h1>
              <p className={styles.bannerSubtitle}>The wildest, most animated stock & crypto dashboard. Track, trade, and win with style!</p>
              <div className={styles.bannerActions}>
                <button className={styles.animatedButton} onClick={handleButtonBurst}>Start Trading
                  <span className={styles.buttonGlow}></span>
                  {/* Confetti/Coin burst */}
                  {confetti.length > 0 && (
                    <span className={styles.confettiBurst} ref={confettiRef}>
                      {confetti.map((c, i) => (
                        <Image
                          key={c.id}
                          src={c.type === 0 ? "/dollar-coin-svgrepo-com.svg" : c.type === 1 ? "/bitcoin-svgrepo-com.svg" : "/money-bag-svgrepo-com.svg"}
                          alt="confetti"
                          className={styles.confettiPiece}
        style={{
                            '--dx': `${c.dx}px`,
                            '--dy': `${c.dy}px`,
                            left: 0,
                            top: 0
                          }}
                          width={18}
                          height={18}
                        />
                      ))}
                    </span>
                  )}
                </button>
                <button className={styles.animatedButton} style={{background: 'linear-gradient(90deg, #232526 60%, #FFD700 100%)', color: '#FFD700', border: '2px solid #FFD700'}}>Learn More</button>
              </div>
            </div>
          </section>

          {/* Ticker Tape - always visible */}
          <div className={styles.tickerTape}>
            <div className={styles.tickerContent}>
              {tickerLoading ? (
                <span>Loading prices...</span>
              ) : (
                tickerData.map((item, idx) => (
                  <span key={item.symbol} className={styles.tickerItem + ' ' + (item.change >= 0 ? styles.tickerUp : styles.tickerDown)}>
                    {item.symbol}: {item.price?.toFixed(2)} <span>{item.change >= 0 ? '▲' : '▼'} {Math.abs(item.change).toFixed(2)}%</span>
                  </span>
                ))
              )}
            </div>
              </div>

          {/* Features Section */}
          <section className={styles.featuresSection + ' ' + styles.sectionSlideIn}>
            <div className={styles.featuresContainer}>
              <h2 className={styles.sectionTitle + ' ' + styles.gradientText}>Why Lakshmi?</h2>
              <div className={styles.featuresGrid}>
                <div className={styles.animatedCard}>
                  <Image src="/file.svg" alt="file" width={48} height={48} className={styles.featureIcon} />
                  <h3 className={styles.featureTitle}>Live Stock & Crypto Prices</h3>
                  <p className={styles.featureDescription}>Get real-time prices, trends, and news for stocks and crypto. Never miss a market move!</p>
            </div>
                <div className={styles.animatedCard}>
                  <Image src="/window.svg" alt="window" width={48} height={48} className={styles.featureIcon} />
                  <h3 className={styles.featureTitle}>Animated Trading Tools</h3>
                  <p className={styles.featureDescription}>Use wild, animated charts and tools to analyze and trade like a pro. Fun meets finance!</p>
              </div>
                <div className={styles.animatedCard}>
                  <Image src="/vercel.svg" alt="vercel" width={48} height={48} className={styles.featureIcon} />
                  <h3 className={styles.featureTitle}>Parallax & Crazy Effects</h3>
                  <p className={styles.featureDescription}>Experience a homepage that moves, glows, and bounces with your every scroll and click.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
          <section className={styles.ctaSection + ' ' + styles.sectionFadeIn}>
        <div className={styles.ctaContainer}>
              <h2 className={styles.ctaTitle + ' ' + styles.gradientText}>Ready to Get Crazy with Your Trades?</h2>
              <p className={styles.ctaDescription}>Join Lakshmi and experience the most animated, fun, and powerful trading dashboard ever built.</p>
              <button className={styles.animatedButton} onClick={handleButtonBurst}>Join Now</button>
        </div>
      </section>
        </>
      )}
    </>
  );
}