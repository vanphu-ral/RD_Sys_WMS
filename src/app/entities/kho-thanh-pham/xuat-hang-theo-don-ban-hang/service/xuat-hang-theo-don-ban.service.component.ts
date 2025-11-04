import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SalesExportRequest } from '../xuat-hang-theo-don-ban-hang.component';

@Injectable({ providedIn: 'root' })
export class XuatHangTheoDonBanService {
  private apiUrl = 'http://192.168.10.99:8050/api/osr/requests';

  constructor(private http: HttpClient) {}

  getSalesExportRequests(): Observable<SalesExportRequest[]> {
    return this.http.get<SalesExportRequest[]>(this.apiUrl);
  }
}
