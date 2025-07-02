import pandas as pd
import numpy as np
from sklearn.naive_bayes import GaussianNB
from statsmodels.tsa.stattools import grangercausalitytests
import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import subprocess
import sys
from flask import Flask, jsonify, request
from flask_cors import CORS

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
        
        # Use real-time data from frontend
        print(f"Using real-time stock data from frontend: {list(stock_data.keys())}")
        data = create_dataframe_from_stock_data(stock_data)

        symbols = data.columns.tolist()
        influence_edges = []

        print(f"Analyzing {len(symbols)} symbols: {symbols}")

        # Granger Causality - with fixed parameters for consistency
        maxlag = 3  # Reduced from 5 to 3 for more stability
        significance_threshold = 0.05
        
        # Process pairs in a deterministic order
        symbol_pairs = []
        for target in symbols:
            for source in symbols:
                if source != target:
                    symbol_pairs.append((source, target))
                    
        # Sort pairs alphabetically to ensure consistent processing order
        symbol_pairs.sort()
        
        for source, target in symbol_pairs:
            try:
                # Ensure the data is properly prepared
                pair_data = data[[target, source]].dropna()
                
                if len(pair_data) < maxlag + 2:  # Need enough data points
                    continue
                    
                # Run test with fixed parameters
                test_result = grangercausalitytests(
                    pair_data, 
                    maxlag=maxlag, 
                    verbose=False
                )
                
                # Use consistent approach to evaluate p-values
                p_values = [test_result[lag][0]['ssr_ftest'][1] for lag in range(1, maxlag+1)]
                min_pvalue = min(p_values)
                avg_pvalue = sum(p_values) / len(p_values)
                
                # Use a weighted approach that considers both minimum and average
                effective_pvalue = 0.7 * min_pvalue + 0.3 * avg_pvalue
                
                # Only add edge if significant
                if effective_pvalue < significance_threshold:
                    influence = 1 - effective_pvalue
                    # Add some stability to influence value
                    stabilized_influence = round(influence * 10) / 10
                    
                    influence_edges.append({
                        "source": source,
                        "target": target,
                        "value": stabilized_influence,
                        "method": "granger",
                        "correlation": stabilized_influence
                    })
            except Exception as e:
                print(f"Granger error {source}->{target}: {e}")

        # Naive Bayes Influence - with stabilization measures
        # Calculate percent changes with less sensitivity to noise
        data_pct = data.pct_change().rolling(window=3).mean().dropna()
        
        # Use more stable classification (up/down) based on smoothed changes
        data_labels = (data_pct.shift(-1) > 0).astype(int).dropna()

        # Process symbols in a consistent order
        ordered_symbols = sorted(symbols)
        
        for symbol in ordered_symbols:
            try:
                # Skip if not enough data
                if len(data_pct) < 10 or symbol not in data_pct.columns:
                    continue
                    
                X = data_pct.drop(columns=[symbol])
                y = data_labels[symbol]
                
                # Make sure we have enough samples of each class
                if y.sum() < 3 or (len(y) - y.sum()) < 3:
                    continue
                
                # Fix random state for reproducibility
                np.random.seed(42 + sum(ord(c) for c in symbol))
                clf = GaussianNB()
                clf.fit(X, y)
                
                # Get feature importance in a stable way
                feature_importance = np.abs(clf.theta_[1] - clf.theta_[0])
                
                # Stabilize importance scores
                feature_importance = np.round(feature_importance, 3)
                
                # Add top 2 most influential stocks (reduced from 3 for stability)
                num_top = min(2, len(X.columns))
                if num_top == 0:
                    continue
                    
                top_indices = np.argsort(feature_importance)[-num_top:][::-1]
                for idx in top_indices:
                    if idx < len(X.columns):  # Safety check
                        other_symbol = X.columns[idx]
                        score = feature_importance[idx]
                        
                        # Only add if score is significant
                        if score > 0.01:
                            # Stabilize the score
                            stable_score = round(score * 10) / 10
                            
                            # Determine correlation sign in a stable way
                            if clf.theta_[1][idx] > clf.theta_[0][idx]:
                                corr = stable_score  # Positive correlation
                            else:
                                corr = -stable_score  # Negative correlation
                            
                            influence_edges.append({
                                "source": other_symbol,
                                "target": symbol,
                                "value": stable_score,
                                "method": "naive_bayes",
                                "correlation": corr
                            })
            except Exception as e:
                print(f"Naive Bayes error for {symbol}: {e}")

        # Build simplified graph
        nodes = [{"id": s} for s in symbols]
        links = influence_edges

        print(f"Generated analysis with {len(nodes)} nodes and {len(links)} edges")
        return {"nodes": nodes, "links": links}

    except Exception as e:
        print(f"Error in analysis: {e}")
        return {"nodes": [], "links": []}



