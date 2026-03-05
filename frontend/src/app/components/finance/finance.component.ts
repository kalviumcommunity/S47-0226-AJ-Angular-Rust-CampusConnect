import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FinanceService } from '../../services/finance.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div>
      <nav>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h1 class="logo">🏫 CampusConnect</h1>
          <button (click)="logout()" style="background-color: #e74c3c;">Logout</button>
        </div>
        <ul>
          <li><a routerLink="/dashboard">Dashboard</a></li>
          <li><a routerLink="/academics">Academics</a></li>
          <li><a routerLink="/finance" class="active">Finance</a></li>
          <li><a routerLink="/hostel">Hostel</a></li>
          <li><a routerLink="/library">Library</a></li>
          <li><a routerLink="/hr">HR</a></li>
        </ul>
      </nav>

      <div class="container">
        <h1>💰 Finance Module</h1>

        <div class="card">
          <div class="card-header">Create Fee</div>
          <form [formGroup]="feeForm" (ngSubmit)="createFee()">
            <div class="form-group">
              <label>Student ID</label>
              <input type="text" formControlName="student_id" placeholder="e.g., STU001" />
            </div>
            <div class="form-group">
              <label>Fee Type</label>
              <select formControlName="fee_type">
                <option value="">Select Type</option>
                <option value="tuition">Tuition</option>
                <option value="hostel">Hostel</option>
                <option value="library">Library</option>
                <option value="misc">Miscellaneous</option>
              </select>
            </div>
            <div class="form-group">
              <label>Amount</label>
              <input type="number" formControlName="amount" placeholder="e.g., 5000" />
            </div>
            <div class="form-group">
              <label>Due Date</label>
              <input type="date" formControlName="due_date" />
            </div>
            <button type="submit" [disabled]="feeForm.invalid">Add Fee</button>
          </form>
        </div>

        <div class="card">
          <div class="card-header">All Fees</div>
          <div *ngIf="loading" class="spinner"></div>
          <table *ngIf="!loading && fees.length > 0">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let fee of fees">
                <td>{{ fee.student_id }}</td>
                <td>{{ fee.fee_type }}</td>
                <td>\${{ fee.amount }}</td>
                <td>{{ fee.due_date }}</td>
                <td><span [style.color]="fee.status === 'paid' ? 'green' : 'orange'">{{ fee.status }}</span></td>
              </tr>
            </tbody>
          </table>
          <p *ngIf="!loading && fees.length === 0">No fees found.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .active {
      background-color: #34495e !important;
    }
  `]
})
export class FinanceComponent implements OnInit {
  fees: any[] = [];
  feeForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private financeService: FinanceService,
    private authService: AuthService
  ) {
    this.feeForm = this.fb.group({
      student_id: ['', Validators.required],
      fee_type: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(1)]],
      due_date: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadFees();
  }

  loadFees(): void {
    this.loading = true;
    this.financeService.getFees().subscribe({
      next: (data) => {
        this.fees = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading fees:', error);
        this.loading = false;
      }
    });
  }

  createFee(): void {
    if (this.feeForm.valid) {
      this.financeService.createFee(this.feeForm.value).subscribe({
        next: () => {
          alert('Fee created successfully!');
          this.feeForm.reset();
          this.loadFees();
        },
        error: (error) => console.error('Error creating fee:', error)
      });
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
