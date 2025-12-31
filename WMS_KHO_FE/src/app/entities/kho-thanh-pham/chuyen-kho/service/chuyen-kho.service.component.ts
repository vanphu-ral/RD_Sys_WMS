import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { InternalTransferRequest } from '../chuyen-kho.component';
import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ChuyenKhoService {
  private apiUrl = environment.apiUrl;   //dùng biến môi trường

  constructor(private http: HttpClient) { }

  getWarehouses(): Observable<{ id: number; name: string }[]> {
    return this.http.get<any>(`${this.apiUrl}/areas`).pipe(
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
  // Danh sách kho minimal
  getMinimalLocations(): Observable<{ id: number; code: string }[]> {
    return this.http.get<{ id: number; code: string }[]>(`${this.apiUrl}/locations/minimal`);
  }
  getInternalTransfers(): Observable<InternalTransferRequest[]> {
    return this.http.get<InternalTransferRequest[]>(`${this.apiUrl}/iwtr/requests`);
  }

  // Lấy thông tin yêu cầu chuyển kho theo mã
  getTransferRequestById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/external-apps/iwtr/${id}`);
  }

  // Lưu bảng cha
  saveRequestHeader(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/iwtr/requests/with-items`, payload);
  }

  // Lưu bảng con
  saveRequestItems(requestId: number, items: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/iwtr/requests/${requestId}/items`, { items });
  }

  // Lấy thông tin detail
  getTransferItemsById(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/iwtr/requests/${id}/items`);
  }

  //phe duyet chuyen kho
  patchRequestScanStatus(requestId: number, body: { scan_status: boolean }): Observable<any> {
    return this.http.patch<any[]>(`${this.apiUrl}/iwrt/requests/${requestId}`, body);
  }



  // Lấy thông tin đã scan
  getScannedData(requestId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/iwtr/requests/${requestId}/scan`);
  }

  // Lấy thông tin inventory bằng identifier (mode thùng)
  getInventoryByIdentifier(identifier: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/inventories/${identifier}`);
  }

  // Scan pallet - lấy tất cả thùng trong pallet (mode pallet)
  scanPallet(serialPallet: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/inventories/scan-pallets/${serialPallet}`);
  }

  // Lưu thông tin scan
  submitScan(requestId: number, payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/iwtr/requests/${requestId}/scan`, payload);
  }
}