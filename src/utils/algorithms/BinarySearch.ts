/**
 * Binary Search Implementation
 * Time Complexity: O(log n)
 * Requires: Array must be sorted
 */

export type CompareFunction<T> = (a: T, b: T) => number;

/**
 * Binary Search - Find index of target in sorted array
 * Returns -1 if not found
 * Time Complexity: O(log n)
 */
export function binarySearch<T>(
  arr: T[],
  target: T,
  compareFn?: CompareFunction<T>
): number {
  if (arr.length === 0) {
    return -1;
  }

  const defaultCompare: CompareFunction<T> = compareFn || ((a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });

  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const comparison = defaultCompare(arr[mid], target);

    if (comparison === 0) {
      return mid; // Found
    } else if (comparison < 0) {
      left = mid + 1; // Search right half
    } else {
      right = mid - 1; // Search left half
    }
  }

  return -1; // Not found
}

/**
 * Binary Search - Find first occurrence of target
 * Useful for finding the first element in a range
 * Time Complexity: O(log n)
 */
export function binarySearchFirst<T>(
  arr: T[],
  target: T,
  compareFn?: CompareFunction<T>
): number {
  if (arr.length === 0) {
    return -1;
  }

  const defaultCompare: CompareFunction<T> = compareFn || ((a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });

  let left = 0;
  let right = arr.length - 1;
  let result = -1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const comparison = defaultCompare(arr[mid], target);

    if (comparison === 0) {
      result = mid;
      right = mid - 1; // Continue searching left for first occurrence
    } else if (comparison < 0) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return result;
}

/**
 * Binary Search - Find last occurrence of target
 * Time Complexity: O(log n)
 */
export function binarySearchLast<T>(
  arr: T[],
  target: T,
  compareFn?: CompareFunction<T>
): number {
  if (arr.length === 0) {
    return -1;
  }

  const defaultCompare: CompareFunction<T> = compareFn || ((a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });

  let left = 0;
  let right = arr.length - 1;
  let result = -1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const comparison = defaultCompare(arr[mid], target);

    if (comparison === 0) {
      result = mid;
      left = mid + 1; // Continue searching right for last occurrence
    } else if (comparison < 0) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return result;
}

/**
 * Binary Search - Find insertion point (lower bound)
 * Returns the index where target should be inserted to maintain sorted order
 * Time Complexity: O(log n)
 */
export function binarySearchInsertionPoint<T>(
  arr: T[],
  target: T,
  compareFn?: CompareFunction<T>
): number {
  const defaultCompare: CompareFunction<T> = compareFn || ((a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });

  let left = 0;
  let right = arr.length;

  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (defaultCompare(arr[mid], target) < 0) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  return left;
}

/**
 * Binary Search - Check if element exists
 * Time Complexity: O(log n)
 */
export function binarySearchContains<T>(
  arr: T[],
  target: T,
  compareFn?: CompareFunction<T>
): boolean {
  return binarySearch(arr, target, compareFn) !== -1;
}

