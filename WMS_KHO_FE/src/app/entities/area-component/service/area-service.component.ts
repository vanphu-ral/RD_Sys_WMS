import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Area } from '../area-management.component';
import { environment } from '../../../../environments/environment';

export interface TenantOption {
  company_name: string;
  factory: string;
  id: string;
}

export interface AreaPayload {
  code: string;
  name: string;
  company: string;
  factory: string;
  tenant_id: string;
  thu_kho: string;
  description: string;
  address: string;
  is_active: number;
}

@Injectable({
  providedIn: 'root',
})
export class AreaService {
  private apiUrl = `${environment.apiUrl}/areas`;
  // private apiUrl = `http://192.168.10.99:9030/api/areas`;
  private tenantUrl = `${environment.apiUrl}/auth/tenant`;
  // private tenantUrl = `http://192.168.10.99:9030/api/auth/tenant`;

  constructor(private http: HttpClient) {}

  getTenants(): Observable<TenantOption[]> {
    return this.http.get<TenantOption[] | { data: TenantOption[] } | TenantOption>(this.tenantUrl).pipe(
      map((res) => {
        const raw = Array.isArray(res) ? res : (res as { data?: TenantOption[] })?.data ?? [res as TenantOption];
        return (raw || []).filter((item) => item?.id && item?.company_name);
      })
    );
  }

  // Lấy danh sách area
  getAreas(): Observable<{
    data: Area[];
    meta: { total_items: number; size: number; page: number };
  }> {
    return this.http.get<any>(this.apiUrl).pipe(
      map((res) => ({
        data: res.data.map((item: any) => ({
          id: item.id,
          code: item.code,
          name: item.name,
          company: item.company ?? '',
          factory: item.factory ?? '',
          tenant_id: item.tenant_id ?? '',
          storekeeper: item.thu_kho,
          description: item.description,
          address: item.address,
          is_active: item.is_active,
        })),
        meta: res.meta,
      }))
    );
  }

  // Cập nhật trạng thái
  updateAreaStatus(id: number, isActive: boolean): Observable<any> {
    const statusInt = isActive ? 1 : 0;
    const url = `${this.apiUrl}/${id}/status?is_active=${statusInt}`;
    return this.http.patch(url, {});
  }

  // Thêm mới area
  createArea(area: AreaPayload): Observable<any> {
    return this.http.post(this.apiUrl, [area]);
  }

  // Cập nhật area
  updateArea(id: number, area: AreaPayload): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.patch(url, area);
  }
}
