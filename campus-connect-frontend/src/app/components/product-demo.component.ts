import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ProductService } from '../services/product.service';
import { Product } from '../models/product.model';

/**
 * Product Demo Component
 * 
 * This component demonstrates:
 * 1. How TypeScript interfaces integrate with Angular components
 * 2. Type-safe data handling in component logic
 * 3. Strong typing prevents runtime errors
 * 4. IntelliSense support for better development experience
 */

@Component({
  selector: 'app-product-demo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="product-demo-container">
      <h2>TypeScript Product Demo</h2>
      
      <div class="demo-section">
        <h3>All Products</h3>
        <button (click)="loadProducts()" class="btn-primary">
          Load Products
        </button>
        
        <div *ngIf="products.length > 0" class="product-list">
          <div *ngFor="let product of products" class="product-card">
            <h4>{{ product.name }}</h4>
            <p class="price">\${{ product.price.toFixed(2) }}</p>
            <p class="category">Category: {{ product.category }}</p>
            <p *ngIf="product.description" class="description">
              {{ product.description }}
            </p>
            <p *ngIf="product.stock !== undefined" class="stock">
              Stock: {{ product.stock }}
            </p>
            <span *ngIf="product.inStock" class="badge-success">In Stock</span>
          </div>
        </div>
      </div>

      <div class="demo-section">
        <h3>Type Safety Demo</h3>
        <button (click)="demonstrateTypeSafety()" class="btn-secondary">
          Run Type Safety Demo
        </button>
        <pre *ngIf="typeSafetyOutput">{{ typeSafetyOutput }}</pre>
      </div>

      <div class="demo-section">
        <h3>Console Output</h3>
        <p>Check browser console (F12) to see TypeScript type information</p>
      </div>
    </div>
  `,
  styles: [`
    .product-demo-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .demo-section {
      margin: 30px 0;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 8px;
    }

    .product-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }

    .product-card {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 15px;
      background: #f9f9f9;
    }

    .product-card h4 {
      margin: 0 0 10px 0;
      color: #333;
    }

    .price {
      font-size: 1.2em;
      font-weight: bold;
      color: #2196F3;
      margin: 5px 0;
    }

    .category {
      color: #666;
      font-size: 0.9em;
    }

    .description {
      color: #555;
      font-size: 0.9em;
      margin: 10px 0;
    }

    .stock {
      color: #888;
      font-size: 0.85em;
    }

    .badge-success {
      display: inline-block;
      padding: 4px 8px;
      background: #4CAF50;
      color: white;
      border-radius: 4px;
      font-size: 0.8em;
    }

    .btn-primary, .btn-secondary {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1em;
    }

    .btn-primary {
      background: #2196F3;
      color: white;
    }

    .btn-secondary {
      background: #FF9800;
      color: white;
    }

    .btn-primary:hover {
      background: #1976D2;
    }

    .btn-secondary:hover {
      background: #F57C00;
    }

    pre {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 0.9em;
    }
  `]
})
export class ProductDemoComponent implements OnInit, OnDestroy {
  /**
   * Type annotation: Product[]
   * TypeScript ensures this array only contains Product objects
   * Attempting to add incompatible objects will cause compile errors
   */
  products: Product[] = [];

  /**
   * Optional type for single product
   * Can be Product or undefined
   */
  selectedProduct: Product | undefined;

  /**
   * String type for demo output
   */
  typeSafetyOutput: string = '';

  /**
   * Subscription management for memory leak prevention
   */
  private subscriptions: Subscription = new Subscription();

  /**
   * Constructor with dependency injection
   * TypeScript ensures ProductService is properly typed
   */
  constructor(private productService: ProductService) {
    console.log('ProductDemoComponent initialized');
  }

  /**
   * Lifecycle hook - runs when component initializes
   */
  ngOnInit(): void {
    console.log('Component loaded - TypeScript ensures type safety throughout');
    this.loadProducts();
  }

  /**
   * Lifecycle hook - cleanup subscriptions
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Load products from service
   * 
   * TypeScript Benefits Demonstrated:
   * 1. Observable<Product[]> ensures we receive an array of Products
   * 2. IntelliSense shows available properties on product objects
   * 3. Compile-time errors if we try to access non-existent properties
   */
  loadProducts(): void {
    console.log('\n=== Loading Products ===');
    console.log('TypeScript ensures type safety in async operations');

    // Subscribe to the Observable<Product[]>
    const sub = this.productService.getMockProducts().subscribe({
      next: (products: Product[]) => {
        // TypeScript knows products is Product[], providing autocomplete
        this.products = products;
        
        console.log(`\nReceived ${products.length} products`);
        console.log('TypeScript enforces the Product interface structure:\n');
        
        // Demonstrate type safety with detailed logging
        products.forEach((product: Product, index: number) => {
          console.log(`Product ${index + 1}:`);
          console.log(`  - ID: ${product.id} (type: number)`);
          console.log(`  - Name: ${product.name} (type: string)`);
          console.log(`  - Price: $${product.price} (type: number)`);
          console.log(`  - Category: ${product.category} (type: string)`);
          
          // Optional fields - TypeScript allows undefined
          if (product.description) {
            console.log(`  - Description: ${product.description} (optional string)`);
          }
          if (product.stock !== undefined) {
            console.log(`  - Stock: ${product.stock} (optional number)`);
          }
          if (product.inStock !== undefined) {
            console.log(`  - In Stock: ${product.inStock} (optional boolean)`);
          }
          console.log('');
        });

        // This would cause a TypeScript error (uncomment to see):
        // products.forEach(p => console.log(p.invalidProperty));
        // Error: Property 'invalidProperty' does not exist on type 'Product'
      },
      error: (error: Error) => {
        console.error('Error loading products:', error);
      },
      complete: () => {
        console.log('Product loading complete');
      }
    });

    this.subscriptions.add(sub);
  }

  /**
   * Demonstrate TypeScript type safety features
   */
  demonstrateTypeSafety(): void {
    console.log('\n=== TypeScript Type Safety Demonstration ===\n');

    // 1. Creating a properly typed product
    const validProduct: Product = {
      id: 999,
      name: 'Demo Product',
      price: 49.99,
      category: 'Demo',
      description: 'This product follows the Product interface',
      stock: 10,
      inStock: true
    };
    console.log('✓ Valid Product created:', validProduct);

    // 2. Optional fields can be omitted
    const minimalProduct: Product = {
      id: 1000,
      name: 'Minimal Product',
      price: 19.99,
      category: 'Demo'
      // description, stock, and inStock are optional
    };
    console.log('✓ Minimal Product (optional fields omitted):', minimalProduct);

    // 3. Type checking prevents errors
    console.log('\n--- Type Safety Examples ---');
    console.log('TypeScript prevents these common errors at compile time:');
    
    const output = `
Type Safety Benefits:

1. Required Fields Enforcement:
   ✓ id, name, price, category are required
   ✗ Missing any required field = compile error

2. Type Checking:
   ✓ id must be a number
   ✓ name must be a string
   ✓ price must be a number
   ✗ Wrong type = compile error

3. Optional Fields:
   ✓ description?: string (can be undefined)
   ✓ stock?: number (can be undefined)
   ✓ inStock?: boolean (can be undefined)

4. IntelliSense Support:
   ✓ Autocomplete for all properties
   ✓ Type hints in IDE
   ✓ Refactoring safety

5. Generic Types:
   ✓ Observable<Product[]> ensures array of Products
   ✓ Observable<Product> ensures single Product
   ✗ Observable<any> = no type safety

Example: Accessing product properties
${this.products.length > 0 ? `
Product: ${this.products[0].name}
Price: $${this.products[0].price.toFixed(2)}
Category: ${this.products[0].category}
` : 'Load products first to see example'}

Try accessing a non-existent property:
// product.invalidProperty 
// ❌ TypeScript Error: Property 'invalidProperty' does not exist on type 'Product'
    `;

    this.typeSafetyOutput = output;
    console.log(output);

    // 4. Demonstrate type inference
    const inferredProduct = this.products[0]; // TypeScript infers type as Product
    if (inferredProduct) {
      console.log('\n--- Type Inference ---');
      console.log('TypeScript automatically infers inferredProduct as Product type');
      console.log('We get full IntelliSense support without explicit type annotation');
    }

    // 5. Demonstrate array typing
    console.log('\n--- Array Type Safety ---');
    console.log('products: Product[] ensures array only contains Products');
    console.log(`Current products count: ${this.products.length}`);
    
    // This would cause an error:
    // this.products.push({ invalid: 'object' });
    // Error: Type '{ invalid: string }' is not assignable to type 'Product'
  }

  /**
   * Select a product (demonstrates union types)
   */
  selectProduct(product: Product): void {
    this.selectedProduct = product;
    console.log('Selected product:', product);
  }

  /**
   * Calculate total price (demonstrates type-safe operations)
   */
  calculateTotalPrice(): number {
    // TypeScript ensures price is a number, making this operation safe
    return this.products.reduce((total: number, product: Product) => {
      return total + product.price;
    }, 0);
  }

  /**
   * Filter products by category (demonstrates type-safe filtering)
   */
  filterByCategory(category: string): Product[] {
    // TypeScript ensures the filter returns Product[]
    return this.products.filter((product: Product) => {
      return product.category === category;
    });
  }
}
