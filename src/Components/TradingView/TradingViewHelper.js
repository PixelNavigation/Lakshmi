// Helper function to convert API symbols to TradingView-compatible symbols
export const convertToTradingViewSymbol = (symbol) => {
  // Handle Indian stocks - remove .NS and .BO suffixes
  if (symbol.includes('.NS')) {
    const baseSymbol = symbol.replace('.NS', '')
    
    // Common Indian stock mappings (API symbol -> TradingView symbol)
    const indianStockMappings = {
      'SBIN': 'SBIN',         // State Bank of India
      'RELIANCE': 'RELIANCE', // Reliance Industries
      'TCS': 'TCS',           // Tata Consultancy Services
      'INFY': 'INFY',         // Infosys
      'HINDUNILVR': 'HINDUNILVR', // Hindustan Unilever
      'ICICIBANK': 'ICICIBANK',   // ICICI Bank
      'HDFCBANK': 'HDFCBANK',     // HDFC Bank
      'ITC': 'ITC',               // ITC Limited
      'LT': 'LT',                 // Larsen & Toubro
      'BHARTIARTL': 'BHARTIARTL', // Bharti Airtel
      'HCLTECH': 'HCLTECH',       // HCL Technologies
      'MARUTI': 'MARUTI',         // Maruti Suzuki
      'ASIANPAINT': 'ASIANPAINT', // Asian Paints
      'NESTLEIND': 'NESTLEIND',   // Nestle India
      'KOTAKBANK': 'KOTAKBANK',   // Kotak Mahindra Bank
      'BAJFINANCE': 'BAJFINANCE', // Bajaj Finance
      'TITAN': 'TITAN',           // Titan Company
      'TECHM': 'TECHM',           // Tech Mahindra
      'POWERGRID': 'POWERGRID',   // Power Grid Corporation
      'NTPC': 'NTPC',             // NTPC Limited
      'ULTRACEMCO': 'ULTRACEMCO', // UltraTech Cement
      'ONGC': 'ONGC',             // Oil and Natural Gas Corporation
      'SUNPHARMA': 'SUNPHARMA',   // Sun Pharmaceutical
      'TATAMOTORS': 'TATAMOTORS', // Tata Motors
      'TATASTEEL': 'TATASTEEL',   // Tata Steel
      'JSWSTEEL': 'JSWSTEEL',     // JSW Steel
      'HINDALCO': 'HINDALCO',     // Hindalco Industries
      'COALINDIA': 'COALINDIA',   // Coal India
      'DRREDDY': 'DRREDDY',       // Dr. Reddy's Laboratories
      'EICHERMOT': 'EICHERMOT',   // Eicher Motors
      'BAJAJFINSV': 'BAJAJFINSV', // Bajaj Finserv
      'WIPRO': 'WIPRO',           // Wipro
      'ADANIPORTS': 'ADANIPORTS', // Adani Ports
      'HEROMOTOCO': 'HEROMOTOCO', // Hero MotoCorp
      'CIPLA': 'CIPLA',           // Cipla
      'GRASIM': 'GRASIM',         // Grasim Industries
      'SHREECEM': 'SHREECEM',     // Shree Cement
      'DIVISLAB': 'DIVISLAB',     // Divi's Laboratories
      'BRITANNIA': 'BRITANNIA',   // Britannia Industries
      'BPCL': 'BPCL',             // Bharat Petroleum
      'IOC': 'IOC',               // Indian Oil Corporation
      'AXISBANK': 'AXISBANK',     // Axis Bank
      'NCC': 'NCC',               // NCC Limited
      'TATAPOWER': 'TATAPOWER',   // Tata Power
      'SAIL': 'SAIL',             // Steel Authority of India
      'PNB': 'PNB',               // Punjab National Bank
      'BANKBARODA': 'BANKBARODA', // Bank of Baroda
      'CANBK': 'CANBK',           // Canara Bank
      'UNIONBANK': 'UNIONBANK',   // Union Bank of India
      'INDUSINDBK': 'INDUSINDBK', // IndusInd Bank
      'FEDERALBNK': 'FEDERALBNK', // Federal Bank
      'YESBANK': 'YESBANK',       // Yes Bank
      'RBLBANK': 'RBLBANK',       // RBL Bank
      'BANDHANBNK': 'BANDHANBNK', // Bandhan Bank
      'IDFCFIRSTB': 'IDFCFIRSTB', // IDFC First Bank
      'AUBANK': 'AUBANK',         // AU Small Finance Bank
    }
    
    return indianStockMappings[baseSymbol.toUpperCase()] || baseSymbol
  } 
  else if (symbol.includes('.BO')) {
    const baseSymbol = symbol.replace('.BO', '')
    return baseSymbol
  }
  
  // Handle crypto currencies - remove currency suffixes
  if (symbol.includes('-USD')) {
    return symbol.replace('-USD', '')
  } else if (symbol.includes('-INR')) {
    return symbol.replace('-INR', '')
  }
  
  // For US stocks, return as-is
  return symbol
}

// Helper function to get the display name for a symbol
export const getDisplayName = (originalSymbol, tradingViewSymbol) => {
  // If they're different, show both
  if (originalSymbol !== tradingViewSymbol) {
    return `${tradingViewSymbol} (${originalSymbol})`
  }
  return tradingViewSymbol
}

// Helper function to check if a symbol needs conversion
export const needsConversion = (symbol) => {
  return symbol.includes('.NS') || symbol.includes('.BO') || symbol.includes('-USD') || symbol.includes('-INR')
}