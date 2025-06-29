// Test script to verify live price fetching
const testStocks = [
  'RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'SBIN.NS'
]

async function testLivePrices() {
  console.log('Testing live price fetching...')
  
  for (const symbol of testStocks) {
    try {
      const response = await fetch(`http://localhost:3001/api/stock-detail?symbol=${symbol}`)
      const data = await response.json()
      
      if (data.success) {
        console.log(`${symbol}:`, {
          price: `₹${data.data.price}`,
          change: `${data.data.change >= 0 ? '+' : ''}${data.data.change}`,
          changePercent: `${data.data.changePercent >= 0 ? '+' : ''}${data.data.changePercent.toFixed(2)}%`,
          isRealData: data.data.isRealData
        })
      } else {
        console.error(`Failed to fetch ${symbol}:`, data.error)
      }
    } catch (error) {
      console.error(`Error fetching ${symbol}:`, error)
    }
  }
}

// Test multiple times to see price variations
console.log('=== Testing Real-time Price Fetching ===')
testLivePrices()

setTimeout(() => {
  console.log('\n=== Second Test (30 seconds later) ===')
  testLivePrices()
}, 30000)
