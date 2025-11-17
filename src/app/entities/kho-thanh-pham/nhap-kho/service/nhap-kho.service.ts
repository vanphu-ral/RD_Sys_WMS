import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NhapKhoItem } from '../nhap-kho.component';

@Injectable({ providedIn: 'root' })
export class NhapKhoService {
  private apiUrl = 'http://192.168.20.101:8050/api/import-requirements';
  private testUrl = 'http://192.168.10.99:8050/api';

  constructor(private http: HttpClient) { }

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

  //detail
  getImportRequirement(id: number): Observable<any> {
    const url = `${this.testUrl}/import-requirements/${id}`;
    return this.http.get<any>(url);
  }

  //danh sach scan
  getScannedContainers(nhapKhoId: number): Observable<{ data: any[] }> {
    const url = `${this.testUrl}/import-requirements/container-inventories/${nhapKhoId}/scan`;
    return this.http.get<{ data: any[] }>(url);
  }

  //luu sau khi scan
  confirmScannedInventories(payload: any): Observable<any> {
    const url = `${this.testUrl}/import-requirements/container-inventories/scan`;
    return this.http.post(url, payload);
  }




  //scan
  //lay thong tin scan
  getInventoryByIdentifier(identifier: string): Observable<any> {
    const url = `${this.testUrl}/inventories/${identifier}`;
    return this.http.get<any>(url);
  }
}
