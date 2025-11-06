import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Area } from '../area-management.component';

@Injectable({
  providedIn: 'root',
})
export class AreaService {
  private apiUrl = 'http://192.168.20.101:8050/api/areas';

  constructor(private http: HttpClient) {}

  //lay danh sach area
  getAreas(): Observable<{
    data: Area[];
    meta: { total_items: number; size: number; page: number };
  }> {
    return this.http.get<any>('http://192.168.20.101:8050/api/areas').pipe(
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

  //cap nhat trang thai
  updateAreaStatus(id: number, isActive: boolean): Observable<any> {
    const statusInt = isActive ? 1 : 0;
    const url = `http://192.168.20.101:8050/api/areas/${id}/status?is_active=${statusInt}`;
    return this.http.patch(url, {});
  }

  //them moi area
  createArea(area: any): Observable<any> {
    return this.http.post(this.apiUrl, [area]);
  }
}
