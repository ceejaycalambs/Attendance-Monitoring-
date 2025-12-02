/**
 * Queue Implementation (FIFO - First In First Out)
 * Provides O(1) time complexity for enqueue and dequeue operations
 */

export class Queue<T> {
  private items: T[];
  private front: number;
  private rear: number;
  private capacity: number;

  constructor(initialCapacity: number = 100) {
    this.capacity = initialCapacity;
    this.items = new Array(this.capacity);
    this.front = 0;
    this.rear = -1;
  }

  /**
   * Add item to the rear of the queue
   * Time Complexity: O(1)
   */
  enqueue(item: T): void {
    if (this.isFull()) {
      this.resize();
    }
    this.rear++;
    this.items[this.rear] = item;
  }

  /**
   * Remove and return item from the front of the queue
   * Time Complexity: O(1)
   */
  dequeue(): T | undefined {
    if (this.isEmpty()) {
      return undefined;
    }
    const item = this.items[this.front];
    this.items[this.front] = undefined as any; // Clear reference
    this.front++;
    
    // Reset if queue is empty
    if (this.front > this.rear) {
      this.front = 0;
      this.rear = -1;
    }
    
    return item;
  }

  /**
   * Peek at the front item without removing it
   * Time Complexity: O(1)
   */
  peek(): T | undefined {
    if (this.isEmpty()) {
      return undefined;
    }
    return this.items[this.front];
  }

  /**
   * Check if queue is empty
   * Time Complexity: O(1)
   */
  isEmpty(): boolean {
    return this.rear < this.front;
  }

  /**
   * Check if queue is full
   * Time Complexity: O(1)
   */
  isFull(): boolean {
    return this.rear >= this.capacity - 1;
  }

  /**
   * Get current size
   * Time Complexity: O(1)
   */
  size(): number {
    if (this.isEmpty()) {
      return 0;
    }
    return this.rear - this.front + 1;
  }

  /**
   * Clear all items
   */
  clear(): void {
    this.items = new Array(this.capacity);
    this.front = 0;
    this.rear = -1;
  }

  /**
   * Convert to array
   * Time Complexity: O(n)
   */
  toArray(): T[] {
    if (this.isEmpty()) {
      return [];
    }
    return this.items.slice(this.front, this.rear + 1);
  }

  /**
   * Resize the queue when capacity is exceeded
   */
  private resize(): void {
    const oldItems = this.toArray();
    this.capacity *= 2;
    this.items = new Array(this.capacity);
    this.front = 0;
    this.rear = -1;
    
    for (const item of oldItems) {
      this.enqueue(item);
    }
  }
}

