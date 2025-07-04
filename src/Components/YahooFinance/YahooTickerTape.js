'use client'

import { useEffect, useState } from 'react'
import styles from './YahooComponents.module.css'

export default function YahooTickerTape({ onLoadComplete = null }) {
  const [tickerData, setTickerData] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Add warning if onLoadComplete prop is passed
  useEffect(() => {
    if (onLoadComplete !== null) {
      console.warn('YahooTickerTape: The onLoadComplete prop is disabled to prevent UI issues');
    }
  }, [onLoadComplete]);
  
  // Ensure main content is preserved when ticker changes state
  useEffect(() => {
    // This is a safety measure to ensure the main content stays visible
    // regardless of ticker state changes
    function ensureMainContentVisibility() {
      // Look for main content element
      const mainContent = document.querySelector('[class*="mainContent"]');
      if (mainContent) {
        // Force these styles to ensure visibility
        mainContent.style.display = 'flex';
        mainContent.style.visibility = 'visible';
        mainContent.style.flex = '1 1 auto';
        console.log('Protected main content visibility');
      }
    }
    
    // Call immediately and after a delay
    ensureMainContentVisibility();
    const timer = setTimeout(ensureMainContentVisibility, 100);
    
    return () => clearTimeout(timer);
  }, [loading, tickerData]);
  
  useEffect(() => {
    const fetchTickerData = async () => {
      try {
        setLoading(true)
        
        // Define key Indian market symbols to track
        const symbols = [
          { symbol: '^NSEI', name: 'NIFTY 50' },
          { symbol: '^BSESN', name: 'SENSEX' },
          { symbol: '^NSEBANK', name: 'BANK NIFTY' },
          { symbol: 'RELIANCE.NS', name: 'RELIANCE' },
          { symbol: 'TCS.NS', name: 'TCS' },
          { symbol: 'HDFCBANK.NS', name: 'HDFC BANK' },
          { symbol: 'INFY.NS', name: 'INFOSYS' },
          { symbol: 'ICICIBANK.NS', name: 'ICICI BANK' },
          { symbol: 'HINDUNILVR.NS', name: 'HUL' },
          { symbol: 'SBIN.NS', name: 'SBI' },
          { symbol: 'BHARTIARTL.NS', name: 'AIRTEL' }
        ]
        
        // Fetch data for each symbol
        const fetchPromises = symbols.map(async (item) => {
          try {
            const response = await fetch(`/api/yahoo-finance?symbol=${item.symbol}&timeframe=live`)
            const result = await response.json()
            
            if (result.success) {
              return {
                ...item,
                ...result.data
              }
            } else {
              console.warn(`Failed to fetch data for ${item.name}:`, result.error)
              return {
                ...item,
                price: null,
                change: null,
                changePercent: null,
                error: result.error
              }
            }
          } catch (err) {
            console.error(`Error fetching data for ${item.name}:`, err)
            return {
              ...item,
              price: null,
              change: null,
              changePercent: null,
              error: err.message
            }
          }
        })
        
        const results = await Promise.all(fetchPromises)
        // Use setTimeout to avoid synchronous state updates that might affect DOM
        setTimeout(() => {
          // Update data and ensure the main content is preserved
          setTickerData(results.filter(item => item.price !== null));
          
          // Double check main content visibility
          const mainContent = document.querySelector('[class*="mainContent"]');
          if (mainContent) {
            mainContent.style.display = 'flex';
            mainContent.style.visibility = 'visible';
            console.log('Protected main content after data update');
          }
        }, 0);
      } catch (err) {
        console.error('Error fetching ticker data:', err)
      } finally {
        // Set loading state without triggering any parent re-renders
        setTimeout(() => {
          setLoading(false);
          console.log('Ticker data loaded, UI should remain stable');
        }, 10);
      }
    }
      // Add a mutation observer to ensure the main content stays visible
    const observer = new MutationObserver(() => {
      // Check main content visibility on any DOM changes
      const mainContent = document.querySelector('[class*="mainContent"]');
      if (mainContent) {
        if (window.getComputedStyle(mainContent).display === 'none' || 
            window.getComputedStyle(mainContent).visibility === 'hidden') {
          console.log('Main content was hidden - fixing...');
          mainContent.style.display = 'flex';
          mainContent.style.visibility = 'visible';
        }
      }
    });
    
    // Start observing the document with the configured parameters
    observer.observe(document.body, { attributes: true, childList: true, subtree: true });
    
    // Start fetching data with a slight delay
    setTimeout(() => {
      fetchTickerData();
    }, 100);
    
    // Refresh data every 2 minutes
    const intervalId = setInterval(fetchTickerData, 120000);
    
    return () => {
      clearInterval(intervalId);
      observer.disconnect();
    }
  }, [])

  // Format price with commas and decimal places
  const formatPrice = (price) => {
    if (price === null || price === undefined) return '-'
    return price.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    })
  }

  // Determine color based on change
  const getChangeColor = (change) => {
    if (change > 0) return styles.tickerPositive
    if (change < 0) return styles.tickerNegative
    return styles.tickerNeutral
  }

  return (
    <div 
      className={styles.tickerTapeContainer} 
      style={{ 
        position: 'relative', 
        zIndex: 1000, 
        height: '40px', 
        overflow: 'hidden',
        isolation: 'isolate',
        backgroundColor: 'black',
        scrollBehavior: 'auto' // Create a stacking context
      }}
      data-ticker-state={loading ? 'loading' : 'loaded'}
    >
      {loading && tickerData.length === 0 ? (
        <div className={styles.tickerLoading}>
          <div className={styles.tickerLoadingText}>Loading market data...</div>
        </div>
      ) : (
        <div className={styles.tickerTape} style={{ position: 'relative' }}>
          <div className={styles.tickerTrack} style={{ position: 'relative' }}>
            {tickerData.map((item, index) => (
              <div key={`${item.symbol}-${index}`} className={styles.tickerItem}>
                <span className={styles.tickerSymbol}>{item.name}</span>
                <span className={styles.tickerPrice}>₹{formatPrice(item.price)}</span>
                <span className={`${styles.tickerChange} ${getChangeColor(item.change)}`}>
                  {item.change > 0 ? '+' : ''}{formatPrice(item.change)} 
                  ({item.changePercent > 0 ? '+' : ''}{item.changePercent.toFixed(2)}%)
                </span>
              </div>
            ))}
            {/* Duplicate items for continuous animation */}
            {tickerData.map((item, index) => (
              <div key={`${item.symbol}-dup-${index}`} className={styles.tickerItem}>
                <span className={styles.tickerSymbol}>{item.name}</span>
                <span className={styles.tickerPrice}>₹{formatPrice(item.price)}</span>
                <span className={`${styles.tickerChange} ${getChangeColor(item.change)}`}>
                  {item.change > 0 ? '+' : ''}{formatPrice(item.change)} 
                  ({item.changePercent > 0 ? '+' : ''}{item.changePercent.toFixed(2)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
