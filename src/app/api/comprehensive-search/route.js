import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const market = searchParams.get('market') || 'ALL'
    const limit = parseInt(searchParams.get('limit')) || 25

    if (!query || query.length < 1) {
      return NextResponse.json({ success: false, error: 'Query required' })
    }

    const queryUpper = query.toUpperCase().trim()
    let searchResults = []

    // Method 1: Try Yahoo Finance first (better for Indian stocks)
    try {
      const yahooResponse = await fetch(
        `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=50&newsCount=0`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json'
          },
          timeout: 8000
        }
      )
      
      if (yahooResponse.ok) {
        const yahooData = await yahooResponse.json()
        if (yahooData.quotes && yahooData.quotes.length > 0) {
          // Filter to only include Indian stocks and crypto
          const filteredQuotes = yahooData.quotes.filter(quote => {
            const symbol = quote.symbol || ''
            
            // Allow Indian stocks (NSE/BSE)
            if (symbol.includes('.NS') || symbol.includes('.BO')) {
              return true
            }
            
            // Allow crypto pairs with INR
            if (symbol.includes('-INR') || symbol.includes('INR=X')) {
              return true
            }
            
            // Allow major crypto symbols (BTC, ETH, etc.)
            const cryptoSymbols = ['BTC-USD', 'ETH-USD', 'BNB-USD', 'ADA-USD', 'DOT-USD', 'MATIC-USD', 'SOL-USD', 'AVAX-USD']
            if (cryptoSymbols.includes(symbol)) {
              return true
            }
            
            // Filter out all other foreign stocks
            return false
          })
          
          searchResults = filteredQuotes.slice(0, 30).map(quote => ({
            symbol: quote.symbol,
            name: quote.longname || quote.shortname || quote.symbol,
            type: quote.typeDisp || 'stock',
            region: quote.exchDisp || (quote.symbol.includes('.NS') || quote.symbol.includes('.BO') ? 'India' : 'Crypto'),
            currency: quote.currency || (quote.symbol.includes('.NS') || quote.symbol.includes('.BO') ? 'INR' : 'INR'),
            exchange: quote.exchange,
            marketCap: quote.marketCap,
            source: 'yahoo'
          }))
        }
      }
    } catch (error) {
      console.log('Yahoo Finance search failed:', error.message)
    }

    // Method 2: Try Finnhub if Yahoo fails
    if (searchResults.length === 0) {
      try {
        const finnhubResponse = await fetch(
          `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=demo`,
          { 
            headers: { 'X-Finnhub-Token': 'demo' },
            timeout: 5000 
          }
        )
        
        if (finnhubResponse.ok) {
          const finnhubData = await finnhubResponse.json()
          if (finnhubData.result && finnhubData.result.length > 0) {
            searchResults = finnhubData.result.slice(0, 20).map(stock => ({
              symbol: stock.symbol,
              name: stock.description,
              type: stock.type || 'stock',
              region: 'Global',
              currency: 'INR',
              source: 'finnhub'
            }))
          }
        }
      } catch (error) {
        console.log('Finnhub search failed:', error.message)
      }
    }

    // Method 3: Try Alpha Vantage (fallback)
    if (searchResults.length === 0) {
      try {
        const alphaResponse = await fetch(
          `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=demo`,
          { timeout: 5000 }
        )
        
        if (alphaResponse.ok) {
          const alphaData = await alphaResponse.json()
          if (alphaData.bestMatches && alphaData.bestMatches.length > 0) {
            searchResults = alphaData.bestMatches.slice(0, 20).map(match => ({
              symbol: match['1. symbol'],
              name: match['2. name'],
              type: match['3. type'] || 'stock',
              region: match['4. region'],
              currency: match['8. currency'] || 'INR',
              source: 'alphavantage'
            }))
          }
        }
      } catch (error) {
        console.log('Alpha Vantage search failed:', error.message)
      }
    }

    // Enhanced API search for better global coverage
    if (searchResults.length < 5) {
      try {
        // Enhanced search with market-specific suffixes for Indian stocks
        const enhancedQueries = [query]
        if (market === 'NSE' || market === 'ALL') {
          enhancedQueries.push(`${query}.NS`, `${query}.NSE`)
        }
        if (market === 'BSE' || market === 'ALL') {
          enhancedQueries.push(`${query}.BO`, `${query}.BSE`)
        }
        
        for (const enhancedQuery of enhancedQueries) {
          if (searchResults.length >= 25) break
          
          try {
            const yahooEnhancedResponse = await fetch(
              `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(enhancedQuery)}&quotesCount=50&newsCount=0`,
              {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                  'Accept': 'application/json'
                },
                timeout: 8000
              }
            )
            
            if (yahooEnhancedResponse.ok) {
              const yahooData = await yahooEnhancedResponse.json()
              if (yahooData.quotes && yahooData.quotes.length > 0) {
                const newResults = yahooData.quotes.map(quote => ({
                  symbol: quote.symbol,
                  name: quote.longname || quote.shortname || quote.symbol,
                  type: quote.typeDisp || 'stock',
                  region: quote.exchDisp || (quote.symbol.includes('.NS') || quote.symbol.includes('.BO') ? 'India' : 'Global'),
                  currency: quote.currency || (quote.symbol.includes('.NS') || quote.symbol.includes('.BO') ? 'INR' : 'INR'),
                  exchange: quote.exchange,
                  source: 'yahoo'
                }))
                
                // Add unique results only
                newResults.forEach(newResult => {
                  if (!searchResults.find(existing => existing.symbol === newResult.symbol)) {
                    searchResults.push(newResult)
                  }
                })
              }
            }
          } catch (error) {
            console.log(`Enhanced Yahoo search failed for ${enhancedQuery}:`, error.message)
          }
        }
      } catch (error) {
        console.log('Enhanced search failed:', error.message)
      }
    }

    // Remove duplicates and filter by market if specified
    let uniqueResults = searchResults.filter((stock, index, self) => 
      index === self.findIndex(s => s.symbol === stock.symbol)
    )

    // Filter by specific market if requested
    if (market !== 'ALL') {
      if (market === 'NSE') {
        uniqueResults = uniqueResults.filter(stock => 
          stock.symbol.includes('.NS') || stock.region === 'India' || stock.exchange === 'NSI'
        )
      } else if (market === 'BSE') {
        uniqueResults = uniqueResults.filter(stock => 
          stock.symbol.includes('.BO') || stock.region === 'India' || stock.exchange === 'BSE'
        )
      }
    } else {
      // For "ALL" market, only show Indian stocks and cryptocurrencies
      uniqueResults = uniqueResults.filter(stock => {
        const isIndianStock = stock.symbol.includes('.NS') || 
                             stock.symbol.includes('.BO') || 
                             stock.region === 'India' || 
                             stock.exchange === 'NSE' || 
                             stock.exchange === 'BSE' ||
                             stock.exchange === 'NSI'
        
        const isCrypto = stock.symbol.includes('-INR') || 
                        stock.type === 'crypto' || 
                        stock.type === 'cryptocurrency' ||
                        (stock.symbol.match(/^(BTC|ETH|DOGE|ADA|SOL|XRP|BNB|MATIC|DOT|LINK|LTC|UNI|AVAX|SHIB|TRX|ATOM|FIL|ICP|VET)/i) && !stock.symbol.includes('.'))
        
        return isIndianStock || isCrypto
      })
    }

    // Sort by relevance
    const sortedResults = uniqueResults.sort((a, b) => {
      const aExactSymbol = a.symbol.toUpperCase() === queryUpper
      const bExactSymbol = b.symbol.toUpperCase() === queryUpper
      const aStartsWithSymbol = a.symbol.toUpperCase().startsWith(queryUpper)
      const bStartsWithSymbol = b.symbol.toUpperCase().startsWith(queryUpper)
      const aIncludesSymbol = a.symbol.toUpperCase().includes(queryUpper)
      const bIncludesSymbol = b.symbol.toUpperCase().includes(queryUpper)
      const aIncludesName = a.name.toUpperCase().includes(queryUpper)
      const bIncludesName = b.name.toUpperCase().includes(queryUpper)
      
      if (aExactSymbol && !bExactSymbol) return -1
      if (!aExactSymbol && bExactSymbol) return 1
      if (aStartsWithSymbol && !bStartsWithSymbol) return -1
      if (!aStartsWithSymbol && bStartsWithSymbol) return 1
      if (aIncludesSymbol && !bIncludesSymbol) return -1
      if (!aIncludesSymbol && bIncludesSymbol) return 1
      if (aIncludesName && !bIncludesName) return -1
      if (!aIncludesName && bIncludesName) return 1
      
      return 0
    })

    const finalResults = sortedResults.slice(0, limit)

    return NextResponse.json({ 
      success: true, 
      data: finalResults,
      total: finalResults.length,
      query: query,
      market: market,
      sources: [...new Set(finalResults.map(r => r.source))]
    })

  } catch (error) {
    console.error('Comprehensive search error:', error)
    
    return NextResponse.json({ 
      success: false, 
      error: 'Search failed - please try a different query',
      data: []
    })
  }
}
