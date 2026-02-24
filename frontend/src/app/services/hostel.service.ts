import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HostelService {
  private apiUrl = 'http://localhost:8083/api';

  constructor(private http: HttpClient) {}

  // Rooms
  getRooms(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/rooms`);
  }

  createRoom(room: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/rooms`, room);
  }

  // Allocations
  getAllocations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/allocations`);
  }

  allocateRoom(allocation: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/allocations`, allocation);
  }

  // Maintenance
  getMaintenanceRequests(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/maintenance`);
  }

  createMaintenanceRequest(request: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/maintenance`, request);
  }
}
