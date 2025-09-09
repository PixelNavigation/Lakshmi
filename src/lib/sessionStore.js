const inMemorySessions = new Map();
const SESSION_TTL = 15 * 60;

/**
 * Store a session by call SID
 * 
 * @param {string} callSid - The OmniDimension or Twilio call SID
 * @param {object} sessionData - Session data including userId, accessToken, and expiresAt
 * @param {number} ttl - Time to live in seconds (optional, defaults to SESSION_TTL)
 */
export async function setSession(callSid, sessionData, ttl = SESSION_TTL) {
  if (!callSid) {
    console.error('❌ Call SID is required');
    throw new Error('Call SID is required');
  }

  if (!sessionData || !sessionData.accessToken || !sessionData.userId) {
    console.error('❌ Invalid session data', sessionData);
    throw new Error('Invalid session data. Must include userId and accessToken');
  }

  try {
    // Store the session data with expiration
    inMemorySessions.set(callSid, {
      ...sessionData,
      createdAt: Date.now()
    });
    console.log(sessionData);
    console.log(`✅ Session stored for call_sid: ${callSid}, userId: ${sessionData.userId}`);
    
    // Set up auto-expiry for in-memory sessions
    setTimeout(() => {
      inMemorySessions.delete(callSid);
      console.log(`Session expired for call_sid: ${callSid}`);
    }, ttl * 1000);
    
    return true;
  } catch (error) {
    console.error('Error setting session:', error);
    return false;
  }
}

/**
 * Get a session by call SID
 * 
 * @param {string} callSid - The OmniDimension or Twilio call SID
 * @returns {object|null} Session data or null if not found or expired
 */
export async function getSession(callSid) {
  if (!callSid) {
    console.error('❌ getSession called with null or undefined callSid');
    return null;
  }

  // Simple debug log for session lookup
  console.log(`Looking up session for callSid: "${callSid}"`);

  try {
    // Get session data from in-memory store
    const sessionData = inMemorySessions.get(callSid);
    
    if (!sessionData) {
      console.log(`No session found for callSid: "${callSid}"`);
      
      return null;
    }
    
    // Check if session is expired based on expiresAt from Supabase token
    if (sessionData.expiresAt && new Date(sessionData.expiresAt * 1000).getTime() < Date.now()) {
      // Remove expired session
      inMemorySessions.delete(callSid);
      console.log(`Session expired for callSid: "${callSid}"`);
      return null;
    }
    
    console.log(`Valid session found for callSid: "${callSid}", userId: ${sessionData.userId}`);
    
    return sessionData;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Delete a session by call SID
 * 
 * @param {string} callSid - The OmniDimension or Twilio call SID
 */
export async function deleteSession(callSid) {
  if (!callSid) {
    console.error('❌ deleteSession called with null or undefined callSid');
    return false;
  }

  try {
    const hadSession = inMemorySessions.has(callSid);
    inMemorySessions.delete(callSid);
    
    if (hadSession) {
      console.log(`Session deleted for callSid: "${callSid}"`);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting session:', error);
    return false;
  }
}

/**
 * Initialize Redis connection if available
 * This function will be a no-op in the current in-memory implementation
 * but can be expanded if Redis is added later
 */
export async function initSessionStore() {
  // Currently using in-memory store only
  console.log('Session store initialized with in-memory backend');
  return true;
}

/**
 * Get a session by user ID
 * 
 * @param {string} userId - The user ID to search for
 * @returns {object|null} Session data or null if not found
 */
export async function getSessionByUserId(userId) {
  if (!userId) {
    return null;
  }

  try {
    // Iterate through all sessions to find one with the matching userId
    for (const [callSid, sessionData] of inMemorySessions.entries()) {
      if (sessionData.userId === userId) {
        // Check if session is expired
        if (sessionData.expiresAt && new Date(sessionData.expiresAt * 1000).getTime() < Date.now()) {
          console.log(`Session expired for userId: "${userId}"`);
          inMemorySessions.delete(callSid);
          continue; // Try next session if exists
        }
        
        console.log(`Valid session found for userId: "${userId}"`);
        return sessionData;
      }
    }
    
    console.log(`No session found for userId: "${userId}"`);
    return null;
  } catch (error) {
    console.error('Error getting session by user ID:', error);
    return null;
  }
}

/**
 * Get user ID directly from call_sid (simplified lookup)
 * 
 * @param {string} callSid - The OmniDimension or Twilio call SID
 * @returns {string|null} User ID or null if not found
 */
export async function getUserIdFromCallSid(callSid) {
  if (!callSid) {
    return null;
  }

  try {
    // First try the simplified mapping approach
    const userId = inMemorySessions.get(`${callSid}_userid`);
    if (userId) {
      console.log(`✅ Found direct mapping: ${callSid} -> ${userId}`);
      return userId;
    }
    
    // Fallback to the full session data approach
    const sessionData = inMemorySessions.get(callSid);
    if (sessionData && sessionData.userId) {
      console.log(`✅ Found userId from session data: ${callSid} -> ${sessionData.userId}`);
      return sessionData.userId;
    }
    
    console.log(`❌ No userId found for call_sid: ${callSid}`);
    return null;
  } catch (error) {
    console.error('Error getting user ID from call_sid:', error);
    return null;
  }
}


