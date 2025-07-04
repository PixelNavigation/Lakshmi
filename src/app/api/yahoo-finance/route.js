import { NextResponse } from 'next/server'
import yahooFinance from 'yahoo-finance2'

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS(request) {
  return new Response(null, { status: 200, headers: corsHeaders })
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    const timeframe = searchParams.get('timeframe') || 'live' // live, 1d, 5d, 1m, 6m, 1y
    const interval = searchParams.get('interval') || '1m' // 1m, 5m, 15m, 30m, 1h, 1d

    if (!symbol) {
      return NextResponse.json({ 
        success: false, 
        error: 'Symbol parameter is required' 
      }, { headers: corsHeaders })
    }

    // Format the Yahoo Finance symbol
    let yahooSymbol = formatYahooSymbol(symbol)
    
    try {
      if (timeframe === 'live') {
        // Get real-time quote data
        const quote = await yahooFinance.quote(yahooSymbol)
        
        // Format the current time
        const currentTime = new Date()
        const formattedTime = formatTime(currentTime)
        
        return NextResponse.json({
          success: true,
          data: {
            symbol: symbol,
            price: quote.regularMarketPrice,
            change: quote.regularMarketChange,
            changePercent: quote.regularMarketChangePercent,
            time: formattedTime,
            timestamp: currentTime.getTime(),
            previousClose: quote.regularMarketPreviousClose,
            open: quote.regularMarketOpen,
            dayHigh: quote.regularMarketDayHigh,
            dayLow: quote.regularMarketDayLow,
            volume: quote.regularMarketVolume
          }
        }, { headers: corsHeaders })
      } else {
        // Get historical data
        console.log(`Fetching historical data for ${yahooSymbol} with timeframe ${timeframe}`)
        
        const period = getPeriodForTimeframe(timeframe)
        
        const result = await yahooFinance.historical(yahooSymbol, {
          period1: period.start,
          period2: period.end,
          interval: interval
        })
        
        console.log(`Yahoo Finance returned ${result.length} data points for ${yahooSymbol}`)
        
        // Format the data with time information and filter null values
        const chartData = result.map(entry => {
          const entryDate = entry.date
          return {
            date: entryDate.toISOString().split('T')[0],
            time: formatTime(entryDate),
            timestamp: entryDate.getTime(),
            open: entry.open,
            high: entry.high,
            low: entry.low,
            close: entry.close,
            volume: entry.volume
          }
        }).filter(entry => 
          // Filter out entries with null/undefined values
          entry.open !== null && entry.high !== null && 
          entry.low !== null && entry.close !== null &&
          !isNaN(entry.open) && !isNaN(entry.high) &&
          !isNaN(entry.low) && !isNaN(entry.close)
        )
        
        console.log(`After filtering: ${chartData.length} valid data points for ${yahooSymbol}`)
        
        if (chartData.length === 0) {
          console.warn(`No valid historical data available for ${symbol}`)
          return NextResponse.json({
            success: false,
            error: `No valid historical data available for ${symbol}`,
            errorDetails: `Yahoo Finance returned ${result.length} data points but none were valid`
          }, { headers: corsHeaders })
        }
        
        return NextResponse.json({
          success: true,
          data: chartData,
          symbol: symbol,
          timeframe: timeframe,
          interval: interval
        }, { headers: corsHeaders })
      }
    } catch (error) {
      console.error(`Error fetching Yahoo Finance data for ${symbol}:`, error)
      
      return NextResponse.json({
        success: false,
        error: `Failed to fetch data for ${symbol}`,
        errorDetails: error.message,
        yahooSymbol: yahooSymbol
      }, { headers: corsHeaders })
    }
  } catch (error) {
    console.error('Yahoo Finance API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process request' 
    }, { headers: corsHeaders })
  }
}

// Helper function to format symbol for Yahoo Finance
function formatYahooSymbol(symbol) {
  // For Indian indices
  if (symbol === 'NIFTY50' || symbol === 'NIFTY') {
    return '^NSEI'
  }
  if (symbol === 'SENSEX') {
    return '^BSESN'
  }
  if (symbol === 'BANKNIFTY') {
    return '^NSEBANK'
  }
  
  // For Indian stocks
  if (symbol.includes('NSE:')) {
    return symbol.replace('NSE:', '') + '.NS'
  }
  if (symbol.includes('BSE:')) {
    return symbol.replace('BSE:', '') + '.BO'
  }
  
  // Handle standard stock symbols with exchange suffixes
  if (symbol.includes('.NS') || symbol.includes('.BO')) {
    return symbol // Already formatted for Yahoo
  }
  
  // Common Indian stocks - add NSE suffix by default
  // This list includes the most common Indian stocks that should get .NS suffix
  const commonIndianStocks = [
    'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HDFC', 'ICICIBANK', 'KOTAKBANK', 'SBIN', 'LT',
    'AXISBANK', 'BHARTIARTL', 'ITC', 'ASIANPAINT', 'MARUTI', 'BAJFINANCE', 'HCLTECH', 'WIPRO',
    'ULTRACEMCO', 'TITAN', 'SUNPHARMA', 'POWERGRID', 'NTPC', 'ONGC', 'TATASTEEL', 'TECHM',
    'NESTLEIND', 'COALINDIA', 'HINDALCO', 'GRASIM', 'BPCL', 'DRREDDY', 'EICHERMOT', 'CIPLA',
    'HEROMOTOCO', 'BAJAJFINSV', 'BRITANNIA', 'SHREECEM', 'DIVISLAB', 'TATACONSUM', 'JSWSTEEL',
    'APOLLOHOSP', 'INDUSINDBK', 'ADANIENT', 'TATAMOTORS', 'NCC', 'ZOMATO', 'NYKAA', 'PAYTM',
    'POLICYBZR', 'DMART'
  ]
  
  // If the symbol looks like an Indian stock (all caps, 2-10 characters)
  // or is in our common list, append .NS
  if (commonIndianStocks.includes(symbol) || 
      (/^[A-Z]{2,10}$/.test(symbol) && !symbol.startsWith('^'))) {
    return symbol + '.NS'
  }
  
  // Default case - return as is
  return symbol
}

// Helper function to format time in user-friendly format
function formatTime(date) {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  
  // Convert to 12-hour format
  const formattedHours = hours % 12 || 12
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes
  
  return `${formattedHours}:${formattedMinutes} ${ampm}`
}

// Helper function to get date periods for timeframes
function getPeriodForTimeframe(timeframe) {
  const end = new Date()
  let start = new Date()
  
  switch (timeframe) {
    case '1d':
      start.setDate(start.getDate() - 1)
      break
    case '5d':
      start.setDate(start.getDate() - 5)
      break
    case '1m':
    case '1mo':
      start.setMonth(start.getMonth() - 1)
      break
    case '3m':
    case '3mo':
      start.setMonth(start.getMonth() - 3)
      break
    case '6m':
    case '6mo':
      start.setMonth(start.getMonth() - 6)
      break
    case '1y':
      start.setFullYear(start.getFullYear() - 1)
      break
    default:
      start.setDate(start.getDate() - 1) // Default to 1 day
  }
  
  return {
    start: start,
    end: end
  }
}
