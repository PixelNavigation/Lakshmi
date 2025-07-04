'use client'

import { useState, useEffect, useRef } from 'react'
import styles from './YahooComponents.module.css'

export default function MoneyControlHeatmap() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const iframeRef = useRef(null);
  
  // Handle iframe loading states with a more reliable approach
  useEffect(() => {
    // Start loading state when the component mounts
    setLoading(true);
    
    const iframe = iframeRef.current;
    if (!iframe) return;
    
    // Handle iframe load success
    const handleLoad = () => {
      console.log('MoneyControl heatmap iframe loaded');
      setLoading(false);
      setError(null);
    };
    
    // Handle iframe load error
    const handleError = () => {
      console.log('MoneyControl heatmap iframe failed to load');
      setLoading(false);
      setError("Failed to load MoneyControl heatmap. Please check your internet connection.");
    };
    
    // Add event listeners
    iframe.addEventListener('load', handleLoad);
    iframe.addEventListener('error', handleError);
    
    // Set a timeout in case the iframe doesn't trigger events correctly
    const timeoutId = setTimeout(() => {
      // Force set loading to false after timeout
      setLoading(false);
    }, 8000); // 8 seconds timeout is reasonable
    
    return () => {
      if (iframe) {
        iframe.removeEventListener('load', handleLoad);
        iframe.removeEventListener('error', handleError);
      }
      clearTimeout(timeoutId);
    };
  }, [/* empty dependency array - only run on mount */]);
  
  // Function to handle iframe refresh
  const handleRefresh = () => {
    if (iframeRef.current) {
      // Set loading state
      setLoading(true);
      
      // Create a new URL with a timestamp to force reload and bypass cache
      const url = new URL(iframeRef.current.src);
      url.searchParams.set('_t', Date.now());
      iframeRef.current.src = url.toString();
      
      // Safety fallback: ensure loading is turned off after 8 seconds even if load event doesn't fire
      setTimeout(() => {
        setLoading(false);
      }, 8000);
    }
  };
  
  return (
    <div className={styles.moneyControlHeatmap}>
      <div className={styles.heatmapHeader}>
        <h2>MoneyControl Market Heatmap</h2>
        <button 
          className={styles.refreshButton}
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh
        </button>
      </div>
      
      <div className={styles.iframeWrapper}>
        {loading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner}></div>
            <div className={styles.loadingText}>Loading MoneyControl heatmap...</div>
          </div>
        )}
        
        {error && (
          <div className={styles.error}>
            {error}
            <div className={styles.errorHelp}>
              <button onClick={handleRefresh} className={styles.retryButton}>
                Try Again
              </button>
            </div>
          </div>
        )}
        
        <div className={`${styles.iframeContainer} ${loading ? styles.iframeLoading : ''}`}>
          <iframe 
            ref={iframeRef}
            src="https://www.moneycontrol.com/stocksmarketsindia/360-degree-market-view-heat-map" 
            width="100%" 
            height="800" 
            frameBorder="0"
            title="MoneyControl Market Heatmap"
            sandbox="allow-same-origin allow-scripts"
            loading="eager" /* Changed from lazy to eager for faster loading */
          />
        </div>
      </div>
      
      <div className={styles.heatmapFooter}>
        <div className={styles.disclaimer}>
          Heatmap data provided by MoneyControl. Not affiliated with or endorsed by MoneyControl.
        </div>
      </div>
    </div>
  );
}
