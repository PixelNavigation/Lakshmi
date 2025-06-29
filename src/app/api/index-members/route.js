// API to fetch index members from Yahoo Finance
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const index = searchParams.get('index')

  if (!index) {
    return Response.json({ success: false, error: 'Index parameter is required' }, { status: 400 })
  }

  try {
    // Define index symbols for Yahoo Finance
    const indexSymbols = {
      'NIFTY50': '^NSEI',
      'SENSEX': '^BSESN',
      'BANKNIFTY': '^NSEBANK'
    }

    const yahooSymbol = indexSymbols[index]
    if (!yahooSymbol) {
      return Response.json({ success: false, error: 'Invalid index' }, { status: 400 })
    }

    // For now, we'll use predefined data since Yahoo Finance doesn't provide
    // constituent data directly. In production, you'd integrate with NSE/BSE APIs
    // or use services like Alpha Vantage, Financial Modeling Prep, etc.
    
    const indexMembers = await getIndexMembers(index)
    
    return Response.json({ 
      success: true, 
      index,
      members: indexMembers,
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching index members:', error)
    return Response.json({ 
      success: false, 
      error: 'Failed to fetch index members' 
    }, { status: 500 })
  }
}

async function getIndexMembers(index) {
  // Since Yahoo Finance doesn't provide constituent lists directly,
  // we'll fetch the current stock prices for known constituents
  
  const indexConstituents = {
    'NIFTY50': [
      'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'BHARTIARTL.NS', 'ICICIBANK.NS',
      'INFY.NS', 'SBIN.NS', 'LT.NS', 'ITC.NS', 'HINDUNILVR.NS',
      'KOTAKBANK.NS', 'HCLTECH.NS', 'WIPRO.NS', 'MARUTI.NS', 'ASIANPAINT.NS',
      'AXISBANK.NS', 'TITAN.NS', 'NESTLEIND.NS', 'TECHM.NS', 'SUNPHARMA.NS',
      'ULTRACEMCO.NS', 'BAJFINANCE.NS', 'BAJAJFINSV.NS', 'ADANIPORTS.NS', 'POWERGRID.NS',
      'NTPC.NS', 'ONGC.NS', 'COALINDIA.NS', 'DRREDDY.NS', 'CIPLA.NS',
      'DIVISLAB.NS', 'BRITANNIA.NS', 'HEROMOTOCO.NS', 'BAJAJ-AUTO.NS', 'M&M.NS',
      'TATAMOTORS.NS', 'TATASTEEL.NS', 'JSWSTEEL.NS', 'HINDALCO.NS', 'VEDL.NS',
      'INDUSINDBK.NS', 'BANDHANBNK.NS', 'GRASIM.NS', 'APOLLOHOSP.NS', 'BPCL.NS',
      'SHREECEM.NS', 'EICHERMOT.NS', 'TATACONSUM.NS', 'UPL.NS', 'LTIM.NS'
    ],
    'SENSEX': [
      'RELIANCE.BO', 'TCS.BO', 'HDFCBANK.BO', 'INFY.BO', 'ICICIBANK.BO',
      'BHARTIARTL.BO', 'SBIN.BO', 'LT.BO', 'ITC.BO', 'KOTAKBANK.BO',
      'HINDUNILVR.BO', 'HCLTECH.BO', 'MARUTI.BO', 'ASIANPAINT.BO', 'WIPRO.BO',
      'AXISBANK.BO', 'TITAN.BO', 'NESTLEIND.BO', 'TECHM.BO', 'SUNPHARMA.BO',
      'ULTRACEMCO.BO', 'BAJFINANCE.BO', 'BAJAJFINSV.BO', 'NTPC.BO', 'POWERGRID.BO',
      'M&M.BO', 'TATASTEEL.BO', 'JSWSTEEL.BO', 'INDUSINDBK.BO', 'DRREDDY.BO'
    ],
    'BANKNIFTY': [
      'HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'KOTAKBANK.NS', 'AXISBANK.NS',
      'INDUSINDBK.NS', 'BANKBARODA.NS', 'PNB.NS', 'IDFCFIRSTB.NS', 'FEDERALBNK.NS',
      'AUBANK.NS', 'BANDHANBNK.NS'
    ]
  }

  const symbols = indexConstituents[index] || []
  const members = []

  // Fetch current prices for a subset of symbols (top 15) to avoid too many API calls
  const topSymbols = symbols.slice(0, 15)
  
  for (const symbol of topSymbols) {
    try {
      const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`)
      const data = await response.json()
      
      if (data.chart?.result?.[0]) {
        const result = data.chart.result[0]
        const meta = result.meta
        const currentPrice = meta.regularMarketPrice || meta.previousClose
        const change = meta.regularMarketPrice - meta.previousClose
        const changePercent = (change / meta.previousClose) * 100

        members.push({
          symbol: symbol,
          name: meta.longName || symbol.replace(/\.(NS|BO)$/, ''),
          price: currentPrice?.toFixed(2) || 'N/A',
          change: change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2),
          changePercent: change >= 0 ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`,
          weight: calculateWeight(symbol, index), // Calculate or use predefined weights
          currency: meta.currency || 'INR',
          exchange: meta.exchangeName || (symbol.endsWith('.NS') ? 'NSE' : 'BSE')
        })
      }
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error)
      // Add fallback data if API fails
      members.push({
        symbol: symbol,
        name: symbol.replace(/\.(NS|BO)$/, ''),
        price: 'N/A',
        change: 'N/A',
        changePercent: 'N/A',
        weight: calculateWeight(symbol, index),
        currency: 'INR',
        exchange: symbol.endsWith('.NS') ? 'NSE' : 'BSE'
      })
    }
  }

  return members
}

