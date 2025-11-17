import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { InternalTransferRequest } from '../chuyen-kho.component';

@Injectable({ providedIn: 'root' })
export class ChuyenKhoService {
  private apiUrl = 'http://192.168.10.99:8050/api/locations/minimal';

  constructor(private http: HttpClient) {}

  getWarehouses(): Observable<string[]> {
    return this.http
      .get<any[]>(this.apiUrl)
      .pipe(map((res) => res.map((item) => item.code)));
  }

  getInternalTransfers(): Observable<InternalTransferRequest[]> {
    return this.http.get<InternalTransferRequest[]>(
      'http://192.168.10.99:8050/api/iwtr/requests'
    );
  }
}
