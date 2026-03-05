import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  private apiUrl = 'http://localhost:8082/api';

  constructor(private http: HttpClient) {}

  // Fees
  getFees(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/fees`);
  }

  createFee(fee: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/fees`, fee);
  }

  // Payments
  getPayments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/payments`);
  }

  createPayment(payment: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/payments`, payment);
  }

  // Invoices
  getInvoices(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/invoices`);
  }

  createInvoice(invoice: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/invoices`, invoice);
  }
}
