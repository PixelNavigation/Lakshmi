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

export default function Home() {
  const { user, loading } = useAuth()
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [isInitialized, setIsInitialized] = useState(false)
  const mouseTimeoutRef = useRef(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isMouseMoving, setIsMouseMoving] = useState(false)
  const [tickerData, setTickerData] = useState([]);
  const [tickerLoading, setTickerLoading] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const [confetti, setConfetti] = useState([]);
  const confettiRef = useRef(null);
  const threeCanvasRef = useRef(null);
  const coinAnimRef = useRef({ top: 120, left: 0, scale: 1, rotation: 0 });
  const coinTargetRef = useRef({ top: 120, left: 0, scale: 1, rotation: 0 });
  const [coinAnimState, setCoinAnimState] = useState({ top: 120, left: 0, scale: 1, rotation: 0 });
  const [showTooltip, setShowTooltip] = useState(null);

  const APP_ROUTES = useMemo(() => ({
    dashboard: { path: 'dashboard', component: Dashboard, label: 'Dashboard', icon: '📊' },
    balance: { path: 'balance', component: Balance, label: 'Balance', icon: '💰' },
    stockScreener: { path: 'stockScreener', component: StockScreener, label: 'Stock Screener', icon: '🔍' },
    watchList: { path: 'watchList', component: WatchList, label: 'Watch List', icon: '👁️' },
    portfolio: { path: 'portfolio', component: Portfolio, label: 'Portfolio', icon: '💼' },
    stockGraph: { path: 'stockGraph', component: StockGraph, label: 'Stock Graph', icon: '📈' },
    news: { path: 'news', component: News, label: 'News', icon: '📰' },
    lakshmiAi: { path: 'lakshmiAi', component: LakshmiAi, label: 'Lakshmi AI', icon: '🤖' }
  }), [])

  useEffect(() => {
    if (user) return;

    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
      setIsMouseMoving(true)
      if (mouseTimeoutRef.current) clearTimeout(mouseTimeoutRef.current)
      mouseTimeoutRef.current = setTimeout(() => setIsMouseMoving(false), 100)
      createSparkle(e.clientX, e.clientY)
    }

    const createSparkle = (x, y) => {
      const sparkle = document.createElement('div')
      sparkle.className = styles.sparkleEffect
      sparkle.style.left = `${x}px`
      sparkle.style.top = `${y}px`
      document.body.appendChild(sparkle)
      setTimeout(() => sparkle.remove(), 800)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [user])

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

  useEffect(() => {
    const cards = document.querySelectorAll(`.${styles.featureCard}`)
    const handleCardMouseMove = (e, card) => {
      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const rotateX = (y - centerY) / 8
      const rotateY = (centerX - x) / 8
      card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`
    }
    const handleCardMouseLeave = (card) => {
      card.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale(1)'
    }
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => handleCardMouseMove(e, card))
      card.addEventListener('mouseleave', () => handleCardMouseLeave(card))
    })
    return () => cards.forEach(card => {
      card.removeEventListener('mousemove', handleCardMouseMove)
      card.removeEventListener('mouseleave', handleCardMouseLeave)
    })
  }, [user])

  const useRouteValidator = useCallback((route) => Object.keys(APP_ROUTES).includes(route), [APP_ROUTES])
  const useInitialRoute = useCallback(() => {
    if (!user) return 'dashboard'
    const urlParams = new URLSearchParams(window.location.search)
    const pageParam = urlParams.get('page')
    if (pageParam && useRouteValidator(pageParam)) return pageParam
    if (typeof window !== 'undefined') {
      const lastVisited = localStorage.getItem('lastVisitedPage')
      if (lastVisited && useRouteValidator(lastVisited)) return lastVisited
    }
    return 'dashboard'
  }, [user, useRouteValidator])
  const useNavigation = useCallback(() => {
    const navigate = (route) => {
      if (!useRouteValidator(route)) return
      setCurrentPage(route)
      if (user && typeof window !== 'undefined') {
        localStorage.setItem('lastVisitedPage', route)
        const url = new URL(window.location)
        url.searchParams.set('page', route)
        window.history.pushState({ page: route }, '', url)
        const event = new CustomEvent('pageChanged', { detail: { page: route } })
        window.dispatchEvent(event)
      }
    }
    return navigate
  }, [useRouteValidator, user])
  const useBrowserNavigation = useCallback(() => {
    const handlePopState = (event) => {
      const route = event.state?.page || 'dashboard'
      if (useRouteValidator(route)) setCurrentPage(route)
    }
    return handlePopState
  }, [useRouteValidator])
  const useExternalNavigation = useCallback(() => {
    const navigate = useNavigation()
    const handleNavigationEvent = (event) => navigate(event.detail.page)
    return handleNavigationEvent
  }, [useNavigation])

  useEffect(() => {
    if (user && !isInitialized) {
      const initialRoute = useInitialRoute()
      setCurrentPage(initialRoute)
      setIsInitialized(true)
      if (typeof window !== 'undefined') {
        const url = new URL(window.location)
        url.searchParams.set('page', initialRoute)
        window.history.replaceState({ page: initialRoute }, '', url)
        const event = new CustomEvent('pageChanged', { detail: { page: initialRoute } })
        window.dispatchEvent(event)
      }
    }
  }, [user, isInitialized, useInitialRoute])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handlePopState = useBrowserNavigation()
      window.addEventListener('popstate', handlePopState)
      return () => window.removeEventListener('popstate', handlePopState)
    }
  }, [useBrowserNavigation])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleNavigationEvent = useExternalNavigation()
      window.addEventListener('navigate', handleNavigationEvent)
      return () => window.removeEventListener('navigate', handleNavigationEvent)
    }
  }, [useExternalNavigation])

  const usePageRenderer = useCallback(() => {
    const route = APP_ROUTES[currentPage]
    return route && route.component ? <route.component /> : <APP_ROUTES.dashboard.component />
  }, [currentPage, APP_ROUTES])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const navigate = useNavigation()
      window.navigateApp = navigate
      return () => delete window.navigateApp
    }
  }, [useNavigation])

  useEffect(() => {
    async function fetchTicker() {
      setTickerLoading(true)
      try {
        const res = await fetch('/api/stock-prices?symbols=TCS.NS,INFY.NS,HDFCBANK.NS,ICICIBANK.NS,RELIANCE.NS,ITC.NS,BTCINR,ETHINR')
        const json = await res.json()
        if (json.success) setTickerData(json.data)
        else setTickerData([])
      } catch {
        setTickerData([])
      }
      setTickerLoading(false)
    }
    fetchTicker()
    const interval = setInterval(fetchTicker, 20000)
    return () => clearInterval(interval)
  }, [])

  const handleButtonBurst = (e) => {
    const confettiArr = []
    for (let i = 0; i < 20; i++) {
      confettiArr.push({
        id: Math.random(),
        dx: Math.random() * 250 - 125,
        dy: Math.random() * 150 - 75,
        type: i % 4
      })
    }
    setConfetti(confettiArr)
    setTimeout(() => setConfetti([]), 1500)
  }

  useEffect(() => {
    function handleCoinScroll() {
      const pageHeight = document.body.scrollHeight - window.innerHeight
      const scrollY = window.scrollY
      const progress = Math.max(0, Math.min(1, scrollY / pageHeight))
      const minLeft = 50
      const maxLeft = window.innerWidth - 300
      const left = maxLeft - (maxLeft - minLeft) * progress
      const minTop = 100
      const maxTop = pageHeight + 100
      const easedProgress = Math.pow(progress, 0.6)
      const top = minTop + (maxTop - minTop) * easedProgress
      const scale = 1 + 2.5 * progress
      const rotation = Math.PI * 10 * progress
      coinTargetRef.current = { top, left, scale, rotation }
    }
    window.addEventListener('scroll', handleCoinScroll)
    handleCoinScroll()
    return () => window.removeEventListener('scroll', handleCoinScroll)
  }, [])

  useEffect(() => {
    if (!threeCanvasRef.current) return
    let renderer, scene, camera, coin, glowMesh, rimMesh, shineMesh, symbolMesh
    const width = 250, height = 250
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, canvas: threeCanvasRef.current })
    renderer.setSize(width, height)
    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.z = 6
    const geometry = new THREE.CylinderGeometry(1, 1, 0.3, 120, 1, false)
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xFFAA00,
      metalness: 0.9,
      roughness: 0.07,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      reflectivity: 1.2,
      transmission: 0.15,
      ior: 1.5,
      sheen: 1,
      sheenColor: new THREE.Color(0xFFD700),
      sheenRoughness: 0.08,
      thickness: 0.12,
      envMapIntensity: 1.8
    })
    coin = new THREE.Mesh(geometry, material)
    scene.add(coin)
    const rimGeometry = new THREE.CylinderGeometry(1.03, 1.03, 0.32, 120, 1, true)
    const rimMaterial = new THREE.MeshBasicMaterial({ color: 0xFFD700, side: THREE.DoubleSide })
    rimMesh = new THREE.Mesh(rimGeometry, rimMaterial)
    scene.add(rimMesh)
    const glowMaterial = new THREE.MeshBasicMaterial({ color: 0xFFAA00, transparent: true, opacity: 0.18 })
    const glowGeometry = new THREE.CylinderGeometry(1.25, 1.25, 0.4, 120, 1, true)
    glowMesh = new THREE.Mesh(glowGeometry, glowMaterial)
    scene.add(glowMesh)
    const shineMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.22 })
    const shineGeometry = new THREE.CylinderGeometry(0.75, 0.75, 0.28, 36, 1, true, Math.PI / 2, Math.PI / 1.2)
    shineMesh = new THREE.Mesh(shineGeometry, shineMaterial)
    shineMesh.position.set(0.35, 0.35, 0.15)
    scene.add(shineMesh)
    const loader = new FontLoader()
    loader.load('https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', function (font) {
      const textGeometry = new TextGeometry('💰', {
        font: font,
        size: 0.6,
        height: 0.1,
        curveSegments: 10,
        bevelEnabled: true,
        bevelThickness: 0.04,
        bevelSize: 0.025,
        bevelOffset: 0,
        bevelSegments: 4
      })
      const textMaterial = new THREE.MeshPhysicalMaterial({ color: 0xFFFFFF, metalness: 0.8, roughness: 0.15 })
      symbolMesh = new THREE.Mesh(textGeometry, textMaterial)
      symbolMesh.position.set(-0.25, -0.25, 0.15)
      symbolMesh.rotation.x = Math.PI / 2
      scene.add(symbolMesh)
    })
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.2)
    scene.add(ambientLight)
    const pointLight = new THREE.PointLight(0xFFD700, 1.8, 12)
    pointLight.position.set(4, 6, 6)
    scene.add(pointLight)
    const rimLight = new THREE.PointLight(0xFFFFFF, 1.3, 12)
    rimLight.position.set(-4, -6, 6)
    scene.add(rimLight)
    window.__lakshmiCoinScene = { renderer, scene, camera, coin, rimMesh, glowMesh, shineMesh, symbolMesh }
    return () => {
      renderer.dispose()
      geometry.dispose()
      material.dispose()
      rimGeometry.dispose()
      rimMaterial.dispose()
      glowGeometry.dispose()
      glowMaterial.dispose()
      shineGeometry.dispose()
      shineMaterial.dispose()
      if (symbolMesh && symbolMesh.geometry) symbolMesh.geometry.dispose()
      if (symbolMesh && symbolMesh.material) symbolMesh.material.dispose()
      window.__lakshmiCoinScene = null
    }
  }, [])

  useEffect(() => {
    let animationId
    function lerp(a, b, t) { return a + (b - a) * t }
    function animate() {
      const prev = coinAnimRef.current
      const target = coinTargetRef.current
      const t = 0.12
      const next = {
        top: lerp(prev.top, target.top, t),
        left: lerp(prev.left, target.left, t),
        scale: lerp(prev.scale, target.scale, t),
        rotation: lerp(prev.rotation, target.rotation, t),
      }
      coinAnimRef.current = next
      if (
        Math.abs(next.top - coinAnimState.top) > 0.5 ||
        Math.abs(next.left - coinAnimState.left) > 0.5 ||
        Math.abs(next.scale - coinAnimState.scale) > 0.01 ||
        Math.abs(next.rotation - coinAnimState.rotation) > 0.01
      ) {
        setCoinAnimState(next)
      }
      const coinScene = window.__lakshmiCoinScene
      if (coinScene && coinScene.coin) {
        const { renderer, scene, camera, coin, rimMesh, glowMesh, shineMesh, symbolMesh } = coinScene
        const pulse = 1 + Math.sin(Date.now() * 0.0025) * 0.06
        const scale = next.scale * pulse
        coin.scale.set(scale, scale, scale)
        coin.rotation.x = next.rotation
        coin.rotation.y = Math.sin(next.rotation) * 0.3 + Date.now() * 0.00025
        rimMesh.scale.set(scale * 1.03, scale * 1.03, scale * 1.03)
        rimMesh.rotation.x = coin.rotation.x
        rimMesh.rotation.y = coin.rotation.y
        glowMesh.scale.set(scale * 1.25, scale * 1.25, scale * 1.25)
        glowMesh.rotation.x = coin.rotation.x
        glowMesh.rotation.y = coin.rotation.y
        shineMesh.scale.set(scale, scale, scale)
        shineMesh.rotation.x = coin.rotation.x
        shineMesh.rotation.y = coin.rotation.y
        if (symbolMesh) {
          symbolMesh.scale.set(scale, scale, scale)
          symbolMesh.rotation.x = coin.rotation.x + Math.PI / 2
          symbolMesh.rotation.y = coin.rotation.y
        }
        renderer.render(scene, camera)
      }
      animationId = requestAnimationFrame(animate)
    }
    animationId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationId)
  }, [])

  useEffect(() => {
    if (user) document.querySelectorAll(`.${styles.sparkleEffect}`).forEach(el => el.remove())
  }, [user])

  return (
    <>
      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}>
            <div className={styles.goldenSpinner}></div>
            <span>Preparing Your Wealth Journey...</span>
          </div>
        </div>
      ) : user ? (
        usePageRenderer()
      ) : (
        <>
          <div style={{ position: 'fixed', pointerEvents: 'none', zIndex: 9999, left: `${coinAnimState.left}px`, top: `${coinAnimState.top}px`, width: 250 * coinAnimState.scale, height: 250 * coinAnimState.scale }}>
            <canvas ref={threeCanvasRef} width={250} height={250} style={{ width: 250 * coinAnimState.scale, height: 250 * coinAnimState.scale }} />
          </div>

          <section className={styles.heroSection} style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
              <Image src="/globe.svg" alt="Global Market" className={styles.parallaxSvg + ' ' + styles.floatUpDown} style={{ top: 50, left: '5vw', width: 140 }} width={140} height={140} onMouseEnter={() => setShowTooltip('global')} onMouseLeave={() => setShowTooltip(null)} />
              <Image src="/bitcoin-svgrepo-com.svg" alt="Crypto" className={styles.parallaxSvg + ' ' + styles.floatLeftRight} style={{ top: 150, right: '8vw', width: 110 }} width={110} height={110} onMouseEnter={() => setShowTooltip('crypto')} onMouseLeave={() => setShowTooltip(null)} />
              <Image src="/money-bag-svgrepo-com.svg" alt="Portfolio" className={styles.parallaxSvg + ' ' + styles.spinSlow} style={{ top: 250, left: '15vw', width: 100 }} width={100} height={100} onMouseEnter={() => setShowTooltip('portfolio')} onMouseLeave={() => setShowTooltip(null)} />
              <Image src="/dollar-coin-svgrepo-com.svg" alt="Stock Prices" className={styles.parallaxSvg + ' ' + styles.floatUpDown} style={{ top: 300, right: '15vw', width: 90 }} width={90} height={90} onMouseEnter={() => setShowTooltip('stocks')} onMouseLeave={() => setShowTooltip(null)} />
            </div>
            {showTooltip && (
              <div className={styles.tooltip} style={{ top: mousePosition.y + 20, left: mousePosition.x + 20 }}>
                {showTooltip === 'global' && 'Explore global markets with real-time insights!'}
                {showTooltip === 'crypto' && 'Dive into cryptocurrency trading with live updates!'}
                {showTooltip === 'portfolio' && 'Manage all your assets in one secure dashboard!'}
                {showTooltip === 'stocks' && 'Track stock prices as they happen!'}
              </div>
            )}
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>Lakshmi AI <span className={styles.heroAccent}>Ignite. Thrive. Conquer!</span></h1>
              <p className={styles.heroSubtitle}>Unleash the most dazzling stock & crypto trading experience with real-time data and stunning visuals!</p>
              <div className={styles.heroActions}>
                <button className={styles.magicButton} onClick={handleButtonBurst}>Start Your Epic Trade
                  <span className={styles.buttonGlow}></span>
                  {confetti.length > 0 && (
                    <span className={styles.confettiBurst} ref={confettiRef}>
                      {confetti.map((c, i) => (
                        <Image
                          key={c.id}
                          src={c.type === 0 ? "/dollar-coin-svgrepo-com.svg" : c.type === 1 ? "/bitcoin-svgrepo-com.svg" : c.type === 2 ? "/money-bag-svgrepo-com.svg" : "/star.svg"}
                          alt="celebration"
                          className={styles.confettiPiece}
                          style={{ '--dx': `${c.dx}px`, '--dy': `${c.dy}px` }}
                          width={20}
                          height={20}
                        />
                      ))}
                    </span>
                  )}
                </button>
                <button className={styles.magicButton} style={{ background: 'linear-gradient(90deg, #1A1A2E 60%, #FFD700 100%)', color: '#FFD700', border: '2px solid #FFD700' }}>Discover More</button>
              </div>
            </div>
          </section>

          <div className={styles.tickerTape}>
            <div className={styles.tickerContent}>
              {tickerLoading ? (
                <span>Fetching Market Magic...</span>
              ) : (
                tickerData.map((item, idx) => (
                  <span key={item.symbol} className={styles.tickerItem + ' ' + (item.change >= 0 ? styles.tickerUp : styles.tickerDown)}>
                    {item.symbol}: {item.price?.toFixed(2)} <span>{item.change >= 0 ? '▲' : '▼'} {Math.abs(item.change).toFixed(2)}%</span>
                  </span>
                ))
              )}
            </div>
          </div>

          <section className={styles.featuresSection}>
            <div className={styles.featuresContainer}>
              <h2 className={styles.sectionTitle}>Why Lakshmi Shines?</h2>
              <div className={styles.featuresGrid}>
                <div className={styles.featureCard} onMouseEnter={() => setShowTooltip('livePrices')} onMouseLeave={() => setShowTooltip(null)}>
                  <Image src="/trend-upward-svgrepo-com.svg" alt="Live Prices" width={60} height={60} className={styles.featureIcon} />
                  <h3 className={styles.featureTitle}>Live Stock & Crypto Prices</h3>
                  <p className={styles.featureDescription}>Experience real-time market updates to stay ahead of the game!</p>
                </div>
                <div className={styles.featureCard} onMouseEnter={() => setShowTooltip('portfolio')} onMouseLeave={() => setShowTooltip(null)}>
                  <Image src="/money-bag-svgrepo-com.svg" alt="Portfolio" width={60} height={60} className={styles.featureIcon} />
                  <h3 className={styles.featureTitle}>Unified Portfolio Management</h3>
                  <p className={styles.featureDescription}>Centralize your investments with ease and security!</p>
                </div>
                <div className={styles.featureCard} onMouseEnter={() => setShowTooltip('secureTrading')} onMouseLeave={() => setShowTooltip(null)}>
                  <Image src="/window.svg" alt="Secure Trading" width={60} height={60} className={styles.featureIcon} />
                  <h3 className={styles.featureTitle}>Secure & Seamless Trading</h3>
                  <p className={styles.featureDescription}>Trade with confidence using top-tier security protocols!</p>
                </div>
                <div className={styles.featureCard} onMouseEnter={() => setShowTooltip('networkGraph')} onMouseLeave={() => setShowTooltip(null)}>
                  <Image src="/globe.svg" alt="Network Graph" width={60} height={60} className={styles.featureIcon} />
                  <h3 className={styles.featureTitle}>Network Graph Analytics</h3>
                  <p className={styles.featureDescription}>Visualize relationships and influences between your assets with interactive AI-powered graphs.</p>
                </div>
                <div className={styles.featureCard} onMouseEnter={() => setShowTooltip('aiAssistant')} onMouseLeave={() => setShowTooltip(null)}>
                  <span className={styles.featureIcon} role="img" aria-label="AI Bot">🤖</span>
                  <h3 className={styles.featureTitle}>Lakshmi AI Assistant</h3>
                  <p className={styles.featureDescription}>Ask anything about markets, your portfolio, or news. Get instant, personalized answers and insights.</p>
                </div>
                <div className={styles.featureCard} onMouseEnter={() => setShowTooltip('news')} onMouseLeave={() => setShowTooltip(null)}>
                  <Image src="/file.svg" alt="Smart News" width={60} height={60} className={styles.featureIcon} />
                  <h3 className={styles.featureTitle}>Smart News & Sentiment</h3>
                  <p className={styles.featureDescription}>Stay ahead with curated news, sentiment analysis, and alerts for your watchlist.</p>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.ctaSection}>
            <div className={styles.ctaContainer}>
              <h2 className={styles.ctaTitle}>Ready to Rule the Markets?</h2>
              <p className={styles.ctaDescription}>Join Lakshmi AI for a fabulous trading adventure today!</p>
              <button className={styles.magicButton} onClick={handleButtonBurst}>Join the Revolution</button>
            </div>
          </section>
        </>
      )}
    </>
  )
}