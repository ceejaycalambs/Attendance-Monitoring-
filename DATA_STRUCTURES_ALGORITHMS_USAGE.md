# Data Structures & Algorithms Usage Documentation

This document details where and how HashTable, Queue, and Sorting algorithms are applied in the codebase, with complete code examples.

---

## 📊 HashTable Implementation & Usage

### Implementation Location
**File:** `src/utils/dataStructures/HashTable.ts`

### Complete Implementation Code

```typescript
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
```

---

### Usage 1: Scanner Page - O(1) Student Lookup

**File:** `src/pages/Scanner.tsx`

**Purpose:** Fast student lookup by QR code during scanning (avoids database queries)

**Code:**
```typescript
import { HashTable } from "@/utils/dataStructures/HashTable";

// Create HashTable for O(1) student lookup by QR code
const studentHashTable = useMemo(() => {
  const hashTable = new HashTable<string, Student>();
  if (students) {
    students.forEach((student) => {
      hashTable.set(student.qr_code, student);
      hashTable.set(student.id, student);
    });
  }
  return hashTable;
}, [students]);

// Usage in handleScan function
const handleScan = async (qrCode: string) => {
  // Use HashTable for O(1) lookup instead of database query
  const student = studentHashTable.get(qrCode);

  if (!student) {
    // Fallback to database if not in hash table
    const { data: dbStudent, error } = await supabase
      .from("students")
      .select("*")
      .eq("qr_code", qrCode)
      .maybeSingle();

    if (error || !dbStudent) {
      // Handle error
      return;
    }

    // Add to hash table for future lookups
    studentHashTable.set(qrCode, dbStudent);
    await processScan(dbStudent);
    return;
  }

  await processScan(student);
};
```

**Benefits:**
- O(1) lookup time instead of O(n) array search
- Reduces database queries during scanning
- Faster QR code processing

---

### Usage 2: Students Page - Multi-Key Lookup

**File:** `src/pages/Students.tsx`

**Purpose:** Fast lookup by QR code, Student ID, or UUID for search functionality

**Code:**
```typescript
import { HashTable } from "@/utils/dataStructures/HashTable";

// Create HashTable for O(1) lookups by QR code and Student ID
const studentHashTable = useMemo(() => {
  const hashTable = new HashTable<string, Student>();
  if (students) {
    students.forEach((student) => {
      hashTable.set(student.qr_code, student);
      hashTable.set(student.student_id, student);
      hashTable.set(student.id, student);
    });
  }
  return hashTable;
}, [students]);

// Usage in search filtering
const filteredStudents = useMemo(() => {
  if (!search.trim()) return sortedStudents;
  
  const searchLower = search.toLowerCase();
  
  return sortedStudents.filter((s) => {
    const nameMatch = s.name.toLowerCase().includes(searchLower);
    const idMatch = s.student_id.toLowerCase().includes(searchLower);
    const deptMatch = s.department.toLowerCase().includes(searchLower);
    
    // Also check HashTable for exact matches (O(1))
    const exactMatch = studentHashTable.has(search) || 
                      studentHashTable.has(search.toUpperCase()) ||
                      studentHashTable.has(`QR-${search}`);
    
    return nameMatch || idMatch || deptMatch || exactMatch;
  });
}, [sortedStudents, search, studentHashTable]);
```

**Benefits:**
- O(1) exact match lookups
- Supports multiple key types (QR code, Student ID, UUID)
- Improves search performance

---

## 🔄 Queue Implementation & Usage

### Implementation Location
**File:** `src/utils/dataStructures/Queue.ts`

### Complete Implementation Code

```typescript
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
```

---

### Usage 1: Scanner Page - Managing Scan Operations

**File:** `src/pages/Scanner.tsx`

**Purpose:** Queue QR codes for sequential processing to prevent race conditions

