import { customAlphabet } from 'nanoid'

// Create a custom nanoid function
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 10)

export { nanoid }

// Utility function to combine class names
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}