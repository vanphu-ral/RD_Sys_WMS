import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { InternalTransferRequest } from '../chuyen-kho.component';

@Injectable({ providedIn: 'root' })
export class ChuyenKhoService {
  private apiUrl = 'http://192.168.10.99:8050/api/locations/minimal';
  private baseUrl = 'http://192.168.10.99:8050/api';

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
      'http://192.168.10.99:8050/api/iwtr/requests'
    );
  }

  // Lấy thông tin yêu cầu chuyển kho theo mã
  getTransferRequestById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/external-apps/iwtr/${id}`);
  }
  // Lưu bảng cha
  saveRequestHeader(payload: any): Observable<any> {
    return this.http.post(
      'http://192.168.10.99:8050/api/iwtr/requests/with-items',
      payload
    );
  }

  // Lưu bảng con
  saveRequestItems(requestId: number, items: any[]): Observable<any> {
    return this.http.post(
      `http://192.168.10.99:8050/api/iwtr/requests/${requestId}/items`,
      {
        items,
      }
    );
  }
}
