import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../services/auth.service';

export interface WarehouseTransferRequirementPayload {
  id?: number;
  requirement_code: string;
  number_of_pallet: number;
  number_of_box: number;
  total_quantity: number;
  status: string;
  source_warehouse: string | number;
  destination_warehouse: string | number;
  note: string;
}

export interface WarehouseTransferRequirement extends WarehouseTransferRequirementPayload {
  id: number;
  created_at: string;
  created_by: string;
  updated_at: string | null;
  updated_by: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  tenant_id: string;
}

export interface WarehouseTransferInventoryPayload {
  warehouse_transfer_gc_requirement_id: number;
  inventory_id: number;
}

export interface WarehouseTransferPalletPayload {
  warehouse_transfer_gc_requirement_id: number;
  pallet_info_detail_id: number;
}

export interface MinimalLocation {
  id: number;
  code: string;
}

@Injectable({ providedIn: 'root' })
export class LuanChuyenKhoService {
  // private readonly apiRoot = 'http://192.168.10.99:9030/api';
  private readonly apiRoot = `${environment.apiUrl}`;
  private readonly baseUrl = `${this.apiRoot}/warehouse-transfer/`;
  private readonly approvalsUrl = `${this.apiRoot}/warehouse-transfer/approvals/`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private withAuth() {
    const token = this.authService.getAccessToken();
    if (!token) {
      return {};
    }
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
      }),
    };
  }

  // ─── Đơn luân chuyển (tạo / cập nhật) ───────────────────────────────────────

  getRequirements(page = 1, size = 20, q = ''): Observable<WarehouseTransferRequirement[]> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (q.trim()) {
      params = params.set('q', q.trim());
    }
    return this.http.get<WarehouseTransferRequirement[]>(`${this.baseUrl}`, { params, ...this.withAuth() });
  }

  /** GET /warehouse-transfer/with-details/{requirement_id} */
  getRequirementWithDetails(requirementId: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}with-details/${requirementId}`,
      this.withAuth()
    );
  }

  createRequirement(payload: WarehouseTransferRequirementPayload): Observable<WarehouseTransferRequirement> {
    return this.http.post<WarehouseTransferRequirement>(`${this.baseUrl}`, payload, this.withAuth());
  }

  updateRequirement(
    payload: Partial<WarehouseTransferRequirementPayload> & { id?: number }
  ): Observable<WarehouseTransferRequirement> {
    const url = payload.id ? `${this.baseUrl}${payload.id}/` : `${this.baseUrl}`;
    return this.http.put<WarehouseTransferRequirement>(url, payload, this.withAuth());
  }

  /** POST /warehouse-transfer/approvals/{id} — gửi phê duyệt đơn nháp */
  submitForApproval(
    payload: WarehouseTransferRequirementPayload & { id: number }
  ): Observable<WarehouseTransferRequirement> {
    return this.http.post<WarehouseTransferRequirement>(
      `${this.approvalsUrl}${payload.id}`,
      payload,
      this.withAuth()
    );
  }

  addScannedInventory(payload: WarehouseTransferInventoryPayload): Observable<any> {
    return this.http.post(`${this.baseUrl}inventories/`, payload, this.withAuth());
  }

  removeScannedInventory(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}inventories/${id}`, this.withAuth());
  }

  addScannedPallet(payload: WarehouseTransferPalletPayload): Observable<any> {
    return this.http.post(`${this.baseUrl}pallets/`, payload, this.withAuth());
  }

  removeScannedPallet(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}pallets/${id}`, this.withAuth());
  }

  // ─── Phê duyệt ─────────────────────────────────────────────────────────────

  /** GET /warehouse-transfer/approvals/ */
  getApprovals(): Observable<WarehouseTransferRequirement[]> {
    return this.http.get<WarehouseTransferRequirement[]>(this.approvalsUrl, this.withAuth()).pipe(
      map((res: any) => (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [])),
      catchError(() => of([]))
    );
  }

  /** GET /warehouse-transfer/approvals/with-details/{requirement_id} */
  getApprovalWithDetails(requirementId: number): Observable<any> {
    return this.http.get<any>(
      `${this.approvalsUrl}with-details/${requirementId}`,
      this.withAuth()
    );
  }

  /** PUT /warehouse-transfer/approvals/{id} */
  updateApproval(
    requirementId: number,
    payload: WarehouseTransferRequirementPayload
  ): Observable<WarehouseTransferRequirement> {
    return this.http.put<WarehouseTransferRequirement>(
      `${this.approvalsUrl}${requirementId}`,
      payload,
      this.withAuth()
    );
  }

  // ─── Scan tra cứu ───────────────────────────────────────────────────────────

  /** Tra cứu thùng theo mã (API logistics chung). */
  getInventoryByIdentifier(identifier: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/inventories/${encodeURIComponent(identifier)}`);
  }

  /** GET /warehouse-import/pallets/{serial_pallet} */
  scanImportPallet(serialPallet: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiRoot}/warehouse-import/pallets/${encodeURIComponent(serialPallet)}`,
      this.withAuth()
    );
  }

  getMinimalLocations(): Observable<MinimalLocation[]> {
    return this.http.get<MinimalLocation[]>(`${environment.apiUrl}/locations/minimal`);
  }
}
