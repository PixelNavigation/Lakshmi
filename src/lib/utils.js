import { customAlphabet } from 'nanoid'

// Create a custom nanoid function
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 10)

export { nanoid }

// Utility function to combine class names
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

// Backend API configuration
const BACKEND_URLS = [
  'https://wwws68kj-5001.inc1.devtunnels.ms',
  'http://localhost:5001'
]

// Utility function to make backend API calls with fallback
export async function backendFetch(endpoint, options = {}) {
  let lastError = null
  
  for (const baseUrl of BACKEND_URLS) {
    try {
      const url = `${baseUrl}${endpoint}`
      console.log(`Trying backend URL: ${url}`)
      
      const response = await fetch(url, options)
      
      if (response.ok) {
        console.log(`Successfully connected to: ${url}`)
        return response
      } else {
        console.warn(`Failed to connect to ${url}: ${response.status}`)
        lastError = new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.warn(`Error connecting to ${baseUrl}${endpoint}:`, error)
      lastError = error
    }
  }
  
  throw lastError || new Error('All backend URLs failed')
}