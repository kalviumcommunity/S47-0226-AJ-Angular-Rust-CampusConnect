import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Product, ProductResponse, CreateProductRequest } from '../models/product.model';
import { environment } from '../../environments/environment';

/**
 * Product Service
 * 
 * This service demonstrates TypeScript's integration with Angular:
 * 1. Generic types with Observable<T> for type-safe async operations
 * 2. Interface usage for method parameters and return types
 * 3. Type inference and type guards
 * 4. Strong typing prevents common errors like typos in property names
 */

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  // Type annotation ensures baseUrl is always a string
  private baseUrl: string = `${environment.authServiceUrl}/api/products`;

  /**
   * Constructor with dependency injection
   * TypeScript ensures HttpClient is properly typed
   */
  constructor(private http: HttpClient) {
    console.log('ProductService initialized with baseUrl:', this.baseUrl);
  }

  /**
   * Get all products
   * 
   * Return type: Observable<Product[]>
   * - Observable: Async stream from RxJS
   * - <Product[]>: Generic type parameter ensures we get an array of Products
   * - TypeScript will enforce that the response matches Product interface
   * 
   * Without TypeScript: Observable<any> - no type safety, prone to errors
   * With TypeScript: Observable<Product[]> - compile-time checking, IntelliSense support
   */
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.baseUrl).pipe(
      tap((products: Product[]) => {
        // TypeScript knows products is Product[], so we get autocomplete
        console.log(`Fetched ${products.length} products`);
        
        // Type safety: TypeScript will error if we try to access non-existent properties
        products.forEach((product: Product) => {
          console.log(`Product: ${product.name} - $${product.price}`);
          // product.invalidProperty would cause a TypeScript error!
        });
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get a single product by ID
   * 
   * @param id - Type annotation ensures only numbers are passed
   * @returns Observable<Product> - single product, not an array
   */
  getProductById(id: number): Observable<Product> {
    // TypeScript ensures id is a number, preventing string concatenation bugs
    return this.http.get<Product>(`${this.baseUrl}/${id}`).pipe(
      tap((product: Product) => {
        console.log('Fetched product:', product);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Create a new product
   * 
   * @param product - Uses CreateProductRequest type (Product without id)
   * @returns Observable<Product> - returns the created product with generated id
   * 
   * TypeScript benefit: Prevents accidentally sending an id field
   */
  createProduct(product: CreateProductRequest): Observable<Product> {
    return this.http.post<Product>(this.baseUrl, product).pipe(
      tap((newProduct: Product) => {
        console.log('Created product with ID:', newProduct.id);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Update an existing product
   * 
   * @param id - Product ID (number type enforced)
   * @param product - Partial<Product> allows updating only some fields
   */
  updateProduct(id: number, product: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/${id}`, product).pipe(
      tap((updatedProduct: Product) => {
        console.log('Updated product:', updatedProduct);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Delete a product
   * 
   * @param id - Product ID to delete
   * @returns Observable<void> - no return data expected
   */
  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        console.log(`Deleted product with ID: ${id}`);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Search products by category
   * 
   * Demonstrates method with typed parameters and return values
   */
  getProductsByCategory(category: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/category/${category}`).pipe(
      map((products: Product[]) => {
        // TypeScript ensures type safety in transformations
        return products.filter((p: Product) => p.inStock !== false);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Mock data for demonstration (when backend is not available)
   * 
   * Return type matches the interface exactly
   * TypeScript will error if any required field is missing
   */
  getMockProducts(): Observable<Product[]> {
    const mockProducts: Product[] = [
      {
        id: 1,
        name: 'Laptop',
        price: 999.99,
        category: 'Electronics',
        description: 'High-performance laptop for students',
        stock: 15,
        inStock: true
      },
      {
        id: 2,
        name: 'Textbook: Data Structures',
        price: 89.99,
        category: 'Books',
        description: 'Comprehensive guide to data structures and algorithms',
        stock: 50,
        inStock: true
      },
      {
        id: 3,
        name: 'Scientific Calculator',
        price: 29.99,
        category: 'Electronics',
        // description is optional, so we can omit it
        stock: 100,
        inStock: true
      },
      {
        id: 4,
        name: 'Campus Hoodie',
        price: 45.00,
        category: 'Clothing',
        description: 'Official campus merchandise',
        // stock and inStock are optional
      }
    ];

    // of() creates an Observable from the array
    // TypeScript infers the type as Observable<Product[]>
    return of(mockProducts).pipe(
      tap((products: Product[]) => {
        console.log('Returning mock products:', products);
      })
    );
  }

  /**
   * Private error handler
   * 
   * Demonstrates typed error handling
   * @param error - HttpErrorResponse is typed by Angular
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
