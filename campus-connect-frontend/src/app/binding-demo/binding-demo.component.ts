import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-binding-demo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="binding-demo-container">
      <h1>Angular Binding Demo</h1>

      <!-- ── 1. INTERPOLATION ── -->
      <section class="card">
        <h2>1. Interpolation {{ '{{ }}' }}</h2>
        <p>Component title: <strong>{{ title }}</strong></p>
        <p>Current year: <strong>{{ currentYear }}</strong></p>
      </section>

      <!-- ── 2. PROPERTY BINDING ── -->
      <section class="card">
        <h2>2. Property Binding [ ]</h2>
        <img [src]="imgUrl" [alt]="imgAlt" width="150" />
        <br /><br />
        <button [disabled]="isDisabled" class="btn">
          {{ isDisabled ? 'Button Disabled' : 'Button Enabled' }}
        </button>
        <br /><br />
        <button (click)="toggleDisabled()" class="btn btn-secondary">
          Toggle Button State
        </button>
      </section>

      <!-- ── 3. EVENT BINDING ── -->
      <section class="card">
        <h2>3. Event Binding ( )</h2>
        <p>Count: <strong>{{ count }}</strong></p>
        <button (click)="increment()" class="btn">Increment</button>
        <button (click)="decrement()" class="btn btn-secondary">Decrement</button>
        <button (click)="reset()" class="btn btn-danger">Reset</button>
        <p *ngIf="lastAction">Last action: <em>{{ lastAction }}</em></p>
      </section>

      <!-- ── 4. TWO-WAY BINDING ── -->
      <section class="card">
        <h2>4. Two-Way Binding [( )]</h2>
        <input
          [(ngModel)]="username"
          placeholder="Enter your name"
          class="input"
        />
        <p *ngIf="username">Hello, <strong>{{ username }}</strong>!</p>
        <p *ngIf="!username" class="hint">Start typing to see two-way binding in action.</p>
      </section>
    </div>
  `,
  styles: [`
    .binding-demo-container {
      max-width: 640px;
      margin: 2rem auto;
      font-family: sans-serif;
      padding: 0 1rem;
    }
    h1 { text-align: center; margin-bottom: 1.5rem; }
    .card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 1.25rem 1.5rem;
      margin-bottom: 1.5rem;
      background: #fafafa;
    }
    h2 { margin-top: 0; color: #333; }
    .btn {
      padding: 0.4rem 1rem;
      margin-right: 0.5rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      background: #1976d2;
      color: #fff;
    }
    .btn:disabled { background: #aaa; cursor: not-allowed; }
    .btn-secondary { background: #555; }
    .btn-danger { background: #c62828; }
    .input {
      padding: 0.4rem 0.75rem;
      border: 1px solid #bbb;
      border-radius: 4px;
      font-size: 1rem;
      width: 100%;
      box-sizing: border-box;
    }
    .hint { color: #888; font-style: italic; }
  `]
})
export class BindingDemoComponent {
  // ── Interpolation ──
  title = 'Binding Demo Component';
  currentYear = new Date().getFullYear();

  // ── Property Binding ──
  imgUrl = 'https://picsum.photos/150';
  imgAlt = 'Random placeholder image';
  isDisabled = false;

  // ── Event Binding ──
  count = 0;
  lastAction = '';

  increment() {
    this.count++;
    this.lastAction = 'incremented';
  }

  decrement() {
    this.count--;
    this.lastAction = 'decremented';
  }

  reset() {
    this.count = 0;
    this.lastAction = 'reset';
  }

  toggleDisabled() {
    this.isDisabled = !this.isDisabled;
  }

  // ── Two-Way Binding ──
  username = '';
}
