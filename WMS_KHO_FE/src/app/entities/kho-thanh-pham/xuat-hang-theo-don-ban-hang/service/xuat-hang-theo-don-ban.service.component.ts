import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { SalesExportRequest } from '../xuat-hang-theo-don-ban-hang.component';

@Injectable({ providedIn: 'root' })
export class XuatHangTheoDonBanService {
  private apiUrl = 'http://192.168.20.101:8050/api';
    private testUrl = 'http://192.168.10.99:8050/api';

  constructor(private http: HttpClient) {}

  // Lấy danh sách đơn xuất hàng
  getSalesExportRequests(): Observable<SalesExportRequest[]> {
    return this.http.get<SalesExportRequest[]>(`${this.apiUrl}/osr/requests`);
  }

  // Lấy danh sách kho
  getAreas(): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(`${this.apiUrl}/areas`);
  }

  getOutOfStockRequestById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/external-apps/osr/${id}`);
  }

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

  // Lấy thông tin detail
  getSalesItemsById(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/osr/requests/${id}/items`);
  }

  // Thêm mới đơn xuất kho
  saveSalesExportRequest(
    payload: any
  ): Observable<{ success: boolean; osr_id: number }> {
    return this.http.post<{ success: boolean; osr_id: number }>(
      `${this.apiUrl}/osr/requests/with-items`,
      payload
    );
  }

  saveSalesExportItems(requestId: number, inventories: any[]): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/osr/requests/${requestId}/inventories`,
      { inventories }
    );
  }

  /**
   * Lấy thông tin pallet/thùng khi scan
   * Dùng chung API với chuyển kho
   * @param serialPallet Mã pallet/thùng
   */
  getPalletInfo(serialPallet: string): Observable<any> {
    return this.http.get<any>(
      `${this.testUrl}/inventories/scan-pallets/${serialPallet}`
    );
  }

  /**
   * Lưu thông tin scan
   * POST /api/osr/requests/{id}/scan
   * @param requestId ID đơn xuất kho
   * @param payload Dữ liệu scan
   */
  submitScan(requestId: number, payload: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/osr/requests/${requestId}/scan`,
      payload
    );
  }

  /**
   * Lấy danh sách scan đã lưu
   * GET /api/osr/requests/{id}/scan
   * @param requestId ID đơn xuất kho
   */
  getScanList(requestId: number): Observable<any> {
    return this.http.get<any>(
      `${this.testUrl}/osr/requests/${requestId}/scan`
    );
  }
}