**Code:**
```typescript
import { Queue } from "@/utils/dataStructures/Queue";

// Queue for managing scan operations
const [scanQueue] = useState(() => new Queue<string>());

const handleScan = async (qrCode: string) => {
  if (!selectedEvent) {
    toast.error("Please select an event first");
    return;
  }

  // Add to queue for processing
  scanQueue.enqueue(qrCode);

  // Use HashTable for O(1) lookup instead of database query
  const student = studentHashTable.get(qrCode);

  if (!student) {
    // Fallback to database if not in hash table
    const { data: dbStudent, error } = await supabase
      .from("students")
      .select("*")
      .eq("qr_code", qrCode)
      .maybeSingle();

    if (error || !dbStudent) {
      setScanResult({
        success: false,
        message: "Invalid QR Code. Student not found in database.",
      });
      toast.error("Invalid QR Code");
      setTimeout(() => setScanResult(null), 3000);
      scanQueue.dequeue(); // Remove from queue
      return;
    }

    // Add to hash table for future lookups
    studentHashTable.set(qrCode, dbStudent);
    await processScan(dbStudent);
    scanQueue.dequeue();
    return;
  }

  await processScan(student);
  scanQueue.dequeue();
};
```

**Benefits:**
- Ensures scans are processed in order (FIFO)
- Prevents race conditions when multiple scans occur quickly
- Manages concurrent scan operations

---

### Usage 2: Attendance Page - FIFO Record Display

**File:** `src/pages/Attendance.tsx`

**Purpose:** Maintain FIFO order for attendance records (first scanned = first displayed)

**Code:**
```typescript
import { Queue } from "@/utils/dataStructures/Queue";
import { mergeSort } from "@/utils/algorithms/Sorting";

// Use Queue to maintain FIFO order (first scanned = first displayed)
// Sort by time_in (ascending) to get earliest first
const sortedByTimeIn = useMemo(() => {
  if (!attendanceRecords.length) return [];
  
  return mergeSort([...attendanceRecords], (a, b) => {
    return new Date(a.time_in).getTime() - new Date(b.time_in).getTime();
  });
}, [attendanceRecords]);

// Enqueue records in order (FIFO - First In First Out)
const attendanceQueue = useMemo(() => {
  const queue = new Queue<AttendanceRecord>();
  sortedByTimeIn.forEach(record => {
    queue.enqueue(record);
  });
  return queue;
}, [sortedByTimeIn]);

// Get records from queue in FIFO order
const queuedRecords = useMemo(() => {
  return attendanceQueue.toArray();
}, [attendanceQueue]);
```

**Benefits:**
- Maintains chronological order of attendance
- First scanned students appear first
- Consistent display order

---

## 🔀 Sorting Algorithms Implementation & Usage

### Implementation Location
**File:** `src/utils/algorithms/Sorting.ts`

### Complete Implementation Code

```typescript
/**
 * Sorting Algorithms Implementation
 * Various sorting algorithms with different time complexities
 */

export type CompareFunction<T> = (a: T, b: T) => number;

/**
 * Merge Sort
 * Time Complexity: O(n log n) - Best, Average, Worst
 * Space Complexity: O(n)
 * Stable: Yes
 */
export function mergeSort<T>(arr: T[], compareFn?: CompareFunction<T>): T[] {
  if (arr.length <= 1) {
    return arr;
  }

  const defaultCompare: CompareFunction<T> = compareFn || ((a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });

  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid), defaultCompare);
  const right = mergeSort(arr.slice(mid), defaultCompare);

  return merge(left, right, defaultCompare);
}

function merge<T>(left: T[], right: T[], compareFn: CompareFunction<T>): T[] {
  const result: T[] = [];
  let leftIndex = 0;
  let rightIndex = 0;

  while (leftIndex < left.length && rightIndex < right.length) {
    if (compareFn(left[leftIndex], right[rightIndex]) <= 0) {
      result.push(left[leftIndex]);
      leftIndex++;
    } else {
      result.push(right[rightIndex]);
      rightIndex++;
    }
  }

  return result.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));
}
```

---

### Usage 1: Students Page - Sorting by Name, ID, or Department

**File:** `src/pages/Students.tsx`

**Purpose:** Sort students list efficiently using merge sort

**Code:**
```typescript
import { mergeSort } from "@/utils/algorithms/Sorting";

// Sort students using merge sort (O(n log n))
const sortedStudents = useMemo(() => {
  if (!students || students.length === 0) return [];
  
  const compareFn = (a: Student, b: Student) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "student_id":
        return a.student_id.localeCompare(b.student_id);
      case "department":
        return a.department.localeCompare(b.department);
      default:
        return 0;
    }
  };
  
  return mergeSort([...students], compareFn);
}, [students, sortBy]);
```

