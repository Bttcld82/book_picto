/**
 * Library for managing link button visibility preferences per card
 */

const STORAGE_KEY = 'aac:linkButton:visible';

// Get preferences from localStorage
function getLinkButtonPreferences(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Save preferences to localStorage
function saveLinkButtonPreferences(prefs: Record<string, boolean>): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Check if link button should be visible for a specific card
 * @param cardId - The ID of the card
 * @returns true if button should be visible, false otherwise
 */
export function isLinkButtonVisible(cardId: number): boolean {
  const prefs = getLinkButtonPreferences();
  return prefs[cardId.toString()] ?? false;
}

/**
 * Set link button visibility for a specific card
 * @param cardId - The ID of the card
 * @param visible - Whether the button should be visible
 */
export function setLinkButtonVisible(cardId: number, visible: boolean): void {
  const prefs = getLinkButtonPreferences();
  prefs[cardId.toString()] = visible;
  saveLinkButtonPreferences(prefs);
}

/**
 * Toggle link button visibility for a specific card
 * @param cardId - The ID of the card
 * @returns new visibility state
 */
export function toggleLinkButtonVisible(cardId: number): boolean {
  const newState = !isLinkButtonVisible(cardId);
  setLinkButtonVisible(cardId, newState);
  return newState;
}

/**
 * Clear all link button preferences
 */
export function clearLinkButtonPreferences(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}