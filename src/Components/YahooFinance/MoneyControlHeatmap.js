'use client'

import { useState, useEffect, useRef } from 'react'
import styles from './YahooComponents.module.css'

export default function MoneyControlHeatmap() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sectorData, setSectorData] = useState([]);
  const [view, setView] = useState('sector'); // 'sector' or 'stocks'
  const [selectedSector, setSelectedSector] = useState(null);
  const [timeFilter, setTimeFilter] = useState('1d'); // 1d, 1w, 1m, 3m, ytd
  const containerRef = useRef(null);
  
  // Fetch sector performance data
  useEffect(() => {
    const fetchSectorData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // In a real implementation, you would fetch this from your API
        // For now, let's create sample data similar to MoneyControl's heatmap
        
        // Define major sectors in the Indian market with sample data
        const sectors = [
          { 
            id: 'financials', 
            name: 'Financials', 
            change: 1.2, 
            marketCap: 45000, // in billions
            volume: 123456789,
            stocks: [
              { symbol: 'HDFCBANK', name: 'HDFC Bank', change: 1.8, marketCap: 12000 },
              { symbol: 'SBIN', name: 'State Bank of India', change: 0.6, marketCap: 5000 },
              { symbol: 'ICICIBANK', name: 'ICICI Bank', change: 1.5, marketCap: 6000 },
              { symbol: 'AXISBANK', name: 'Axis Bank', change: 0.9, marketCap: 3500 },
              { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', change: 1.3, marketCap: 3900 },
            ]
          },
          { 
            id: 'it', 
            name: 'IT', 
            change: -0.8, 
            marketCap: 30000,
            volume: 89765432,
            stocks: [
              { symbol: 'TCS', name: 'Tata Consultancy Services', change: -0.5, marketCap: 12500 },
              { symbol: 'INFY', name: 'Infosys', change: -1.2, marketCap: 7500 },
              { symbol: 'WIPRO', name: 'Wipro', change: -0.9, marketCap: 2200 },
              { symbol: 'HCLTECH', name: 'HCL Technologies', change: -0.6, marketCap: 3100 },
              { symbol: 'TECHM', name: 'Tech Mahindra', change: -0.8, marketCap: 1100 },
            ]
          },
          { 
            id: 'energy', 
            name: 'Energy', 
            change: 2.1, 
            marketCap: 28000,
            volume: 76543210,
            stocks: [
              { symbol: 'RELIANCE', name: 'Reliance Industries', change: 2.5, marketCap: 16500 },
              { symbol: 'ONGC', name: 'Oil & Natural Gas Corporation', change: 1.8, marketCap: 2100 },
              { symbol: 'POWERGRID', name: 'Power Grid Corporation', change: 1.5, marketCap: 1800 },
              { symbol: 'NTPC', name: 'NTPC Limited', change: 1.9, marketCap: 1600 },
              { symbol: 'ADANIGREEN', name: 'Adani Green Energy', change: 3.2, marketCap: 1700 },
            ]
          },
          { 
            id: 'consumer', 
            name: 'Consumer Goods', 
            change: 0.5, 
            marketCap: 20000,
            volume: 45678901,
            stocks: [
              { symbol: 'ITC', name: 'ITC Limited', change: 0.7, marketCap: 4500 },
              { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', change: 0.2, marketCap: 5900 },
              { symbol: 'NESTLEIND', name: 'Nestle India', change: 0.4, marketCap: 2100 },
              { symbol: 'BRITANNIA', name: 'Britannia Industries', change: 0.8, marketCap: 1100 },
              { symbol: 'MARICO', name: 'Marico Limited', change: 0.3, marketCap: 800 },
            ]
          },
          { 
            id: 'auto', 
            name: 'Automobiles', 
            change: -0.3, 
            marketCap: 15000,
            volume: 34567890,
            stocks: [
              { symbol: 'MARUTI', name: 'Maruti Suzuki India', change: -0.2, marketCap: 3400 },
              { symbol: 'TATAMOTORS', name: 'Tata Motors', change: -0.5, marketCap: 2800 },
              { symbol: 'M&M', name: 'Mahindra & Mahindra', change: -0.1, marketCap: 1900 },
              { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto', change: -0.4, marketCap: 1300 },
              { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp', change: -0.3, marketCap: 1100 },
            ]
          },
          { 
            id: 'pharma', 
            name: 'Pharmaceuticals', 
            change: 1.0, 
            marketCap: 18000,
            volume: 56789012,
            stocks: [
              { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical', change: 1.2, marketCap: 3800 },
              { symbol: 'DRREDDY', name: 'Dr. Reddy\'s Laboratories', change: 0.8, marketCap: 1800 },
              { symbol: 'CIPLA', name: 'Cipla', change: 1.3, marketCap: 1400 },
              { symbol: 'DIVISLAB', name: 'Divi\'s Laboratories', change: 0.6, marketCap: 1200 },
              { symbol: 'BIOCON', name: 'Biocon', change: 1.1, marketCap: 700 },
            ]
          },
          { 
            id: 'metals', 
            name: 'Metals & Mining', 
            change: -1.5, 
            marketCap: 12000,
            volume: 43210987,
            stocks: [
              { symbol: 'TATASTEEL', name: 'Tata Steel', change: -1.8, marketCap: 2200 },
              { symbol: 'HINDALCO', name: 'Hindalco Industries', change: -1.5, marketCap: 1500 },
              { symbol: 'JSWSTEEL', name: 'JSW Steel', change: -1.3, marketCap: 1700 },
              { symbol: 'COALINDIA', name: 'Coal India', change: -0.9, marketCap: 1600 },
              { symbol: 'VEDL', name: 'Vedanta', change: -2.1, marketCap: 1200 },
            ]
          },
          { 
            id: 'realty', 
            name: 'Realty', 
            change: 0.7, 
            marketCap: 6000,
            volume: 23456789,
            stocks: [
              { symbol: 'DLF', name: 'DLF Limited', change: 0.9, marketCap: 900 },
              { symbol: 'GODREJPROP', name: 'Godrej Properties', change: 0.7, marketCap: 700 },
              { symbol: 'OBEROIRLTY', name: 'Oberoi Realty', change: 0.5, marketCap: 400 },
              { symbol: 'PRESTIGE', name: 'Prestige Estates', change: 0.8, marketCap: 300 },
              { symbol: 'BRIGADE', name: 'Brigade Enterprises', change: 0.6, marketCap: 200 },
            ]
          }
        ];
        
        setSectorData(sectors);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching sector data:', err);
        setError('Failed to load market heatmap data');
        setLoading(false);
      }
    };
    
    fetchSectorData();
  }, [timeFilter]);
  
  // Calculate the size of blocks based on market cap and change percentage
  const getBlockSize = (marketCap) => {
    // Normalize market cap to a size between 50 and 400 pixels
    const minSize = 80;
    const maxSize = 200;
    const minMarketCap = 200; // in billions (smallest sector)
    const maxMarketCap = 45000; // in billions (largest sector)
    
    const size = minSize + ((marketCap - minMarketCap) / (maxMarketCap - minMarketCap)) * (maxSize - minSize);
    return Math.max(minSize, Math.min(size, maxSize));
  };
  
  // Get color based on percentage change
  const getColor = (change) => {
    if (change > 3) return '#006400'; // Dark green
    if (change > 2) return '#32CD32'; // Lime green
    if (change > 1) return '#90EE90'; // Light green
    if (change > 0) return '#E8F5E9'; // Very light green
    if (change === 0) return '#E0E0E0'; // Gray
    if (change > -1) return '#FFEBEE'; // Very light red
    if (change > -2) return '#FFCDD2'; // Light red
    if (change > -3) return '#EF9A9A'; // Medium red
    return '#B71C1C'; // Dark red
  };
  
  // Format numbers for display
  const formatNumber = (number) => {
    if (number >= 1000) return (number / 1000).toFixed(1) + 'T';
    return number.toFixed(0) + 'B';
  };
  
  const handleSectorClick = (sector) => {
    setSelectedSector(sector);
    setView('stocks');
  };
  
  const handleBackToSectors = () => {
    setSelectedSector(null);
    setView('sector');
  };
  
  // Render the heatmap
  const renderHeatmap = () => {
    if (view === 'sector') {
      return (
        <div className={styles.heatmapContainer}>
          {sectorData.map((sector) => (
            <div 
              key={sector.id}
              className={styles.heatmapBlock}
              style={{
                width: `${getBlockSize(sector.marketCap)}px`,
                height: `${getBlockSize(sector.marketCap)}px`,
                backgroundColor: getColor(sector.change)
              }}
              onClick={() => handleSectorClick(sector)}
            >
              <div className={styles.blockContent}>
                <div className={styles.blockTitle}>{sector.name}</div>
                <div className={`${styles.blockChange} ${sector.change >= 0 ? styles.positive : styles.negative}`}>
                  {sector.change > 0 ? '+' : ''}{sector.change.toFixed(1)}%
                </div>
                <div className={styles.blockMarketCap}>
                  ₹{formatNumber(sector.marketCap)}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    } else if (view === 'stocks' && selectedSector) {
      return (
        <div className={styles.stocksList}>
          <div className={styles.sectorHeader}>
            <button className={styles.backButton} onClick={handleBackToSectors}>
              ← Back to Sectors
            </button>
            <h3>{selectedSector.name} Sector</h3>
            <div className={`${styles.sectorChange} ${selectedSector.change >= 0 ? styles.positive : styles.negative}`}>
              {selectedSector.change > 0 ? '+' : ''}{selectedSector.change.toFixed(1)}%
            </div>
          </div>
          
          <div className={styles.stocksHeatmap}>
            {selectedSector.stocks.map((stock) => (
              <div 
                key={stock.symbol}
                className={styles.stockBlock}
                style={{
                  width: `${getBlockSize(stock.marketCap) * 0.8}px`,
                  height: `${getBlockSize(stock.marketCap) * 0.8}px`,
                  backgroundColor: getColor(stock.change)
                }}
              >
                <div className={styles.blockContent}>
                  <div className={styles.stockSymbol}>{stock.symbol}</div>
                  <div className={`${styles.stockChange} ${stock.change >= 0 ? styles.positive : styles.negative}`}>
                    {stock.change > 0 ? '+' : ''}{stock.change.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className={styles.moneyControlHeatmap} ref={containerRef}>
      <div className={styles.heatmapHeader}>
        <h2>Market Heatmap</h2>
        <div className={styles.timeFilters}>
          <button 
            className={`${styles.timeFilter} ${timeFilter === '1d' ? styles.active : ''}`}
            onClick={() => setTimeFilter('1d')}
          >
            1D
          </button>
          <button 
            className={`${styles.timeFilter} ${timeFilter === '1w' ? styles.active : ''}`}
            onClick={() => setTimeFilter('1w')}
          >
            1W
          </button>
          <button 
            className={`${styles.timeFilter} ${timeFilter === '1m' ? styles.active : ''}`}
            onClick={() => setTimeFilter('1m')}
          >
            1M
          </button>
          <button 
            className={`${styles.timeFilter} ${timeFilter === '3m' ? styles.active : ''}`}
            onClick={() => setTimeFilter('3m')}
          >
            3M
          </button>
          <button 
            className={`${styles.timeFilter} ${timeFilter === 'ytd' ? styles.active : ''}`}
            onClick={() => setTimeFilter('ytd')}
          >
            YTD
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className={styles.loading}>Loading market heatmap...</div>
      ) : error ? (
        <div className={styles.error}>
          {error}
          <div className={styles.errorHelp}>Please try again later.</div>
        </div>
      ) : (
        <div className={styles.heatmapWrapper}>
          {renderHeatmap()}
        </div>
      )}
      
      <div className={styles.heatmapFooter}>
        <div className={styles.colorScale}>
          <span className={styles.scaleLabel}>-3%</span>
          <div className={styles.gradientBar}></div>
          <span className={styles.scaleLabel}>+3%</span>
        </div>
        <div className={styles.disclaimer}>
          Data shown is for illustration purposes. Size represents market capitalization.
        </div>
      </div>
    </div>
  );
}
