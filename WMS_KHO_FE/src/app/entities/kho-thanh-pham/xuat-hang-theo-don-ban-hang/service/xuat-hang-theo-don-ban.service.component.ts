import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { SalesExportRequest } from '../xuat-hang-theo-don-ban-hang.component';
import { environment } from '../../../../../environments/environment';  

@Injectable({ providedIn: 'root' })
export class XuatHangTheoDonBanService {
  private apiUrl = environment.apiUrl;   // dùng biến môi trường

  constructor(private http: HttpClient) {}

  // Lấy danh sách đơn xuất hàng
  getSalesExportRequests(): Observable<SalesExportRequest[]> {
    return this.http.get<SalesExportRequest[]>(`${this.apiUrl}/osr/requests`);
  }

  // Lấy danh sách kho
  getAreas(): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(`${this.apiUrl}/areas`);
  }

  // Lấy đơn xuất kho theo ID
  getOutOfStockRequestById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/external-apps/osr/${id}`);
  }

  // Lấy danh sách kho (map id, name)
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

     //phe duyet xuat kho
  patchSalesScanStatus(requestId: number, body: { scan_status: boolean }): Observable<any> {
    return this.http.patch<any[]>(`${this.apiUrl}/osr/requests/${requestId}`, body);
  }

  // Lấy thông tin detail items
  getSalesItemsById(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/osr/requests/${id}/items`);
  }

  // Thêm mới đơn xuất kho
  saveSalesExportRequest(payload: any): Observable<{ success: boolean; osr_id: number }> {
    return this.http.post<{ success: boolean; osr_id: number }>(
      `${this.apiUrl}/osr/requests/with-items`,
      payload
    );
  }

  // Thêm mới items cho đơn xuất kho
  saveSalesExportItems(requestId: number, inventories: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/osr/requests/${requestId}/inventories`, { inventories });
  }

  /**
   * Lấy thông tin pallet/thùng khi scan
   * Dùng chung API với chuyển kho
   */
  getPalletInfo(serialPallet: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/inventories/scan-pallets/${serialPallet}`);
  }

  /**
   * Lưu thông tin scan
   */
  submitScan(requestId: number, payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/osr/requests/${requestId}/scan`, payload);
  }

  /**
   * Lấy danh sách scan đã lưu
   */
  getScanList(requestId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/osr/requests/${requestId}/scan`);
  }
}
