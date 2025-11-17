import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, forkJoin, Observable, of, switchMap, throwError } from 'rxjs';
import { NhapKhoItem } from '../nhap-kho.component';

export interface ScannedInventoryResponse {
  id: number;
  manufacturing_date: string;
  expiration_date: string;
  sap_code: string;
  po: string;
  lot: string;
  vendor: string;
  msd_level: string;
  comments: string;
  name: string;
  import_container_id: number;
  inventory_identifier: string;
  location_id: number;
  serial_pallet: string;
  quantity_imported: number;
  scan_by: string;
  time_checked: string;
  confirmed: boolean;
}

export interface ScannedListResponse {
  data: ScannedInventoryResponse[];
  meta: {
    page: number;
    size: number;
    total_items: number;
    total_pages: number;
  };
}

export interface ScanPayload {
  manufacturing_date?: string;
  expiration_date?: string;
  sap_code: string;
  po: string;
  lot: string;
  vendor?: string;
  msd_level?: string;
  comments?: string;
  name: string;
  import_container_id: number;
  inventory_identifier?: string;
  location_id?: number;
  serial_pallet?: string;
  quantity_imported: number;
  scan_by: string;
  confirmed: boolean;
}

export interface UpdateLocationPayload {
  inventory_identifier: string;
  location_id: number;
  updated_by: string;
}

export interface PushInventoryPayload {
  inventories: Array<{
    identifier: string;
    initial_quantity: number;
    location_id: number;
    name: string;
    sap_code: string;
    serial_pallet: string;
  }>;
}
export interface UpdateQuantityPayload {
  available_quantity: number;
  inventory_identifier: string;
  updated_by: string;
}

export interface UpdateLocationPayload {
  inventory_identifier: string;
  location_id: number;
  updated_by: string;
}
@Injectable({ providedIn: 'root' })
export class NhapKhoService {
  private apiUrl = 'http://192.168.20.101:8050/api/import-requirements';
  private testUrl = 'http://192.168.10.99:8050/api';
  private baseUrl = 'http://192.168.20.101:8050/api';

  constructor(private http: HttpClient) { }

  // Danh sách nhập kho
  getDanhSachNhapKho(params?: any): Observable<NhapKhoItem[]> {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach((key) => {
        if (
          params[key] !== null &&
          params[key] !== undefined &&
          params[key] !== ''
        ) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }

    return this.http.get<NhapKhoItem[]>(this.apiUrl, { params: httpParams });
  }

  //danh sach kho minimal
  getMinimalLocations(): Observable<{ id: number; code: string }[]> {
    return this.http.get<{ id: number; code: string }[]>(`${this.testUrl}/locations/minimal`);
  }
  //  Lấy chi tiết import requirement + containers
  getImportRequirement(id: number): Observable<any> {
    const url = `${this.testUrl}/import-requirements/${id}`;
    return this.http.get<any>(url);
  }

  //  POST: Scan vật tư (validate và lưu vào DB)
  postScannedInventory(payload: ScanPayload): Observable<ScannedInventoryResponse> {
    const url = `${this.testUrl}/import-requirements/container-inventories/scan`;
    return this.http.post<ScannedInventoryResponse>(url, payload);
  }

  //  GET: Lấy danh sách đã scan
  getScannedContainers(
    containerId: number,
    params?: { page?: number; size?: number }
  ): Observable<ScannedListResponse> {
    const url = `${this.testUrl}/import-requirements/container-inventories/${containerId}/scan`;

    let httpParams = new HttpParams();
    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.size) {
      httpParams = httpParams.set('size', params.size.toString());
    }

    return this.http.get<ScannedListResponse>(url, { params: httpParams });
  }

  //  PUT: Cập nhật vị trí kho cho inventory
  // updateInventoryLocation(payload: UpdateLocationPayload): Observable<any> {
  //   const url = `${this.testUrl}/inventories/inventory/update-location`;
  //   return this.http.put(url, payload);
  // }

  //  PUT: Đẩy thông tin tồn hàng lên hệ thống
  pushInventoriesToSystem(payload: PushInventoryPayload): Observable<any> {
    const url = `${this.testUrl}/inventories/inventories_wh`;
    return this.http.put(url, payload);
  }

  //  PATCH: Cập nhật trạng thái phê duyệt nhập kho
  updateImportRequirementStatus(
    requirementId: number,
    status: string
  ): Observable<any> {
    const url = `${this.testUrl}/warehouse-import/requirements/${requirementId}/status?status=${status}`;
    return this.http.patch(url, {});
  }

  //  PATCH: Cập nhật số lượng và confirmed cho container inventories
  updateContainerInventories(batchPayload: { updates: any[] }): Observable<any> {
    const url = `${this.testUrl}/warehouse-import/container-inventories`;
    return this.http.patch(url, batchPayload);
  }


  //  Validate mã scan (helper - nếu cần API riêng)
  getInventoryByIdentifier(identifier: string): Observable<any> {
    const url = `${this.testUrl}/inventories/${identifier}`;
    return this.http.get<any>(url);
  }

  getBoxesInPallet(requirementId: number, palletSerial: string): Observable<any[]> {
    const url = `${this.testUrl}/warehouse-import/scan-pallets/${requirementId}/${palletSerial}`;
    return this.http.get<any[]>(url);
  }

  // PUT: Cập nhật quantity bằng identifier
  updateInventoryQuantity(payload: UpdateQuantityPayload): Observable<any> {
    const url = `${this.testUrl}/inventories/inventory/update-quantity`;
    return this.http.put(url, payload);
  }

  // PUT: Cập nhật location bằng identifier (đã có, nhưng đảm bảo)
  updateInventoryLocation(payload: UpdateLocationPayload): Observable<any> {
    const url = `${this.testUrl}/inventories/inventory/update-location`;
    return this.http.put(url, payload);
  }

  // Method chain để confirm full flow (modern: RxJS chain)
  confirmAndSyncInventories(
    batchPayload: { updates: Array<{ import_container_id: number; inventory_identifier: string; quantity_imported?: number; location_id?: number; confirmed?: boolean }> },
    inventoriesPayload: PushInventoryPayload,
    requirementId: number,
    status: string,
    username: string
  ): Observable<any> {
    return this.updateContainerInventories(batchPayload).pipe(
      switchMap(() => {
        const updates = inventoriesPayload.inventories.map(item =>
          forkJoin([
            this.updateInventoryQuantity({
              available_quantity: item.initial_quantity,
              inventory_identifier: item.identifier,
              updated_by: username
            }),
            this.updateInventoryLocation({
              inventory_identifier: item.identifier,
              location_id: item.location_id,
              updated_by: username
            })
          ])
        );
        return forkJoin(updates);
      }),
      switchMap(() => this.pushInventoriesToSystem(inventoriesPayload)),
      switchMap(() => this.updateImportRequirementStatus(requirementId, status)),
      catchError(err => {
        console.error('Error in confirm flow:', err);
        return throwError(() => err); 
      })
    );
  }

}