import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../services/auth.service';

export interface WarehouseTransferRequirementPayload {
  requirement_code: string;
  number_of_pallet: number;
  number_of_box: number;
  total_quantity: number;
  status: string;
  source_warehouse: string;
  destination_warehouse: string;
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
  // private readonly baseUrl = `${environment.apiUrl}/warehouse-transfer`;
  private readonly baseUrl = 'http://192.168.10.99:9030/api/warehouse-transfer';

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

  getRequirements(page = 1, size = 20, q = ''): Observable<WarehouseTransferRequirement[]> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (q.trim()) {
      params = params.set('q', q.trim());
    }
    return this.http.get<WarehouseTransferRequirement[]>(`${this.baseUrl}`, { params, ...this.withAuth() });
  }

  createRequirement(payload: WarehouseTransferRequirementPayload): Observable<WarehouseTransferRequirement> {
    return this.http.post<WarehouseTransferRequirement>(`${this.baseUrl}/`, payload, this.withAuth());
  }

  updateRequirement(
    payload: Partial<WarehouseTransferRequirementPayload> & { id?: number }
  ): Observable<WarehouseTransferRequirement> {
    if (payload.id) {
      return this.http.patch<WarehouseTransferRequirement>(`${this.baseUrl}/${payload.id}/`, payload, this.withAuth());
    }
    return this.http.patch<WarehouseTransferRequirement>(`${this.baseUrl}/`, payload, this.withAuth());
  }

  addScannedInventory(payload: WarehouseTransferInventoryPayload): Observable<any> {
    return this.http.post(`${this.baseUrl}/inventories/`, payload, this.withAuth());
  }

  removeScannedInventory(id: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/inventories/${id}/`, {}, this.withAuth());
  }

  addScannedPallet(payload: WarehouseTransferPalletPayload): Observable<any> {
    return this.http.post(`${this.baseUrl}/pallets/`, payload, this.withAuth());
  }

  removeScannedPallet(id: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/pallets/${id}/`, {}, this.withAuth());
  }

  getMinimalLocations(): Observable<MinimalLocation[]> {
    return this.http.get<MinimalLocation[]>(`${environment.apiUrl}/locations/minimal`);
  }

  /** Dùng chung API scan với nhập kho/chuyển kho: tra cứu thùng theo mã. */
  getInventoryByIdentifier(identifier: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/inventories/${encodeURIComponent(identifier)}`);
  }

  /** Dùng chung API scan với nhập kho/chuyển kho: tra cứu pallet theo mã. */
  scanPalletBySerial(serialPallet: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/inventories/scan-pallets/${encodeURIComponent(serialPallet)}`);
  }
}
