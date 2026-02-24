import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HostelService } from '../../services/hostel.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-hostel',
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
          <li><a routerLink="/finance">Finance</a></li>
          <li><a routerLink="/hostel" class="active">Hostel</a></li>
          <li><a routerLink="/library">Library</a></li>
          <li><a routerLink="/hr">HR</a></li>
        </ul>
      </nav>

      <div class="container">
        <h1>🏠 Hostel Module</h1>

        <div class="card">
          <div class="card-header">Create Room</div>
          <form [formGroup]="roomForm" (ngSubmit)="createRoom()">
            <div class="form-group">
              <label>Room Number</label>
              <input type="text" formControlName="room_number" placeholder="e.g., 101" />
            </div>
            <div class="form-group">
              <label>Hostel Name</label>
              <input type="text" formControlName="hostel_name" placeholder="e.g., Sunrise Hostel" />
            </div>
            <div class="form-group">
              <label>Capacity</label>
              <input type="number" formControlName="capacity" placeholder="e.g., 3" />
            </div>
            <div class="form-group">
              <label>Room Type</label>
              <select formControlName="room_type">
                <option value="">Select Type</option>
                <option value="single">Single</option>
                <option value="double">Double</option>
                <option value="triple">Triple</option>
              </select>
            </div>
            <div class="form-group">
              <label>Floor</label>
              <input type="number" formControlName="floor" placeholder="e.g., 1" />
            </div>
            <button type="submit" [disabled]="roomForm.invalid">Add Room</button>
          </form>
        </div>

        <div class="card">
          <div class="card-header">All Rooms</div>
          <div *ngIf="loading" class="spinner"></div>
          <table *ngIf="!loading && rooms.length > 0">
            <thead>
              <tr>
                <th>Room Number</th>
                <th>Hostel</th>
                <th>Type</th>
                <th>Floor</th>
                <th>Occupied / Capacity</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let room of rooms">
                <td>{{ room.room_number }}</td>
                <td>{{ room.hostel_name }}</td>
                <td>{{ room.room_type }}</td>
                <td>{{ room.floor }}</td>
                <td>{{ room.occupied }} / {{ room.capacity }}</td>
              </tr>
            </tbody>
          </table>
          <p *ngIf="!loading && rooms.length === 0">No rooms found.</p>
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
export class HostelComponent implements OnInit {
  rooms: any[] = [];
  roomForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private hostelService: HostelService,
    private authService: AuthService
  ) {
    this.roomForm = this.fb.group({
      room_number: ['', Validators.required],
      hostel_name: ['', Validators.required],
      capacity: [0, [Validators.required, Validators.min(1)]],
      room_type: ['', Validators.required],
      floor: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadRooms();
  }

  loadRooms(): void {
    this.loading = true;
    this.hostelService.getRooms().subscribe({
      next: (data) => {
        this.rooms = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading rooms:', error);
        this.loading = false;
      }
    });
  }

  createRoom(): void {
    if (this.roomForm.valid) {
      this.hostelService.createRoom(this.roomForm.value).subscribe({
        next: () => {
          alert('Room created successfully!');
          this.roomForm.reset();
          this.loadRooms();
        },
        error: (error) => console.error('Error creating room:', error)
      });
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
