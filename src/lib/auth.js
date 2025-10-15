import bcrypt from 'bcrypt';
import db from './db.js';

// Generate a new password hash
export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

// Verify password against database
export async function verifyPassword(username, password) {
  const user = db.prepare('SELECT password_hash FROM users WHERE username = ?').get(username);
  
  if (!user) return false;
  
  return await bcrypt.compare(password, user.password_hash);
}

// Create session token
export function createSessionToken() {
  return crypto.randomUUID();
}

// Create session in database
export function createSession(username) {
  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  db.prepare(`
    INSERT INTO sessions (token, username, expires_at)
    VALUES (?, ?, ?)
  `).run(token, username, expiresAt.toISOString());
  
  return token;
}

// Get session from database
export function getSession(token) {
  const session = db.prepare(`
    SELECT username, created_at, expires_at
    FROM sessions
    WHERE token = ? AND expires_at > datetime('now')
  `).get(token);
  
  return session ? {
    username: session.username,
    createdAt: new Date(session.created_at).getTime()
  } : null;
}

// Delete session from database
export function deleteSession(token) {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

// Clean up expired sessions
export function cleanupExpiredSessions() {
  const result = db.prepare(`
    DELETE FROM sessions WHERE expires_at <= datetime('now')
  `).run();
  
  return result.changes;
}

// Auto-cleanup expired sessions every hour
setInterval(() => {
  const deleted = cleanupExpiredSessions();
  if (deleted > 0) {
    console.log(`🧹 Cleaned up ${deleted} expired session(s)`);
  }
}, 60 * 60 * 1000);
