import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, forkJoin, Observable, of, switchMap, throwError } from 'rxjs';
import { NhapKhoItem } from '../nhap-kho.component';
import { environment } from '../../../../../environments/environment';

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
  inventories: {
    identifier: string;
    initial_quantity: number;
    location_id: number;
    name: string;
    serial_pallet: string;
    updated_by: string;
    sap_code: string;
    part_number: string;
  }[];
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
export interface PalletUpdatePayload {
  updates: Array<{
    id: number;
    serial_pallet: string;
    quantity_per_box: number;
    num_box_per_pallet: number;
    total_quantity: number;
    po_number: string;
    customer_name: string;
    production_decision_number: string;
    item_no_sku: string;
    date_code: string;
    note: string;
    scan_status: boolean;
    confirmed: boolean;
    location_id?: number;
    scan_by?: string;
    scan_time?: string;
  }>;
}

// Container Inventories (Box) Update Payload
export interface ContainerInventoriesPayload {
  updates: Array<{
    id: number;
    inventory_identifier: string;
    quantity_imported: number;
    confirmed: boolean;
    location_id?: number;
    scan_status?: boolean;
    scan_by?: string;
    scan_time?: string;
  }>;
}

// Response types
export interface PalletUpdateResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface ContainerInventoriesResponse {
  success: boolean;
  message: string;
  data?: any;
}
@Injectable({ providedIn: 'root' })
export class NhapKhoService {
  private apiUrl = `${environment.apiUrl}/import-requirements`;   // dùng biến môi trường
  private baseUrl = environment.apiUrl;                          // base cho các endpoint khác

  constructor(private http: HttpClient) { }

  // Danh sách nhập kho
  getDanhSachNhapKho(params?: any): Observable<NhapKhoItem[]> {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }

    return this.http.get<NhapKhoItem[]>(this.apiUrl, { params: httpParams });
  }

  // Danh sách kho minimal
  getMinimalLocations(): Observable<{ id: number; code: string }[]> {
    return this.http.get<{ id: number; code: string }[]>(`${this.baseUrl}/locations/minimal`);
  }

  // Lấy chi tiết import requirement + containers
  getImportRequirement(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/import-requirements/${id}`);
  }

  // POST: Scan vật tư (validate và lưu vào DB)
  postScannedInventory(payload: ScanPayload): Observable<ScannedInventoryResponse> {
    return this.http.post<ScannedInventoryResponse>(`${this.baseUrl}/import-requirements/container-inventories/scan`, payload);
  }

  // GET: Lấy danh sách đã scan
  getScannedContainers(containerId: number, params?: { page?: number; size?: number }): Observable<ScannedListResponse> {
    const url = `${this.baseUrl}/import-requirements/container-inventories/${containerId}/scan`;

    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.size) httpParams = httpParams.set('size', params.size.toString());

    return this.http.get<ScannedListResponse>(url, { params: httpParams });
  }

  // PUT: Đẩy thông tin tồn hàng lên hệ thống
  pushInventoriesToSystem(payload: PushInventoryPayload): Observable<any> {
    return this.http.put(`${this.baseUrl}/inventories/inventories_wh`, payload);
  }

  // PATCH: Cập nhật trạng thái phê duyệt nhập kho
  updateImportRequirementStatus(requirementId: number, status: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/warehouse-import/requirements/${requirementId}/status?status=${status}`, {});
  }

  // PATCH: Cập nhật số lượng và confirmed cho container inventories
  // updateContainerInventories(batchPayload: { updates: any[] }): Observable<any> {
  //   return this.http.patch(`${this.baseUrl}/warehouse-import/container-inventories`, batchPayload);
  // }


  /**
   * Cập nhật thông tin pallet (scan status, confirmed, quantities)
   * PATCH /api/warehouse-import/import-pallet-info
   */
  updatePalletInfo(payload: PalletUpdatePayload): Observable<PalletUpdateResponse> {
    return this.http.patch<PalletUpdateResponse>(
      `${this.baseUrl}/warehouse-import/import-pallet-info`,
      payload
    );
  }

  /**
   * Cập nhật container inventories (box)
   * PATCH /api/warehouse-import/container-inventories
   */
  updateContainerInventories(payload: ContainerInventoriesPayload): Observable<ContainerInventoriesResponse> {
    return this.http.patch<ContainerInventoriesResponse>(
      `${this.baseUrl}/warehouse-import/container-inventories`,
      payload
    );
  }

  // Validate mã scan
  getInventoryByIdentifier(identifier: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/inventories/${identifier}`);
  }

  getBoxesInPallet(requirementId: number, palletSerial: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/warehouse-import/scan-pallets/${requirementId}/${palletSerial}`);
  }

  // PUT: Cập nhật quantity bằng identifier
  updateInventoryQuantity(payload: UpdateQuantityPayload): Observable<any> {
    return this.http.put(`${this.baseUrl}/inventories/inventory/update-quantity`, payload);
  }

  // PUT: Cập nhật location bằng identifier
  updateInventoryLocation(payload: UpdateLocationPayload): Observable<any> {
    return this.http.put(`${this.baseUrl}/inventories/inventory/update-location`, payload);
  }

  // Method chain để confirm full flow
  // confirmAndSyncInventories(
  //   batchPayload: {
  //     updates: Array<{
  //       pallet_id: number;
  //       serial_pallet: string;
  //       location_id: number;
  //       quantity_imported?: number;
  //       scan_status?: string;
  //       scan_by: string;
  //       confirmed?: boolean;
  //     }>
  //   },
  //   inventoriesPayload: PushInventoryPayload,
  //   requirementId: number,
  //   // status: string,
  //   username: string
  // ): Observable<any> {
  //   return this.updateContainerInventories(batchPayload).pipe(
  //     switchMap(() => {
  //       const updates = inventoriesPayload.inventories.map(item =>
  //         forkJoin([
  //           this.updateInventoryQuantity({
  //             available_quantity: item.initial_quantity,
  //             inventory_identifier: item.identifier,
  //             updated_by: username
  //           }),
  //           // this.updateInventoryLocation({
  //           //   inventory_identifier: item.identifier,
  //           //   location_id: item.location_id,
  //           //   updated_by: username
  //           // })
  //         ])
  //       );
  //       return forkJoin(updates);
  //     }),
  //     switchMap(() => this.pushInventoriesToSystem(inventoriesPayload)),
  //     switchMap(() => this.updateImportRequirementStatus(requirementId, status)),
  //     catchError(err => {
  //       console.error('Error in confirm flow:', err);
  //       return throwError(() => err);
  //     })
  //   );
  // }

  // Hàm đổi trạng thái yêu cầu nhập kho
  updateStatus(id: number, status: boolean): Observable<any> {
    const url = `${this.baseUrl}/warehouse-import/requirements/${id}/status?status=${status}`;
    return this.http.patch(url, {});
  }
  // nhap-kho.service.ts
  patchImportRequirement(id: number, body: any): Observable<any> {
    return this.http.patch(this.baseUrl + `/import-requirements/${id}`, body);
  }

}