# Data Structures & Algorithms Implementation

This document describes the Python-inspired data structures and algorithms implemented in this TypeScript/React project.

## 📚 Implemented Data Structures

### 1. HashTable (`src/utils/dataStructures/HashTable.ts`)
- **Purpose**: Fast key-value lookups with O(1) average time complexity
- **Features**:
  - Dynamic resizing when load factor exceeds 0.75
  - Collision handling using chaining
  - Methods: `set()`, `get()`, `has()`, `delete()`, `keys()`, `values()`, `entries()`
- **Used in**:
  - **Students Page**: Fast lookup by QR code, Student ID, or UUID
  - **Scanner Page**: O(1) student lookup by QR code (instead of database query)
  - **Officers List**: Fast lookup by email or ID

### 2. Queue (`src/utils/dataStructures/Queue.ts`)
- **Purpose**: FIFO (First In First Out) data structure
- **Features**:
  - O(1) enqueue and dequeue operations
  - Dynamic resizing
  - Methods: `enqueue()`, `dequeue()`, `peek()`, `isEmpty()`, `size()`, `clear()`
- **Used in**:
  - **Scanner Page**: Managing scan operations queue for processing multiple scans

## 🔍 Implemented Algorithms

### 1. Sorting Algorithms (`src/utils/algorithms/Sorting.ts`)

#### Merge Sort
- **Time Complexity**: O(n log n) - Best, Average, Worst
- **Space Complexity**: O(n)
- **Stable**: Yes
- **Used in**: Students, Events, Officers lists

#### Quick Sort
- **Time Complexity**: O(n log n) average, O(n²) worst case
- **Space Complexity**: O(log n)
- **Stable**: No
- **Available for use**: Can be used for in-place sorting

#### Heap Sort
- **Time Complexity**: O(n log n) - Best, Average, Worst
- **Space Complexity**: O(1)
- **Stable**: No

#### Insertion Sort
- **Time Complexity**: O(n²) worst, O(n) best (nearly sorted)
- **Space Complexity**: O(1)
- **Stable**: Yes
- **Best for**: Small arrays or nearly sorted data

#### Selection Sort
- **Time Complexity**: O(n²) - Best, Average, Worst
- **Space Complexity**: O(1)
- **Stable**: No

### 2. Binary Search (`src/utils/algorithms/BinarySearch.ts`)
- **Time Complexity**: O(log n)
- **Requirement**: Array must be sorted
- **Functions**:
  - `binarySearch()`: Find index of target
  - `binarySearchFirst()`: Find first occurrence
  - `binarySearchLast()`: Find last occurrence
  - `binarySearchInsertionPoint()`: Find insertion point
  - `binarySearchContains()`: Check if element exists
- **Used in**: Search functionality across the application

## 🎯 Implementation Details

### Students Page (`src/pages/Students.tsx`)
- **HashTable**: Stores students indexed by QR code, Student ID, and UUID for O(1) lookups
- **Merge Sort**: Sorts students by name, student_id, or department (user-selectable)
- **Binary Search**: Used in search filtering for efficient lookups
- **Performance**: 
  - Lookup: O(1) with HashTable
  - Sorting: O(n log n) with Merge Sort
  - Search: O(log n) with Binary Search

### Scanner Page (`src/pages/Scanner.tsx`)
- **HashTable**: Pre-loads all students for O(1) QR code lookups (no database query needed)
- **Queue**: Manages scan operations in FIFO order
- **Performance**:
  - Student lookup: O(1) instead of O(n) database query
  - Scan processing: Queued for orderly handling

### Events Page (`src/pages/Events.tsx`)
- **Merge Sort**: Sorts events by date (newest first)
- **Performance**: O(n log n) sorting

### Officers List (`src/pages/OfficersList.tsx`)
- **HashTable**: Fast lookup by email or ID
- **Merge Sort**: Sorts officers by name and role
- **Performance**: 
  - Lookup: O(1)
  - Sorting: O(n log n)

## 📊 Performance Comparison

| Operation | Before | After | Improvement |
|-----------|--------|-------|-------------|
| Student lookup by QR | O(n) database query | O(1) HashTable | **O(n) → O(1)** |
| Sorting students | O(n²) or native sort | O(n log n) Merge Sort | **Optimized** |
| Search in sorted array | O(n) linear search | O(log n) Binary Search | **O(n) → O(log n)** |
| Scan queue processing | No queue | O(1) Queue operations | **Ordered processing** |

## 🚀 Usage Examples

### HashTable Example
```typescript
import { HashTable } from "@/utils/dataStructures/HashTable";

const hashTable = new HashTable<string, Student>();
hashTable.set("QR-2024-00001", student);
const student = hashTable.get("QR-2024-00001"); // O(1)
```

### Queue Example
```typescript
import { Queue } from "@/utils/dataStructures/Queue";

const queue = new Queue<string>();
queue.enqueue("scan1");
queue.enqueue("scan2");
const first = queue.dequeue(); // "scan1" - O(1)
```

### Sorting Example
```typescript
import { mergeSort } from "@/utils/algorithms/Sorting";

const sorted = mergeSort(students, (a, b) => 
  a.name.localeCompare(b.name)
); // O(n log n)
```

### Binary Search Example
```typescript
import { binarySearch } from "@/utils/algorithms/BinarySearch";

const index = binarySearch(sortedArray, target); // O(log n)
const exists = binarySearchContains(sortedArray, target);
```

## 📝 Notes

- All implementations are **type-safe** with TypeScript
- **Memory efficient**: HashTable and Queue resize dynamically
- **Production-ready**: Error handling and edge cases covered
- **Python-inspired**: Similar API and behavior to Python's built-in data structures

## 🔄 Future Enhancements

- Add more sorting algorithms (Radix Sort, Counting Sort)
- Implement Binary Search Tree (BST)
- Add Graph data structures for relationship mapping
- Implement Priority Queue for scan priority management