function calculateWeight(symbol, index) {
  // Predefined weights for major stocks (approximate values)
  const weights = {
    'NIFTY50': {
      'RELIANCE.NS': '8.5%',
      'TCS.NS': '7.2%',
      'HDFCBANK.NS': '6.8%',
      'BHARTIARTL.NS': '5.1%',
      'ICICIBANK.NS': '4.9%',
      'INFY.NS': '4.7%',
      'SBIN.NS': '4.2%',
      'LT.NS': '3.8%',
      'ITC.NS': '3.5%',
      'HINDUNILVR.NS': '3.2%',
      'KOTAKBANK.NS': '3.0%',
      'HCLTECH.NS': '2.8%',
      'WIPRO.NS': '2.6%',
      'MARUTI.NS': '2.4%',
      'ASIANPAINT.NS': '2.2%'
    },
    'SENSEX': {
      'RELIANCE.BO': '9.2%',
      'TCS.BO': '7.8%',
      'HDFCBANK.BO': '7.1%',
      'INFY.BO': '5.3%',
      'ICICIBANK.BO': '5.1%',
      'BHARTIARTL.BO': '4.8%',
      'SBIN.BO': '4.5%',
      'LT.BO': '4.2%',
      'ITC.BO': '3.9%',
      'KOTAKBANK.BO': '3.6%',
      'HINDUNILVR.BO': '3.3%',
      'HCLTECH.BO': '3.0%',
      'MARUTI.BO': '2.8%',
      'ASIANPAINT.BO': '2.5%',
      'WIPRO.BO': '2.3%'
    },
    'BANKNIFTY': {
      'HDFCBANK.NS': '19.5%',
      'ICICIBANK.NS': '18.2%',
      'SBIN.NS': '15.8%',
      'KOTAKBANK.NS': '12.4%',
      'AXISBANK.NS': '11.2%',
      'INDUSINDBK.NS': '8.6%',
      'BANKBARODA.NS': '6.8%',
      'PNB.NS': '4.2%',
      'IDFCFIRSTB.NS': '2.1%',
      'FEDERALBNK.NS': '1.2%'
    }
  }

  return weights[index]?.[symbol] || '1.0%'
}