**Benefits:**
- O(n log n) time complexity (optimal for comparison-based sorting)
- Stable sort (maintains relative order of equal elements)
- Supports multiple sort criteria

---

### Usage 2: Events Page - Sorting Events by Date

**File:** `src/pages/Events.tsx`

**Purpose:** Sort events chronologically

**Code:**
```typescript
import { mergeSort } from "@/utils/algorithms/Sorting";

const sortedEvents = useMemo(() => {
  if (!events || events.length === 0) return [];
  
  return mergeSort([...events], (a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}, [events]);
```

**Benefits:**
- Consistent sorting performance
- Handles date comparisons correctly
- Maintains event order stability

---

### Usage 3: Officers List - Sorting by Name and Role

**File:** `src/pages/OfficersList.tsx`

**Purpose:** Sort officers alphabetically by name, then by role

**Code:**
```typescript
import { mergeSort } from "@/utils/algorithms/Sorting";

// Sort officers using merge sort (O(n log n))
const sortedOfficers = useMemo(() => {
  return mergeSort([...officers], (a, b) => {
    // Sort by name, then by role
    const nameCompare = a.name.localeCompare(b.name);
    if (nameCompare !== 0) return nameCompare;
    return a.role.localeCompare(b.role);
  });
}, [officers]);
```

**Benefits:**
- Multi-level sorting (name, then role)
- Efficient for large officer lists
- Maintains alphabetical order

---

### Usage 4: Attendance Page - Sorting by Time In

**File:** `src/pages/Attendance.tsx`

**Purpose:** Sort attendance records by time in (earliest first)

**Code:**
```typescript
import { mergeSort } from "@/utils/algorithms/Sorting";

// Use Queue to maintain FIFO order (first scanned = first displayed)
// Sort by time_in (ascending) to get earliest first
const sortedByTimeIn = useMemo(() => {
  if (!attendanceRecords.length) return [];
  
  return mergeSort([...attendanceRecords], (a, b) => {
    return new Date(a.time_in).getTime() - new Date(b.time_in).getTime();
  });
}, [attendanceRecords]);

// Filter by search term and sort by student name
const attendanceWithDetails = useMemo(() => {
  const filtered = studentList.filter((studentData) => {
    const name = studentData.student?.name?.toLowerCase() || "";
    const studentId = studentData.student?.student_id?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();
    return name.includes(search) || studentId.includes(search);
  });
  
  // Sort by student name for display
  return mergeSort([...filtered], (a, b) => {
    const nameA = a.student?.name || "";
    const nameB = b.student?.name || "";
    return nameA.localeCompare(nameB);
  });
}, [studentAttendanceMap, searchTerm]);
```

**Benefits:**
- Chronological ordering of attendance
- Efficient sorting of large attendance lists
- Supports multiple sort criteria

---

## 📈 Performance Summary

### Time Complexity Comparison

| Operation | HashTable | Queue | Merge Sort |
|-----------|-----------|-------|------------|
| **Insert/Add** | O(1) avg | O(1) | N/A |
| **Search/Lookup** | O(1) avg | N/A | N/A |
| **Delete/Remove** | O(1) avg | O(1) | N/A |
| **Sort** | N/A | N/A | O(n log n) |
| **Peek** | N/A | O(1) | N/A |

### Space Complexity

| Data Structure | Space Complexity |
|----------------|------------------|
| HashTable | O(n) |
| Queue | O(n) |
| Merge Sort | O(n) |

---

## 🎯 Key Benefits

1. **HashTable:**
   - Reduces database queries during scanning
   - O(1) lookup time for student records
   - Supports multiple key types

2. **Queue:**
   - Ensures FIFO processing order
   - Prevents race conditions
   - Manages concurrent operations

3. **Merge Sort:**
   - Consistent O(n log n) performance
   - Stable sorting (maintains order)
   - Handles large datasets efficiently

---

## 📝 Notes

- All implementations are custom-built (not using external libraries)
- HashTable uses chaining for collision resolution
- Queue uses dynamic resizing for capacity management
- Merge Sort is used throughout for consistent performance
- All data structures are type-safe with TypeScript generics

