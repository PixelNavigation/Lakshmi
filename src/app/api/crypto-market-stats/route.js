// API route for fetching cryptocurrency market statistics
export async function GET(req) {
  try {
    console.log('📊 Fetching real-time crypto market statistics...')
    
    // Function to fetch real crypto market data
    const fetchRealMarketData = async () => {
      try {
        // USD to INR conversion rate
        const usdToInr = 83.45 // You can fetch this from a real API if needed
        
        // Fetch global crypto market data from CoinGecko (free API)
        const globalResponse = await fetch('https://api.coingecko.com/api/v3/global', {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'LakshmiApp/1.0'
          }
        })
        
        if (!globalResponse.ok) {
          throw new Error(`Global API failed: ${globalResponse.status}`)
        }
        
        const globalData = await globalResponse.json()
        const marketData = globalData.data
        
        // Get total market cap in USD and convert to INR
        const totalMarketCapUSD = marketData.total_market_cap?.usd || 0
        const totalMarketCapINR = totalMarketCapUSD * usdToInr
        const marketCapChangePercent = marketData.market_cap_change_percentage_24h_usd || 0
        
        // Calculate CMC100 equivalent (using market cap percentage)
        const cmc100USD = 200 + (marketCapChangePercent * 2) // Base value with market influence
        const cmc100INR = cmc100USD * usdToInr
        
        // Get Bitcoin dominance for Fear & Greed approximation
        const btcDominance = marketData.market_cap_percentage?.btc || 50
        
        // Calculate Fear & Greed Index based on market metrics
        let fearGreedValue = 50 // Default neutral
        if (marketCapChangePercent > 5) fearGreedValue = 75 + (marketCapChangePercent - 5) * 2
        else if (marketCapChangePercent > 0) fearGreedValue = 50 + marketCapChangePercent * 5
        else if (marketCapChangePercent > -5) fearGreedValue = 50 + marketCapChangePercent * 5
        else fearGreedValue = 25 + (marketCapChangePercent + 5) * 2
        
        fearGreedValue = Math.max(0, Math.min(100, fearGreedValue))
        
        let fearGreedLabel = 'Neutral'
        if (fearGreedValue <= 25) fearGreedLabel = 'Extreme Fear'
        else if (fearGreedValue <= 45) fearGreedLabel = 'Fear'
        else if (fearGreedValue <= 55) fearGreedLabel = 'Neutral'
        else if (fearGreedValue <= 75) fearGreedLabel = 'Greed'
        else fearGreedLabel = 'Extreme Greed'
        
        // Altcoin Season Index (inverse of BTC dominance with adjustments)
        const altcoinSeasonIndex = Math.max(0, Math.min(100, 100 - btcDominance + 10))
        
        return {
          totalMarketCap: totalMarketCapINR,
          marketCapChange: marketCapChangePercent,
          cmc100Index: cmc100INR,
          cmc100Change: marketCapChangePercent * 0.8, // CMC typically moves less than total market
          fearGreedIndex: Math.round(fearGreedValue),
          fearGreedLabel: fearGreedLabel,
          altcoinSeasonIndex: Math.round(altcoinSeasonIndex),
          usdToInr: usdToInr,
          btcDominance: btcDominance
        }
        
      } catch (apiError) {
        console.error('🚨 CoinGecko API failed:', apiError.message)
        throw new Error(`Unable to fetch real-time crypto data: ${apiError.message}`)
      }
    }

    const marketStats = await fetchRealMarketData()
    
    console.log('✅ Successfully fetched crypto market statistics:', {
      marketCap: `₹${(marketStats.totalMarketCap / 1e12).toFixed(2)}T`,
      change: `${marketStats.marketCapChange.toFixed(2)}%`,
      fearGreed: `${marketStats.fearGreedIndex} (${marketStats.fearGreedLabel})`
    })
    
    return Response.json({
      success: true,
      ...marketStats,
      timestamp: new Date().toISOString(),
      lastUpdated: new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: true,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    })

  } catch (error) {
    console.error('❌ Error fetching crypto market stats:', error)
    return Response.json({
      success: false,
      error: 'Failed to fetch crypto market statistics',
      details: error.message
    }, { status: 500 })
  }
}
