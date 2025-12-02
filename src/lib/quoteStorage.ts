/**
 * Browser storage service for quote list
 * Uses localStorage to persist quote items across sessions
 */

const STORAGE_KEY = 'quote_list';

export interface StoredQuoteItem {
  productId: string;
  productName: string;
  sku: string;
  imageUrl: string;
  quantity: number;
}

/**
 * Get quote list from localStorage
 * @returns Array of quote items, or empty array if none exist or error occurs
 */
export function getQuoteListFromStorage(): StoredQuoteItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to read from storage:', error);
    return [];
  }
}

/**
 * Save quote list to localStorage
 * @param items - Array of quote items to save
 * @throws Error if storage quota is exceeded or storage is unavailable
 */
export function saveQuoteListToStorage(items: StoredQuoteItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to save to storage:', error);
    
    // Check if it's a quota exceeded error
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      throw new Error('儲存空間已滿，請清除部分項目後再試');
    }
    
    throw new Error('無法儲存詢價清單');
  }
}

/**
 * Clear all items from quote list
 */
export function clearQuoteListFromStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear storage:', error);
  }
}

/**
 * Add a product to the quote list
 * If product already exists, increment quantity
 * @param item - Quote item to add
 */
export function addToQuoteList(item: Omit<StoredQuoteItem, 'quantity'> & { quantity?: number }): void {
  const items = getQuoteListFromStorage();
  const existingIndex = items.findIndex(i => i.productId === item.productId);
  
  if (existingIndex >= 0) {
    // Product exists, increment quantity
    items[existingIndex].quantity += item.quantity || 1;
  } else {
    // New product, add to list
    items.push({
      ...item,
      quantity: item.quantity || 1
    });
  }
  
  saveQuoteListToStorage(items);
}

/**
 * Update quantity of a specific item
 * @param productId - Product ID to update
 * @param quantity - New quantity (must be > 0)
 */
export function updateQuantity(productId: string, quantity: number): void {
  if (quantity <= 0) {
    throw new Error('數量必須大於 0');
  }
  
  const items = getQuoteListFromStorage();
  const item = items.find(i => i.productId === productId);
  
  if (item) {
    item.quantity = quantity;
    saveQuoteListToStorage(items);
  }
}

/**
 * Remove an item from the quote list
 * @param productId - Product ID to remove
 */
export function removeFromQuoteList(productId: string): void {
  const items = getQuoteListFromStorage();
  const filtered = items.filter(i => i.productId !== productId);
  saveQuoteListToStorage(filtered);
}

/**
 * Get the total number of items in the quote list
 * @returns Total quantity of all items
 */
export function getQuoteListCount(): number {
  const items = getQuoteListFromStorage();
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Check if a product is in the quote list
 * @param productId - Product ID to check
 * @returns true if product is in the list
 */
export function isInQuoteList(productId: string): boolean {
  const items = getQuoteListFromStorage();
  return items.some(i => i.productId === productId);
}

/**
 * Check if localStorage is available
 * @returns true if localStorage is available
 */
export function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}
