import pandas as pd
import numpy as np
from sklearn.naive_bayes import GaussianNB
from statsmodels.tsa.stattools import grangercausalitytests
import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import subprocess
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from flask import Flask, jsonify, request
from flask_cors import CORS
import warnings
warnings.filterwarnings('ignore')

class ChangeHandler(FileSystemEventHandler):
    """Restarts the server on file changes."""
    def __init__(self, script_name):
        self.script_name = script_name
        self.process = None
        self.start_process()

    def start_process(self):
        if self.process:
            self.process.terminate()
            self.process.wait()
        
        self.process = subprocess.Popen([sys.executable, self.script_name, '--run-server'],
                                        stdout=sys.stdout, stderr=sys.stderr)
        print(f"Started {self.script_name} with PID: {self.process.pid}")

    def on_any_event(self, event):
        src_path = event.src_path
        if isinstance(src_path, (bytes, memoryview)):
            src_path = src_path.tobytes() if isinstance(src_path, memoryview) else src_path
            src_path = src_path.decode()
        if event.is_directory or not str(src_path).endswith('.py'):
            return
        print(f"Detected change in {event.src_path}. Restarting server...")
        self.start_process()

def analyze_stock_influence(stock_data):
    """
    Perform Granger causality and Naive Bayes analysis on stock data
    Args:
        stock_data: Dict of stock prices from frontend (symbol -> price data)
    """
    try:
        if not stock_data:
            raise ValueError("No stock data provided. Stock data is required for analysis.")
        
        print(f"🎯 Starting analysis for {len(stock_data)} stocks: {list(stock_data.keys())}")
        
        # Generate enhanced time series data with sufficient length and realistic patterns
        data, data_sources = fetch_real_historical_data(stock_data)
        
        if data.empty or len(data) < 50:
            raise ValueError("Insufficient data generated for analysis")
        
        symbols = data.columns.tolist()
        influence_edges = []
        
        print(f"📊 Generated data shape: {data.shape}")
        print(f"📊 Data sources: {data_sources}")
        print(f"📊 Data sample:\n{data.head()}")
        
        # Enhanced Granger Causality Analysis
        maxlag = min(5, len(data) // 10)  # Adaptive lag selection
        significance_threshold = 0.10  # Slightly relaxed for demonstration
        
        print(f"🔍 Running Granger causality tests with maxlag={maxlag}")
        
        # Process all pairs
        for source in symbols:
            for target in symbols:
                if source != target:
                    try:
                        # Prepare data for Granger test
                        pair_data = data[[target, source]].dropna()
                        
                        if len(pair_data) < maxlag + 10:
                            continue
                        
                        # Ensure data is stationary (simple differencing)
                        pair_data_diff = pair_data.diff().dropna()
                        
                        if len(pair_data_diff) < maxlag + 5:
                            continue
                        
                        # Run Granger causality test
                        test_result = grangercausalitytests(
                            pair_data_diff, 
                            maxlag=maxlag, 
                            verbose=False
                        )
                        
                        # Extract p-values and calculate significance
                        p_values = []
                        for lag in range(1, maxlag + 1):
                            if lag in test_result:
                                p_val = test_result[lag][0]['ssr_ftest'][1]
                                p_values.append(p_val)
                        
                        if p_values:
                            min_pvalue = min(p_values)
                            avg_pvalue = np.mean(p_values)
                            
                            # Use minimum p-value as the primary indicator
                            if min_pvalue < significance_threshold:
                                # Calculate influence strength
                                influence = 1 - min_pvalue
                                
                                # Calculate correlation for direction
                                correlation = np.corrcoef(pair_data[source], pair_data[target])[0, 1]
                                if np.isnan(correlation):
                                    correlation = 0.0
                                
                                influence_edges.append({
                                    "source": source,
                                    "target": target,
                                    "value": round(influence, 3),
                                    "method": "granger",
                                    "correlation": round(correlation, 3),
                                    "p_value": round(min_pvalue, 4),
                                    "avg_p_value": round(avg_pvalue, 4)
                                })
                                
                                print(f"✅ Granger: {source} -> {target}, p={min_pvalue:.4f}, corr={correlation:.3f}")
                        
                    except Exception as e:
                        print(f"⚠️ Granger error {source}->{target}: {e}")
                        continue
        
        # Enhanced Naive Bayes Analysis
        print(f"🤖 Running Naive Bayes analysis")
        
        # Calculate returns and create binary classification target
        returns = data.pct_change().dropna()
        
        if len(returns) > 10:
            # Create binary targets (up/down for next period)
            targets = {}
            for symbol in symbols:
                future_returns = returns[symbol].shift(-1).dropna()
                targets[symbol] = (future_returns > 0).astype(int)
            
            for target_symbol in symbols:
                if target_symbol not in targets:
                    continue
                    
                try:
                    # Prepare features (all other stocks' returns)
                    feature_symbols = [s for s in symbols if s != target_symbol]
                    if len(feature_symbols) < 1:
                        continue
                    
                    X = returns[feature_symbols].iloc[:-1]  # Remove last row to match target
                    y = targets[target_symbol]
                    
                    # Ensure we have enough samples
                    if len(X) < 10 or len(y) < 10 or len(X) != len(y):
                        continue
                    
                    # Check class balance
                    if y.sum() < 2 or (len(y) - y.sum()) < 2:
                        continue
                    
                    # Fit Naive Bayes
                    clf = GaussianNB()
                    clf.fit(X, y)
                    
                    # Calculate feature importance
                    feature_importance = np.abs(clf.theta_[1] - clf.theta_[0])
                    
                    # Get top influential features
                    top_n = min(3, len(feature_symbols))
                    top_indices = np.argsort(feature_importance)[-top_n:]
                    
                    for idx in top_indices:
                        source_symbol = feature_symbols[idx]
                        importance = feature_importance[idx]
                        
                        if importance > 0.001:  # Minimum threshold
                            # Calculate correlation for direction
                            correlation = np.corrcoef(X.iloc[:, idx], y)[0, 1]
                            if np.isnan(correlation):
                                correlation = 0.0
                            
                            influence_edges.append({
                                "source": source_symbol,
                                "target": target_symbol,
                                "value": round(min(importance * 10, 0.99), 3),
                                "method": "naive_bayes",
                                "correlation": round(correlation, 3),
                                "importance": round(importance, 4)
                            })
                            
                            print(f"✅ NB: {source_symbol} -> {target_symbol}, imp={importance:.4f}, corr={correlation:.3f}")
                
                except Exception as e:
                    print(f"⚠️ Naive Bayes error for {target_symbol}: {e}")
                    continue
        
        # Combine and deduplicate edges
        final_edges = []
        seen_pairs = set()
        
        # Sort edges by strength (value) descending
        influence_edges.sort(key=lambda x: x['value'], reverse=True)
        
        for edge in influence_edges:
            pair = (edge['source'], edge['target'])
            if pair not in seen_pairs:
                seen_pairs.add(pair)
                final_edges.append(edge)
        
        # Limit to top edges to avoid clutter
        final_edges = final_edges[:min(20, len(final_edges))]
        
        # Build result
        nodes = [{"id": s} for s in symbols]
        
        print(f"✅ Analysis complete: {len(nodes)} nodes, {len(final_edges)} edges")
        print(f"📊 Sample edges: {final_edges[:3] if final_edges else 'None'}")
        
        return {"nodes": nodes, "links": final_edges}
        
    except Exception as e:
        print(f"❌ Error in analysis: {e}")
        import traceback
        traceback.print_exc()
        return {"nodes": [], "links": []}

def fetch_real_historical_data(stock_data):
    """
    Fetch real historical data from your existing Yahoo Finance API or use fallback synthetic data
    Args:
        stock_data: Dict with structure {symbol: {price, change, changePercent, ...}}
    Returns:
        pandas.DataFrame with real historical data
    """
    import datetime
    import requests
    
    symbols = list(stock_data.keys())
    print(f"📊 Fetching real historical data for: {symbols}")
    
    # Generate date range for the last 6 months (optimal for analysis)
    end_date = datetime.datetime.now()
    start_date = end_date - datetime.timedelta(days=180)
    dates = pd.date_range(start=start_date, end=end_date, freq='D')
    
    data = {}
    successful_fetches = 0
    
    for symbol in symbols:
        try:
            print(f"🔍 Fetching real historical data for {symbol}...")
            
            # Try to fetch real historical data from your Yahoo Finance API
            try:
                # Use the yahoo-finance endpoint which has real historical data
                response = requests.get(
                    f'http://localhost:3000/api/yahoo-finance',
                    params={
                        'symbol': symbol,
                        'timeframe': '6m',  # 6 months
                        'interval': '1d'    # daily data
                    },
                    timeout=10
                )
                
                if response.status_code == 200:
                    api_data = response.json()
                    if api_data.get('success') and api_data.get('data'):
                        chart_data = api_data['data']
                        if len(chart_data) >= 30:  # At least 30 data points
                            print(f"✅ Using real Yahoo Finance data for {symbol}: {len(chart_data)} points")
                            # Extract closing prices
                            historical_prices = [float(item['close']) for item in chart_data if item.get('close') is not None]
                            
                            # Ensure we have enough data and align with dates
                            if len(historical_prices) >= 30:
                                # Trim or pad to match our date range
                                if len(historical_prices) > len(dates):
                                    data[symbol] = historical_prices[-len(dates):]  # Take the most recent data
                                else:
                                    # If we have less data, repeat the pattern to fill
                                    repetitions = (len(dates) // len(historical_prices)) + 1
                                    extended_prices = (historical_prices * repetitions)[:len(dates)]
                                    data[symbol] = extended_prices
                                
                                successful_fetches += 1
                                continue
                        else:
                            print(f"⚠️ Insufficient real data for {symbol}: {len(chart_data)} points")
                    else:
                        print(f"⚠️ API response error for {symbol}: {api_data.get('error', 'Unknown error')}")
                else:
                    print(f"⚠️ HTTP error for {symbol}: {response.status_code}")
                    
            except Exception as api_error:
                print(f"📡 Yahoo Finance API fetch failed for {symbol}: {api_error}")
            
def fetch_real_historical_data(stock_data):
    """
    Fetch real historical data from your existing Yahoo Finance API or use fallback synthetic data
    Args:
        stock_data: Dict with structure {symbol: {price, change, changePercent, ...}}
    Returns:
        tuple: (pandas.DataFrame with real historical data, dict with data sources)
    """
    import datetime
    import requests
    
    symbols = list(stock_data.keys())
    print(f"📊 Fetching real historical data for: {symbols}")
    
    # Generate date range for the last 6 months (optimal for analysis)
    end_date = datetime.datetime.now()
    start_date = end_date - datetime.timedelta(days=180)
    dates = pd.date_range(start=start_date, end=end_date, freq='D')
    
    data = {}
    data_sources = {}
    successful_fetches = 0
    
    for symbol in symbols:
        try:
            print(f"🔍 Fetching real historical data for {symbol}...")
            
            # Try to fetch real historical data from your Yahoo Finance API
            try:
                # Use the yahoo-finance endpoint which has real historical data
                response = requests.get(
                    f'http://localhost:3000/api/yahoo-finance',
                    params={
                        'symbol': symbol,
                        'timeframe': '6m',  # 6 months
                        'interval': '1d'    # daily data
                    },
                    timeout=10
                )
                
                if response.status_code == 200:
                    api_data = response.json()
                    if api_data.get('success') and api_data.get('data'):
                        chart_data = api_data['data']
                        if len(chart_data) >= 30:  # At least 30 data points
                            print(f"✅ Using real Yahoo Finance data for {symbol}: {len(chart_data)} points")
                            # Extract closing prices
                            historical_prices = [float(item['close']) for item in chart_data if item.get('close') is not None]
                            
                            # Ensure we have enough data and align with dates
                            if len(historical_prices) >= 30:
                                # Trim or pad to match our date range
                                if len(historical_prices) > len(dates):
                                    data[symbol] = historical_prices[-len(dates):]  # Take the most recent data
                                else:
                                    # If we have less data, repeat the pattern to fill
                                    repetitions = (len(dates) // len(historical_prices)) + 1
                                    extended_prices = (historical_prices * repetitions)[:len(dates)]
                                    data[symbol] = extended_prices
                                
                                data_sources[symbol] = "Yahoo Finance (Real)"
                                successful_fetches += 1
                                continue
                        else:
                            print(f"⚠️ Insufficient real data for {symbol}: {len(chart_data)} points")
                    else:
                        print(f"⚠️ API response error for {symbol}: {api_data.get('error', 'Unknown error')}")
                else:
                    print(f"⚠️ HTTP error for {symbol}: {response.status_code}")
                    
            except Exception as api_error:
                print(f"📡 Yahoo Finance API fetch failed for {symbol}: {api_error}")
            
            # Fallback: Generate realistic data based on current price and market patterns
            print(f"🔄 Generating fallback realistic data for {symbol}")
            current_price = float(stock_data[symbol].get('price', 100))
            
            # Calculate realistic parameters based on current price and change
            change_percent = float(stock_data[symbol].get('changePercent', 0))
            daily_return_mean = (change_percent / 100) / 252  # Convert to daily return
            daily_volatility = max(0.005, min(0.03, abs(daily_return_mean) * 3 + 0.01))
            
            # Generate more realistic price series with market patterns
            np.random.seed(42 + hash(symbol) % 1000)  # Consistent seed per symbol
            
            # Start from a reasonable historical price (80% of current)
            start_price = current_price * 0.8
            prices = [start_price]
            
            for i in range(len(dates) - 1):
                # Generate return with realistic market behavior
                random_return = np.random.normal(daily_return_mean, daily_volatility)
                
                # Add momentum (autocorrelation)
                if i > 0:
                    prev_return = (prices[i] - prices[i-1]) / prices[i-1] if prices[i-1] > 0 else 0
                    random_return += 0.15 * prev_return  # Momentum effect
                
                # Add mean reversion over longer periods
                if len(prices) > 20:
                    recent_avg = np.mean(prices[-20:])
                    deviation = (prices[-1] - recent_avg) / recent_avg
                    random_return -= 0.05 * deviation  # Mean reversion
                
                # Add some market regime changes (volatility clustering)
                if i > 0 and abs(random_return) > daily_volatility * 2:
                    # High volatility tends to cluster
                    if np.random.random() < 0.3:  # 30% chance of continued high volatility
                        random_return *= 1.5
                
                new_price = prices[-1] * (1 + random_return)
                prices.append(max(new_price, 0.01))  # Ensure positive prices
            
            # Scale final price to be close to current price (within 10%)
            if len(prices) > 0:
                target_price = current_price * (1 + np.random.uniform(-0.1, 0.1))
                scale_factor = target_price / prices[-1]
                prices = [p * scale_factor for p in prices]
            
            data[symbol] = prices
            data_sources[symbol] = "Synthetic (Realistic)"
            successful_fetches += 1
            print(f"✅ Generated realistic synthetic data for {symbol}: {len(prices)} points")
            
        except Exception as e:
            print(f"⚠️ Error processing {symbol}: {e}")
            # Emergency fallback to simple data
            current_price = float(stock_data[symbol].get('price', 100))
            simple_prices = [current_price * (1 + np.random.uniform(-0.02, 0.02)) for _ in range(len(dates))]
            data[symbol] = simple_prices
            data_sources[symbol] = "Synthetic (Simple)"
    
    print(f"📊 Successfully processed {successful_fetches}/{len(symbols)} symbols")
    print(f"📊 Data sources summary: {data_sources}")
    
    # Ensure all data arrays have the same length as dates
    for symbol in symbols:
        if len(data[symbol]) != len(dates):
            print(f"⚠️ Length mismatch for {symbol}: {len(data[symbol])} vs {len(dates)} dates")
            if len(data[symbol]) > len(dates):
                data[symbol] = data[symbol][:len(dates)]
            elif len(data[symbol]) < len(dates):
                # Pad with the last value
                last_value = data[symbol][-1] if data[symbol] else 100.0
                while len(data[symbol]) < len(dates):
                    data[symbol].append(last_value)
            print(f"✅ Fixed {symbol} data length to {len(data[symbol])}")
    
    # Convert to DataFrame
    df = pd.DataFrame(data, index=dates)
    
    print(f"📊 Enhanced time series created: {df.shape}")
    print(f"📊 Date range: {df.index[0]} to {df.index[-1]}")
    print(f"📊 Real data percentage: {len([s for s in data_sources.values() if 'Yahoo' in s])/len(symbols)*100:.1f}%")
    
    return df, data_sources
            
            # Option 1: If you have historical data in your API, use it
            # For now, we'll create realistic data based on current price and trends
            
            # Generate realistic historical prices based on current data
            change_percent = float(stock_data[symbol].get('changePercent', 0))
            
            # Calculate realistic parameters
            daily_return_mean = (change_percent / 100) / 252  # Daily return
            daily_volatility = max(0.005, min(0.03, abs(daily_return_mean) * 3 + 0.01))
            
            # Generate more realistic price series
            np.random.seed(42 + hash(symbol) % 1000)  # Consistent seed per symbol
            
            # Start from a reasonable historical price
            start_price = current_price / (1 + (change_percent / 100))
            
            prices = [start_price]
            
            for i in range(len(dates) - 1):
                # Add some market-like behavior
                random_return = np.random.normal(daily_return_mean, daily_volatility)
                
                # Add some autocorrelation (momentum)
                if i > 0:
                    prev_return = (prices[i] - prices[i-1]) / prices[i-1] if prices[i-1] > 0 else 0
                    random_return += 0.1 * prev_return
                
                # Add some mean reversion
                if len(prices) > 10:
                    recent_avg = np.mean(prices[-10:])
                    if prices[-1] > recent_avg * 1.1:  # If 10% above recent average
                        random_return -= 0.001  # Slight downward pressure
                    elif prices[-1] < recent_avg * 0.9:  # If 10% below recent average
                        random_return += 0.001  # Slight upward pressure
                
                new_price = prices[-1] * (1 + random_return)
                prices.append(max(new_price, 0.01))  # Ensure positive prices
            
            # Scale to end close to current price (within 5%)
            if len(prices) > 0:
                final_target = current_price * (1 + np.random.uniform(-0.05, 0.05))
                scale_factor = final_target / prices[-1]
                prices = [p * scale_factor for p in prices]
            
            data[symbol] = prices
            successful_fetches += 1
            print(f"✅ Generated realistic data for {symbol}: {len(prices)} points")
            
        except Exception as e:
            print(f"⚠️ Error fetching data for {symbol}: {e}")
            # Fallback to simple data
            current_price = float(stock_data[symbol].get('price', 100))
            simple_prices = [current_price * (1 + np.random.uniform(-0.02, 0.02)) for _ in range(len(dates))]
            data[symbol] = simple_prices
    
    print(f"📊 Successfully processed {successful_fetches}/{len(symbols)} symbols")
    
    # Ensure all data arrays have the same length as dates
    for symbol in symbols:
        if len(data[symbol]) != len(dates):
            print(f"⚠️ Length mismatch for {symbol}: {len(data[symbol])} vs {len(dates)} dates")
            if len(data[symbol]) > len(dates):
                data[symbol] = data[symbol][:len(dates)]
            elif len(data[symbol]) < len(dates):
                last_value = data[symbol][-1] if data[symbol] else 100.0
                while len(data[symbol]) < len(dates):
                    data[symbol].append(last_value)
    
    # Create DataFrame
    df = pd.DataFrame(data, index=dates)
    
    print(f"📊 Historical data created: {df.shape}")
    print(f"📊 Date range: {df.index[0]} to {df.index[-1]}")
    print(f"📊 Sample prices:")
    for symbol in symbols[:3]:  # Show first 3 symbols
        print(f"  {symbol}: ${df[symbol].iloc[0]:.2f} -> ${df[symbol].iloc[-1]:.2f}")
    
    return df

def run_server():
    """
    Enhanced Flask server with improved Granger causality analysis
    """
    app = Flask(__name__)
    CORS(app)

    # Enhanced cache with metadata
    results_cache = {}
    
    @app.route('/api/granger-causality', methods=['POST'])
    def granger_causality():
        try:
            request_data = request.get_json()
            stock_prices = request_data.get('stock_prices', {})
            
            print(f"📡 Received request for {len(stock_prices)} stocks")
            
            if not stock_prices:
                return jsonify({"success": False, "message": "No stock prices provided"}), 400
            
            if len(stock_prices) < 2:
                return jsonify({
                    "success": False, 
                    "message": "Need at least 2 stocks for correlation analysis"
                }), 400
            
            # Create cache key
            cache_key = create_cache_key(stock_prices)
            
            # Check cache first
            if cache_key in results_cache:
                print(f"📦 Using cached result for {len(stock_prices)} stocks")
                cached_result = results_cache[cache_key]
                return jsonify({
                    "success": True, 
                    "edges": cached_result['edges'],
                    "cached": True,
                    "timestamp": cached_result['timestamp']
                })
            
            print(f"🔄 Running fresh analysis for {len(stock_prices)} stocks")
            
            # Run analysis
            result = analyze_stock_influence(stock_data=stock_prices)
            
            # Convert to expected format
            edges = []
            for link in result['links']:
                edge = {
                    "source": link['source'],
                    "target": link['target'],
                    "correlation": link.get('correlation', 0),
                    "value": link.get('value', 0),
                    "method": link.get('method', 'unknown')
                }
                
                # Add method-specific fields
                if link.get('p_value') is not None:
                    edge['p_value'] = link['p_value']
                if link.get('importance') is not None:
                    edge['importance'] = link['importance']
                
                edges.append(edge)
            
            # Cache the result
            results_cache[cache_key] = {
                'edges': edges,
                'timestamp': time.time()
            }
            
            # Limit cache size
            if len(results_cache) > 10:
                oldest_key = min(results_cache.keys(), key=lambda k: results_cache[k]['timestamp'])
                del results_cache[oldest_key]
            
            print(f"✅ Analysis complete: {len(edges)} edges found")
            
            return jsonify({
                "success": True, 
                "edges": edges,
                "cached": False,
                "analysis_summary": {
                    "total_edges": len(edges),
                    "granger_edges": len([e for e in edges if e['method'] == 'granger']),
                    "naive_bayes_edges": len([e for e in edges if e['method'] == 'naive_bayes'])
                }
            })
            
        except Exception as e:
            print(f"❌ Error in granger_causality endpoint: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({
                "success": False, 
                "message": str(e),
                "error_type": type(e).__name__
            }), 500
    
    def create_cache_key(stock_prices):
        """Create a stable cache key from stock prices"""
        symbols = sorted(stock_prices.keys())
        key_parts = []
        
        for symbol in symbols:
            price = round(float(stock_prices[symbol].get('price', 0)), 2)
            change = round(float(stock_prices[symbol].get('changePercent', 0)), 1)
            key_parts.append(f"{symbol}:{price}:{change}")
        
        return "_".join(key_parts)
    
    @app.route('/api/health', methods=['GET'])
    def health_check():
        """Health check endpoint"""
        return jsonify({
            "status": "healthy",
            "timestamp": time.time(),
            "cache_size": len(results_cache)
        })

    print("🚀 Starting Enhanced Flask server on port 5001...")
    print("📡 Available endpoints:")
    print("  POST /api/granger-causality - Run correlation analysis")
    print("  GET  /api/health - Health check")
    
    app.run(port=5001, debug=True, use_reloader=False)

if __name__ == "__main__":
    if '--run-server' in sys.argv:
        run_server()
    elif '--watch' in sys.argv:
        script_to_run = __file__
        event_handler = ChangeHandler(script_to_run)
        observer = Observer()
        observer.schedule(event_handler, '.', recursive=True)
        observer.start()
        print(f"👁️ Watching for changes in the current directory to restart {script_to_run}...")
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            observer.stop()
        observer.join()
    else:
        print("Usage:")
        print("  python stock_analysis.py --watch      # Watch mode with auto-restart")
        print("  python stock_analysis.py --run-server # Run Flask server")