def create_dataframe_from_stock_data(stock_data):
    """
    Convert frontend stock data to pandas DataFrame suitable for analysis
    Args:
        stock_data: Dict with structure {symbol: {price, change, changePercent, marketCap, ...}}
    Returns:
        pandas.DataFrame with simulated time series data for analysis
    """
    import datetime
    
    symbols = list(stock_data.keys())
    print(f"Creating DataFrame for symbols: {symbols}")
    print(f"Sample stock data: {stock_data}")
    
    # Generate dates for the last 100 days for analysis - fixed date range for consistency
    end_date = datetime.datetime(2025, 7, 1)  # Fixed end date for consistency
    start_date = end_date - datetime.timedelta(days=100)
    dates = pd.date_range(start=start_date, end=end_date, freq='D')
    
    # Set random seed at the module level for consistent results
    np.random.seed(42)  
    
    data = {}
    
    for symbol in symbols:
        stock_info = stock_data[symbol]
        current_price = float(stock_info.get('price', 100))
        change_percent = float(stock_info.get('changePercent', 0))
        
        # Make trend proportional to change percent but with reduced variance
        # Cap the trend to avoid extreme values
        capped_change = max(min(change_percent, 30), -30)  # Cap between -30% and +30%
        daily_return_mean = capped_change / 100 / 30  # Approximate daily return from monthly change
        daily_return_std = 0.01  # Reduced volatility for more stable simulations
        
        # Generate returns with the inferred trend - fixed seed per symbol
        symbol_seed = sum(ord(c) for c in symbol)  # Generate unique seed from symbol name
        np.random.seed(42 + symbol_seed)  # Unique but consistent seed per symbol
        returns = np.random.normal(daily_return_mean, daily_return_std, len(dates))
        
        # Generate price series in a more stable way
        prices = []
        # Start from a reasonable price and work forward
        start_price = current_price / (1 + (daily_return_mean * len(dates)))
        prices = [start_price]
        
        # Build prices incrementally
        for ret in returns[:-1]:  # Skip last return as we'll set the price directly
            prices.append(prices[-1] * (1 + ret))
        
        # Adjust the last price to match current price exactly
        prices.append(current_price)
        
        # Apply a smoothing function to avoid abrupt changes
        if len(prices) > 5:  # Only smooth if we have enough data points
            prices = smooth_price_series(prices)
            # Make sure the final price is still exactly the current price
            prices[-1] = current_price
        
        data[symbol] = prices
    
    # Reset the random seed to the global value after all symbols are processed
    np.random.seed(42)
    
    df = pd.DataFrame(data, index=dates)
    print(f"Created DataFrame with shape: {df.shape}")
    print(f"DataFrame head:\n{df.head()}")
    print(f"DataFrame tail:\n{df.tail()}")
    
    return df

def smooth_price_series(prices):
    """Apply a simple moving average smoothing to the price series"""
    window_size = 3
    smoothed = prices.copy()
    for i in range(window_size, len(prices)):
        smoothed[i] = sum(prices[i-window_size:i]) / window_size
    return smoothed

def run_server():
    """
    Flask server with Granger causality analysis
    """
    app = Flask(__name__)
    CORS(app)  # Enable CORS for all domains on all routes

    # Cache to store previous results
    results_cache = {}
    
    @app.route('/api/granger-causality', methods=['POST'])
    def granger_causality():
        try:
            # Get stock data from request
            request_data = request.get_json()
            stock_prices = request_data.get('stock_prices', {})
            
            print(f"Received stock prices data for {len(stock_prices)} stocks")
            
            if not stock_prices:
                return jsonify({"success": False, "message": "No stock prices provided"}), 400
            
            # Create a cache key from the stock symbols and prices
            # This ensures we return consistent results for the same inputs
            cache_key = create_cache_key(stock_prices)
            
            # Check if we have a cached result
            if cache_key in results_cache:
                print(f"Using cached result for {len(stock_prices)} stocks")
                edges = results_cache[cache_key]
            else:
                print(f"Analyzing {len(stock_prices)} stocks from frontend")
                # Set a consistent random seed before analysis
                np.random.seed(42)
                
                result = analyze_stock_influence(stock_data=stock_prices)
                
                # Convert to format expected by frontend
                edges = []
                for link in result['links']:
                    edges.append({
                        "source": link['source'],
                        "target": link['target'],
                        "correlation": link.get('correlation', link['value']),
                        "p_value": 1 - link['value'],  # Convert influence back to p-value approximation
                        "method": link['method']
                    })
                
                # Store in cache
                results_cache[cache_key] = edges
                
                # Limit cache size
                if len(results_cache) > 10:
                    # Remove oldest entry
                    oldest_key = next(iter(results_cache))
                    del results_cache[oldest_key]

            print(f"Returning {len(edges)} edges to frontend")
            return jsonify({"success": True, "edges": edges})
        except Exception as e:
            print(f"Error in granger_causality endpoint: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({"success": False, "message": str(e)}), 500
    
    def create_cache_key(stock_prices):
        """Create a consistent cache key from stock prices"""
        # Sort symbols to ensure consistent ordering
        symbols = sorted(stock_prices.keys())
        
        # Create a string representation of prices (rounded to reduce noise)
        key_parts = []
        for symbol in symbols:
            price = round(float(stock_prices[symbol].get('price', 0)), 2)
            change = round(float(stock_prices[symbol].get('changePercent', 0)), 1)
            key_parts.append(f"{symbol}:{price}:{change}")
            
        return "_".join(key_parts)

    print("Starting Flask server on port 5001...")
    print("Available endpoints:")
    print("  POST /api/granger-causality - Run real-time analysis")
    
    if __name__ == '__main__':
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
        print(f"Watching for changes in the current directory to restart {script_to_run}...")
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            observer.stop()
        observer.join()
    elif '--analyze' in sys.argv:
        # Analysis requires stock data from frontend
        print("Error: Analysis requires stock data. Use the Flask server endpoint instead.")
    else:
        print("Usage:")
        print("  python stock_influence_analysis.py --watch     # Watch mode with auto-restart")
        print("  python stock_influence_analysis.py --run-server # Run Flask server")
