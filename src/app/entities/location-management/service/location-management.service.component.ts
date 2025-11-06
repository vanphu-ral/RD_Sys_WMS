import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Location } from '../models/location.model';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private apiUrl = 'http://192.168.10.99:8050/api/locations';

  constructor(private http: HttpClient) {}

  //lay danh sach location
  getLocations(
    page: number = 1,
    size: number = 10
  ): Observable<{
    data: Location[];
    meta: { total_items: number; page: number; size: number };
  }> {
    const url = `${this.apiUrl}?page=${page}&size=${size}`;
    return this.http.get<any>(url).pipe(
      map((res) => ({
        data: res.data.map((item: any) => ({
          id: item.id,
          code: item.code,
          name: item.name,
          area_id: item.area_id,
          address: item.address,
          description: item.description,
          is_multi_location: item.is_multi_location,
          number_of_rack: item.number_of_rack,
          number_of_rack_empty: item.number_of_rack_empty,
          barcode: item.barcode,
          is_active: item.is_active,
        })),
        meta: res.meta,
      }))
    );
  }

  //doi status location
  updateLocationStatus(id: number, isActive: boolean): Observable<any> {
    const statusInt = isActive ? 1 : 0;
    const url = `http://192.168.10.99:8050/api/locations/${id}/status?is_active=${statusInt}`;
    return this.http.patch(url, {});
  }

  //get location by id
  getLocationById(id: number): Observable<Location> {
    return this.http.get<Location>(
      `http://192.168.10.99:8050/api/locations/${id}`
    );
  }

  //cap nhat location
  updateLocation(id: number, payload: Location): Observable<any> {
    const url = `http://192.168.10.99:8050/api/locations/${id}`;
    return this.http.put(url, payload);
  }

  createLocation(location: Location): Observable<Location> {
    return this.http.post<Location>(this.apiUrl, location);
  }

  createSubLocations(parentId: number, subPayload: any[]): Observable<any> {
    const url = `${this.apiUrl}/${parentId}/sub-locations/bulk`;
    return this.http.post<any>(url, subPayload);
  }

  clearSubLocations(locationId: number): Observable<any> {
    const url = `${this.apiUrl}/${locationId}/clear-sub-locations`;
    return this.http.post(url, {});
  }
}
