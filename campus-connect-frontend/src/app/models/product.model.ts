/**
 * Product Model Interface
 * 
 * This interface demonstrates TypeScript's type system in Angular:
 * - Strong typing for data structures
 * - Optional properties using the ? operator
 * - Clear contract for product-related data
 * 
 * TypeScript Benefits:
 * 1. Compile-time type checking prevents runtime errors
 * 2. IntelliSense support in IDEs for better developer experience
 * 3. Self-documenting code through explicit types
 * 4. Refactoring safety across the application
 */

export interface Product {
  /**
   * Unique identifier for the product
   * Type: number - ensures ID is always numeric
   */
  id: number;

  /**
   * Product name
   * Type: string - enforces text-only values
   */
  name: string;

  /**
   * Product price in currency units
   * Type: number - ensures mathematical operations are safe
   */
  price: number;

  /**
   * Product category (e.g., Electronics, Books, Clothing)
   * Type: string
   */
  category: string;

  /**
   * Optional detailed description
   * The ? makes this field optional - can be undefined
   */
  description?: string;

  /**
   * Optional stock quantity
   * Demonstrates optional numeric field
   */
  stock?: number;

  /**
   * Optional flag indicating if product is available
   * Demonstrates optional boolean field with default behavior
   */
  inStock?: boolean;
}

/**
 * Additional interface for API responses
 * Demonstrates how TypeScript interfaces can be composed
 */
export interface ProductResponse {
  success: boolean;
  data: Product[];
  message?: string;
}

/**
 * Interface for creating new products (without ID)
 * Demonstrates TypeScript's Omit utility type
 */
export type CreateProductRequest = Omit<Product, 'id'>;
