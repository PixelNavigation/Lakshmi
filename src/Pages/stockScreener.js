'use client'

import styles from './stockScreener.module.css'

export default function StockScreener() {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>🔍 Stock Screener</h1>
        <p className={styles.pageSubtitle}>Find investment opportunities with advanced screening criteria</p>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.mainContent}>
          <div className={styles.card}>
            <h3>Screening Criteria</h3>
            <div className={styles.filterGrid}>
              <div className={styles.filterGroup}>
                <label>Market Cap</label>
                <select className={styles.selectInput}>
                  <option>All</option>
                  <option>Large Cap (&gt; $10B)</option>
                  <option>Mid Cap ($2B - $10B)</option>
                  <option>Small Cap (&lt; $2B)</option>
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label>Sector</label>
                <select className={styles.selectInput}>
                  <option>All Sectors</option>
                  <option>Technology</option>
                  <option>Healthcare</option>
                  <option>Financial</option>
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label>P/E Ratio</label>
                <input type="range" min="0" max="50" className={styles.rangeInput} />
              </div>
              <div className={styles.filterGroup}>
                <label>Dividend Yield</label>
                <input type="range" min="0" max="10" className={styles.rangeInput} />
              </div>
            </div>
            <button className={styles.primaryButton}>Run Screen</button>
          </div>

          <div className={styles.card}>
            <h3>Screening Results</h3>
            <div className={styles.resultsList}>
              <div className={styles.resultHeader}>
                <span>Symbol</span>
                <span>Company</span>
                <span>Price</span>
                <span>Change</span>
                <span>Market Cap</span>
              </div>
              <div className={styles.resultRow}>
                <span>AAPL</span>
                <span>Apple Inc.</span>
                <span>$185.50</span>
                <span className={styles.positive}>+2.1%</span>
                <span>$2.9T</span>
              </div>
              <div className={styles.resultRow}>
                <span>MSFT</span>
                <span>Microsoft Corp.</span>
                <span>$340.20</span>
                <span className={styles.positive}>+1.8%</span>
                <span>$2.5T</span>
              </div>
              <div className={styles.resultRow}>
                <span>GOOGL</span>
                <span>Alphabet Inc.</span>
                <span>$142.80</span>
                <span className={styles.negative}>-0.5%</span>
                <span>$1.8T</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.card}>
            <h3>Saved Screens</h3>
            <div className={styles.savedScreens}>
              <div className={styles.savedScreen}>High Dividend Yield</div>
              <div className={styles.savedScreen}>Growth Stocks</div>
              <div className={styles.savedScreen}>Value Opportunities</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
