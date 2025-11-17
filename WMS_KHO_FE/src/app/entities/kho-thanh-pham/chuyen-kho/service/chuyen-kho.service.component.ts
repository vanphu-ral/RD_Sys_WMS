import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { InternalTransferRequest } from '../chuyen-kho.component';

@Injectable({ providedIn: 'root' })
export class ChuyenKhoService {
  private baseUrl = 'http://192.168.20.101:8050/api';
  private testUrl = 'http://192.168.10.99:8050/api';

  constructor(private http: HttpClient) {}

  getWarehouses(): Observable<{ id: number; name: string }[]> {
    return this.http.get<any>(`${this.baseUrl}/areas`).pipe(
      map((res) =>
        Array.isArray(res.data)
          ? res.data.map((item: any) => ({
              id: item.id,
              name: item.name,
            }))
          : []
      )
    );
  }

  getInternalTransfers(): Observable<InternalTransferRequest[]> {
    return this.http.get<InternalTransferRequest[]>(
      `${this.baseUrl}/iwtr/requests`
    );
  }

  // Lấy thông tin yêu cầu chuyển kho theo mã
  getTransferRequestById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/external-apps/iwtr/${id}`);
  }

  // Lưu bảng cha
  saveRequestHeader(payload: any): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/iwtr/requests/with-items`,
      payload
    );
  }

  // Lưu bảng con
  saveRequestItems(requestId: number, items: any[]): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/iwtr/requests/${requestId}/items`,
      { items }
    );
  }

  // Lấy thông tin detail
  getTransferItemsById(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.testUrl}/iwtr/requests/${id}/items`);
  }

  // Lấy thông tin đã scan
  getScannedData(requestId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/iwtr/requests/${requestId}/scan`);
  }

  // Lấy thông tin inventory bằng identifier (mode thùng)
  getInventoryByIdentifier(identifier: string): Observable<any> {
    return this.http.get<any>(`${this.testUrl}/inventories/${identifier}`);
  }

  // Scan pallet - lấy tất cả thùng trong pallet (mode pallet)
  scanPallet(serialPallet: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.testUrl}/inventories/scan-pallets/${serialPallet}`
    );
  }

  // Lưu thông tin scan
  submitScan(requestId: number, payload: any): Observable<any> {
    return this.http.post(
      `${this.testUrl}/iwtr/requests/${requestId}/scan`,
      payload
    );
  }
}