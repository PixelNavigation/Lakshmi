/**
 * OmniDimension Web Widget Integration Component
 * This component handles the integration with OmniDimension voice assistant
 */

'use client';

import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const OmniDimensionWidget = () => {
  const { user, token, session } = useAuth();

  useEffect(() => {
    // Wait for OmniDimension widget to load
    const configureWidget = () => {
      if (user && token && window.OmniDimension) {
        try {
          console.log('🔧 Configuring OmniDimension widget...');
          console.log('User:', user.email);
          console.log('Token available:', !!token);
          
          // Configure OmniDimension with user context
          window.OmniDimension.configure({
            user_id: user.id,
            user_email: user.email,
            user_name: user.user_metadata?.full_name || user.email,
            auth_token: `Bearer ${token}`,
            api_base_url: process.env.NEXT_PUBLIC_BASE_URL || window.location.origin,
            
            // Trading platform context
            platform: 'lakshmi_trading',
            features: ['portfolio', 'trading', 'balance', 'watchlist'],
            
            // API endpoints configuration
            endpoints: {
              portfolio: {
                url: '/api/user-portfolio',
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              },
              balance: {
                url: '/api/user-balance', 
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              },
              trade: {
                url: '/api/trade',
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              },
              watchlist: '/api/user-watchlist',
              stocks: '/api/stocks',
              search: '/api/comprehensive-search'
            },
            
            // Custom voice commands context
            voice_context: {
              "portfolio": "user portfolio and holdings",
              "balance": "user cash balance and funds", 
              "buy": "purchase stocks at current market price",
              "sell": "sell stocks at current market price",
              "trade": "trading operations",
              "watchlist": "stock watchlist management",
              "search": "search for stocks and companies"
            }
          });

          console.log('✅ OmniDimension configured for authenticated user:', user.email);
        } catch (error) {
          console.error('❌ Failed to configure OmniDimension:', error);
        }
      } else if (user && !token) {
        console.log('⏳ User authenticated but token not available yet');
      } else if (!user) {
        console.log('👤 User not authenticated');
      } else if (!window.OmniDimension) {
        console.log('📱 OmniDimension widget not loaded yet');
      }
    };

    // Try to configure immediately if everything is ready
    configureWidget();
    
    // Also try after a delay in case the widget is still loading
    const timer = setTimeout(configureWidget, 1000);
    
    return () => clearTimeout(timer);
  }, [user, token, session]);

  // Widget visibility based on authentication
  useEffect(() => {
    if (window.OmniDimension) {
      if (user) {
        // Show widget for authenticated users
        window.OmniDimension.show();
      } else {
        // Hide widget for non-authenticated users (optional)
        // window.OmniDimension.hide();
      }
    }
  }, [user]);

  // Fetch user balance example
  useEffect(() => {
    const fetchUserBalance = async () => {
      try {
        const response = await fetch('/api/user-balance', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          // Don't throw an error, just log it to avoid breaking the UI
          console.warn('⚠️ User balance API not available:', response.status);
          return;
        }
        
        const data = await response.json();
        console.log('💰 User balance data:', data);
        
        // Here you can update the state or context with the fetched balance data if needed
      } catch (error) {
        // Silently handle the error to prevent UI disruption
        console.warn('⚠️ User balance fetch failed (non-critical):', error.message);
      }
    };

    // Fetch balance only if user is authenticated
    if (user && token) {
      // Add a small delay to avoid interfering with other components
      setTimeout(() => {
        fetchUserBalance();
      }, 1000);
    }
  }, [user, token]);

  return null; // This component doesn't render anything visible
};

export default OmniDimensionWidget;
