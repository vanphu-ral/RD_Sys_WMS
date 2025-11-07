import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NhapKhoItem } from '../nhap-kho.component';

@Injectable({ providedIn: 'root' })
export class NhapKhoService {
  private apiUrl = 'http://192.168.20.101:8050/api/import-requirements';

  constructor(private http: HttpClient) {}

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
}
