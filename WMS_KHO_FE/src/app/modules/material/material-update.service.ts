import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog'; // Import MatDialogRef
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { MaterialService, RawGraphQLMaterial } from './material.service'; 
import { UpdateSelectedDialogComponent, MaterialItem } from './components/update-selected-dialog/update-selected-dialog.component'; // Điều chỉnh đường dẫn nếu cần, Import MaterialItem
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MaterialUpdateService {
 constructor(
    private materialService: MaterialService, 
    private dialog: MatDialog,
    private http: HttpClient
  ) {}
   private apiUrl = environment.restApiBaseUrl + '/api/post/request-update'; 

  sendRequestUpdate(data: any): Observable<any> {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
      });
      return this.http.post(`${this.apiUrl}`, data, { headers, responseType: 'text' });
    }

  getCheckedCount$(): Observable<number> {
    return this.materialService.selectedIds$.pipe(
      map(ids => ids.length)
    );
  }
  
  openEditSelectedDialog(itemsToUpdate: RawGraphQLMaterial[]): MatDialogRef<UpdateSelectedDialogComponent, { updatedItems: MaterialItem[], selectedWarehouse: any, approvers: string[] }> | undefined { 
    if (itemsToUpdate && itemsToUpdate.length > 0) {
      return this.dialog.open<UpdateSelectedDialogComponent, { items: RawGraphQLMaterial[] }, { updatedItems: MaterialItem[], selectedWarehouse: any, approvers: string[] }>(UpdateSelectedDialogComponent, {
        width: '80%', 
        maxWidth: '70vw',
        maxHeight: '90vh',
        data: { items: itemsToUpdate },
        autoFocus: false // Thêm autoFocus: false vào đây
      });
    }
    return undefined;
  }
}