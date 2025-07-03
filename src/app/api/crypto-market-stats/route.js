// API route for fetching cryptocurrency market statistics
export async function GET(req) {
  try {
    console.log('📊 Fetching crypto market statistics...')
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Generate dynamic market stats (in real app, fetch from CoinGecko/CoinMarketCap)
    const generateMarketStats = () => {
      const baseMarketCap = 3.29 // Trillion USD
      const marketCapChange = (Math.random() - 0.5) * 0.1 // -5% to +5%
      const currentMarketCap = baseMarketCap + marketCapChange
      
      const baseCMC100 = 202.58
      const cmc100Change = (Math.random() - 0.5) * 0.2
      const currentCMC100 = baseCMC100 + cmc100Change
      
      // Fear & Greed index (0-100)
      const fearGreedValue = Math.floor(Math.random() * 100)
      let fearGreedLabel = 'Neutral'
      if (fearGreedValue < 25) fearGreedLabel = 'Extreme Fear'
      else if (fearGreedValue < 45) fearGreedLabel = 'Fear'
      else if (fearGreedValue > 75) fearGreedLabel = 'Extreme Greed'
      else if (fearGreedValue > 55) fearGreedLabel = 'Greed'
      
      // Altcoin season indicator (0-100, where >75 is altcoin season)
      const altcoinSeasonValue = Math.floor(Math.random() * 100)
      
      return {
        totalMarketCap: {
          value: `$${currentMarketCap.toFixed(2)}T`,
          change: `${marketCapChange >= 0 ? '+' : ''}${(marketCapChange * 100 / baseMarketCap).toFixed(2)}%`,
          value_inr: `₹${(currentMarketCap * 83 * 1000000000000).toLocaleString('en-IN')}`,
          isPositive: marketCapChange >= 0
        },
        cmc100: {
          value: `$${currentCMC100.toFixed(2)}`,
          change: `${cmc100Change >= 0 ? '+' : ''}${(cmc100Change * 100 / baseCMC100).toFixed(2)}%`,
          value_inr: `₹${(currentCMC100 * 83).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
          isPositive: cmc100Change >= 0
        },
        fearGreed: {
          value: fearGreedValue,
          label: fearGreedLabel,
          color: fearGreedValue < 25 ? '#ef4444' : 
                 fearGreedValue < 45 ? '#f59e0b' :
                 fearGreedValue > 75 ? '#ef4444' :
                 fearGreedValue > 55 ? '#f59e0b' : '#10b981'
        },
        altcoinSeason: {
          value: altcoinSeasonValue,
          total: 100,
          label: altcoinSeasonValue > 75 ? 'Altcoin Season' : 
                 altcoinSeasonValue < 25 ? 'Bitcoin Season' : 'Mixed Market',
          isAltcoinSeason: altcoinSeasonValue > 75
        },
        volume24h: {
          value_usd: (Math.random() * 50 + 100).toFixed(1) + 'B', // $100B-150B
          value_inr: `₹${((Math.random() * 50 + 100) * 83 * 1000000000).toLocaleString('en-IN')}`
        },
        dominance: {
          bitcoin: (Math.random() * 10 + 45).toFixed(1), // 45-55%
          ethereum: (Math.random() * 5 + 15).toFixed(1), // 15-20%
          others: (Math.random() * 10 + 25).toFixed(1) // 25-35%
        }
      }
    }

    const marketStats = generateMarketStats()
    
    console.log('✅ Successfully generated crypto market statistics')
    
    return Response.json({
      success: true,
      stats: marketStats,
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
