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

/**
 * Quick Sort
 * Time Complexity: O(n log n) average, O(n²) worst case
 * Space Complexity: O(log n)
 * Stable: No
 */
export function quickSort<T>(arr: T[], compareFn?: CompareFunction<T>): T[] {
  if (arr.length <= 1) {
    return arr;
  }

  const defaultCompare: CompareFunction<T> = compareFn || ((a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });

  const pivot = arr[Math.floor(arr.length / 2)];
  const left: T[] = [];
  const middle: T[] = [];
  const right: T[] = [];

  for (const item of arr) {
    const cmp = defaultCompare(item, pivot);
    if (cmp < 0) {
      left.push(item);
    } else if (cmp > 0) {
      right.push(item);
    } else {
      middle.push(item);
    }
  }

  return [
    ...quickSort(left, defaultCompare),
    ...middle,
    ...quickSort(right, defaultCompare)
  ];
}

/**
 * Heap Sort
 * Time Complexity: O(n log n) - Best, Average, Worst
 * Space Complexity: O(1)
 * Stable: No
 */
export function heapSort<T>(arr: T[], compareFn?: CompareFunction<T>): T[] {
  const defaultCompare: CompareFunction<T> = compareFn || ((a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });

  const result = [...arr];
  const n = result.length;

  // Build max heap
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapify(result, n, i, defaultCompare);
  }

  // Extract elements from heap one by one
  for (let i = n - 1; i > 0; i--) {
    [result[0], result[i]] = [result[i], result[0]];
    heapify(result, i, 0, defaultCompare);
  }

  return result;
}

function heapify<T>(arr: T[], n: number, i: number, compareFn: CompareFunction<T>): void {
  let largest = i;
  const left = 2 * i + 1;
  const right = 2 * i + 2;

  if (left < n && compareFn(arr[left], arr[largest]) > 0) {
    largest = left;
  }

  if (right < n && compareFn(arr[right], arr[largest]) > 0) {
    largest = right;
  }

  if (largest !== i) {
    [arr[i], arr[largest]] = [arr[largest], arr[i]];
    heapify(arr, n, largest, compareFn);
  }
}

/**
 * Insertion Sort
 * Time Complexity: O(n²) - Best: O(n), Worst: O(n²)
 * Space Complexity: O(1)
 * Stable: Yes
 * Good for small arrays or nearly sorted arrays
 */
export function insertionSort<T>(arr: T[], compareFn?: CompareFunction<T>): T[] {
  const result = [...arr];
  const defaultCompare: CompareFunction<T> = compareFn || ((a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });

  for (let i = 1; i < result.length; i++) {
    const key = result[i];
    let j = i - 1;

    while (j >= 0 && defaultCompare(result[j], key) > 0) {
      result[j + 1] = result[j];
      j--;
    }
    result[j + 1] = key;
  }

  return result;
}

/**
 * Selection Sort
 * Time Complexity: O(n²) - Best, Average, Worst
 * Space Complexity: O(1)
 * Stable: No
 */
export function selectionSort<T>(arr: T[], compareFn?: CompareFunction<T>): T[] {
  const result = [...arr];
  const defaultCompare: CompareFunction<T> = compareFn || ((a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });

  for (let i = 0; i < result.length - 1; i++) {
    let minIndex = i;
    for (let j = i + 1; j < result.length; j++) {
      if (defaultCompare(result[j], result[minIndex]) < 0) {
        minIndex = j;
      }
    }
    if (minIndex !== i) {
      [result[i], result[minIndex]] = [result[minIndex], result[i]];
    }
  }

  return result;
}

