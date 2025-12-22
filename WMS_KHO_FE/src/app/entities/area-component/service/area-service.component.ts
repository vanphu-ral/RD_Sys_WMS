import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Area } from '../area-management.component';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AreaService {
  private apiUrl = `${environment.apiUrl}/areas`;   

  constructor(private http: HttpClient) {}

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
  createArea(area: any): Observable<any> {
    return this.http.post(this.apiUrl, [area]);
  }

  // Cập nhật area
  updateArea(
    id: number,
    area: {
      code: string;
      name: string;
      thu_kho: string;
      description: string;
      address: string;
      is_active: number;
    }
  ): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.patch(url, area);
  }
}
