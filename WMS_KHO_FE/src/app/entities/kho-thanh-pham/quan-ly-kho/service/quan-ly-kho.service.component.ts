import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class QuanLyKhoService {
  private baseUrl = environment.apiUrl;      

  constructor(private http: HttpClient) {}

  //scan check
  getInventoryByIdentifier(identifier: string): Observable<any> {
    const url = `${this.baseUrl}/inventories/${identifier}`;
    return this.http.get<any>(url);
  }

  //cap nhat ton
  updateInventoryQuantity(payload: {
    available_quantity: number;
    inventory_identifier: string;
    updated_by: string;
  }): Observable<any> {
    const url = `${this.baseUrl}/inventories/inventory/update-quantity`;
    return this.http.put<any>(url, payload);
  }

  //cap nhat kho
  updateInventoryLocation(payload: {
    location_id: number;
    inventory_identifier: string;
    updated_by: string;
  }): Observable<any> {
    const url = `${this.baseUrl}/inventories/inventory/update-location`;
    return this.http.put<any>(url, payload);
  }

  //danh sach kho
  getLocations(): Observable<{ id: number; code: string }[]> {
    const url = `${this.baseUrl}/locations/minimal`;
    return this.http.get<any[]>(url).pipe(
      map((res) =>
        res.map((item) => ({
          id: item.id,
          code: item.code,
        }))
      )
    );
  }
}
