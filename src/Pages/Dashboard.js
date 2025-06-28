'use client'

import styles from './Dashboard.module.css'

export default function Dashboard() {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>📊 Dashboard</h1>
        <p className={styles.pageSubtitle}>Your complete portfolio overview and analytics</p>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.mainContent}>
          <div className={styles.card}>
            <h3>Portfolio Performance</h3>
            <div className={styles.performanceGrid}>
              <div className={styles.metric}>
                <span className={styles.metricValue}>$15,420.50</span>
                <span className={styles.metricLabel}>Total Portfolio Value</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricValue}>+$1,240.30</span>
                <span className={styles.metricLabel}>Total Gain/Loss</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricValue}>+8.75%</span>
                <span className={styles.metricLabel}>Total Return</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricValue}>+2.4%</span>
                <span className={styles.metricLabel}>Today's Change</span>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h3>Recent Transactions</h3>
            <div className={styles.transactionList}>
              <div className={styles.transaction}>
                <span>Bought 10 shares of AAPL</span>
                <span>$1,850.00</span>
              </div>
              <div className={styles.transaction}>
                <span>Sold 5 shares of TSLA</span>
                <span>$1,250.00</span>
              </div>
              <div className={styles.transaction}>
                <span>Bought 20 shares of MSFT</span>
                <span>$6,800.00</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.card}>
            <h3>Quick Actions</h3>
            <div className={styles.actionButtons}>
              <button className={styles.actionBtn}>Add Investment</button>
              <button className={styles.actionBtn}>Run Screen</button>
              <button className={styles.actionBtn}>View Reports</button>
              <button className={styles.actionBtn}>Export Data</button>
            </div>
          </div>

          <div className={styles.card}>
            <h3>Market Summary</h3>
            <div className={styles.marketData}>
              <div className={styles.marketItem}>
                <span>S&P 500</span>
                <span className={styles.positive}>+0.8%</span>
              </div>
              <div className={styles.marketItem}>
                <span>NASDAQ</span>
                <span className={styles.positive}>+1.2%</span>
              </div>
              <div className={styles.marketItem}>
                <span>DOW</span>
                <span className={styles.negative}>-0.3%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
