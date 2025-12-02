/**
 * Hash Table Implementation
 * Provides O(1) average time complexity for insert, delete, and search operations
 */

export class HashTable<K, V> {
  private buckets: Array<Array<[K, V]>>;
  private size: number;
  private capacity: number;
  private loadFactor: number = 0.75;

  constructor(initialCapacity: number = 16) {
    this.capacity = initialCapacity;
    this.size = 0;
    this.buckets = new Array(this.capacity).fill(null).map(() => []);
  }

  /**
   * Hash function to convert key to bucket index
   */
  private hash(key: K): number {
    const keyString = String(key);
    let hash = 0;
    for (let i = 0; i < keyString.length; i++) {
      const char = keyString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % this.capacity;
  }

  /**
   * Insert or update a key-value pair
   * Time Complexity: O(1) average, O(n) worst case
   */
  set(key: K, value: V): void {
    const index = this.hash(key);
    const bucket = this.buckets[index];

    // Check if key already exists
    const existingIndex = bucket.findIndex(([k]) => k === key);
    if (existingIndex !== -1) {
      bucket[existingIndex][1] = value;
      return;
    }

    // Add new key-value pair
    bucket.push([key, value]);
    this.size++;

    // Resize if load factor exceeded
    if (this.size > this.capacity * this.loadFactor) {
      this.resize();
    }
  }

  /**
   * Get value by key
   * Time Complexity: O(1) average, O(n) worst case
   */
  get(key: K): V | undefined {
    const index = this.hash(key);
    const bucket = this.buckets[index];
    const pair = bucket.find(([k]) => k === key);
    return pair ? pair[1] : undefined;
  }

  /**
   * Check if key exists
   * Time Complexity: O(1) average, O(n) worst case
   */
  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Delete a key-value pair
   * Time Complexity: O(1) average, O(n) worst case
   */
  delete(key: K): boolean {
    const index = this.hash(key);
    const bucket = this.buckets[index];
    const pairIndex = bucket.findIndex(([k]) => k === key);

    if (pairIndex !== -1) {
      bucket.splice(pairIndex, 1);
      this.size--;
      return true;
    }
    return false;
  }

  /**
   * Get all keys
   * Time Complexity: O(n)
   */
  keys(): K[] {
    const keys: K[] = [];
    for (const bucket of this.buckets) {
      for (const [key] of bucket) {
        keys.push(key);
      }
    }
    return keys;
  }

  /**
   * Get all values
   * Time Complexity: O(n)
   */
  values(): V[] {
    const values: V[] = [];
    for (const bucket of this.buckets) {
      for (const [, value] of bucket) {
        values.push(value);
      }
    }
    return values;
  }

  /**
   * Get all entries
   * Time Complexity: O(n)
   */
  entries(): Array<[K, V]> {
    const entries: Array<[K, V]> = [];
    for (const bucket of this.buckets) {
      entries.push(...bucket);
    }
    return entries;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.buckets = new Array(this.capacity).fill(null).map(() => []);
    this.size = 0;
  }

  /**
   * Get current size
   */
  getSize(): number {
    return this.size;
  }

  /**
   * Resize the hash table when load factor is exceeded
   */
  private resize(): void {
    const oldBuckets = this.buckets;
    this.capacity *= 2;
    this.size = 0;
    this.buckets = new Array(this.capacity).fill(null).map(() => []);

    // Rehash all entries
    for (const bucket of oldBuckets) {
      for (const [key, value] of bucket) {
        this.set(key, value);
      }
    }
  }

  /**
   * Convert to array
   */
  toArray(): Array<[K, V]> {
    return this.entries();
  }
}

