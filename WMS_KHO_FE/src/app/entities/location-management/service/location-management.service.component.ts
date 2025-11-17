import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Location } from '../models/location.model';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private apiUrl = 'http://192.168.20.101:8050/api/locations';

  constructor(private http: HttpClient) {}

  //lay danh sach location
  getLocations(
    page: number = 1,
    size: number = 10,
    filters: { [key: string]: any } = {}
  ): Observable<{
    data: Location[];
    meta: { total_items: number; page: number; size: number };
  }> {
    let params = new HttpParams().set('page', page).set('size', size);

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '') {
        params = params.set(key, value);
      }
    });

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((res) => ({
        data: res.data,
        meta: res.meta,
      }))
    );
  }

  //doi status location
  updateLocationStatus(id: number, isActive: boolean): Observable<any> {
    const statusInt = isActive ? 1 : 0;
    const url = `http://192.168.20.101:8050/api/locations/${id}/status?is_active=${statusInt}`;
    return this.http.patch(url, {});
  }

  //get location by id
  getLocationById(id: number): Observable<Location> {
    return this.http.get<Location>(
      `http://192.168.20.101:8050/api/locations/${id}`
    );
  }

  //cap nhat location
  updateLocation(id: number, payload: Location): Observable<any> {
    const url = `http://192.168.20.101:8050/api/locations/update-full/${id}`;
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
