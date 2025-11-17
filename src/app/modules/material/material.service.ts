import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import { Apollo, gql } from 'apollo-angular';

const GET_MATERIALS_QUERY = gql`
  query GetAllInventory {
    getAllInventory { 
      inventoryId
      partId
      partNumber
      trackingType
      materialTraceId
      materialIdentifier
      status
      quantity
      locationId
      parentLocationId
      lastLocationId
      expirationDate
      receivedDate
      updatedDate
      updatedBy
      manufacturingDate
      materialType
      checkinDate
      calculatedStatus
    }
  }
`;

const GET_LOCATION_QUERY = gql`
  query AllLocations {
    allLocations { 
      locationId locationName 
    }
  }
`;

interface MaterialsQueryResponse {
  getAllInventory: RawGraphQLMaterial[];
}

interface LocationQueryResponse {
  allLocations: RawGraphQLLocation[];
}

export interface RawGraphQLLocation{
  locationId: string;
  locationName: string;
}

export interface RawGraphQLMaterial {
  select_update: boolean;
  checked: boolean;

  materialIdentifier: string;
  inventoryId: string;
  partNumber: string;
  quantity: number;
  calculatedStatus: string;
  locationId: string;
  // locationName: string;
  parentLocationId: string;
  lastLocationId: string;
  expirationDate: string;
  receivedDate: string;
  updatedDate: string;
  updatedBy: string;
  materialType: string;
  checkinDate: string;
}


export interface updateManageData {
  "requestID": number,
  "Status": string,
  "RequestDate": string,
  "User": string,
  "QuantityRecord": number,
  "approver": string,
  "note": string
}

export interface updateHistoryData {
  "requestID": number;
  "Status": string;
  "RequestDate": string,
  "User": string;
  "approver": string,
  "requestType": string;
  "note"?: string;
  "timeAction": string;
}

export interface approvalHistoryDetailData {
  "requestID": number;
  "Status": string;
  "RequestDate": string,
  "approver": string;
  "requestType": string;
  "timeAction": string;
  "Material ID": number;
  "Part Number": string;
  "User data 4": string;
  "State": string;
  "Location": string;
}


@Injectable({
  providedIn: 'root'
})
export class MaterialService {
  private restBaseUrl = environment.restApiBaseUrl;
  private apiUrl = this.restBaseUrl + '/api/material/list';
  private apiUrl_update_manage = this.restBaseUrl + '/api/material/update-manage';
  private apiUrl_history_manage = this.restBaseUrl + '/api/material/approval-history';
  private apiUrl_request_detail_base = this.restBaseUrl + '/api/material/request-detail';
  private apiUrl_approval_history_detail_base = this.restBaseUrl + '/api/material/approval-detail-history';

  private _materialsData = new BehaviorSubject<RawGraphQLMaterial[]>([]);
  private _locationsData = new BehaviorSubject<RawGraphQLLocation[]>([]);

  private _selectedIds = new BehaviorSubject<string[]>([]);
  private _updateManageData = new BehaviorSubject<updateManageData[]>([]);
  private _updateHistoryData = new BehaviorSubject<updateHistoryData[]>([]);
  private _requestDetail = new BehaviorSubject<RawGraphQLMaterial[]>([]);
  private _approvalHistoryDetailData = new BehaviorSubject<approvalHistoryDetailData[]>([]);
  private _totalCount = new BehaviorSubject<number>(0);

  requestDetail$: Observable<RawGraphQLMaterial[]> = this._requestDetail.asObservable();
  public approvalHistoryDetailData$: Observable<approvalHistoryDetailData[]> = this._approvalHistoryDetailData.asObservable();

  updateManageData$: Observable<updateManageData[]> = this._updateManageData.asObservable();
  updateHistoryData$: Observable<updateHistoryData[]> = this._updateHistoryData.asObservable();
  totalCount$ = this._totalCount.asObservable();

  materialsData$ = this._materialsData.asObservable();
  selectedIds$ = this._selectedIds.asObservable();
  locationsData$ = this._locationsData.asObservable(); // Thêm Observable cho locations

  constructor(private http: HttpClient, private apollo: Apollo) {
    this.loadSelectedIds();

    const initialPageSize = 15;
    this.fetchMaterialsGraphQL(0, initialPageSize);

    this.fetchUpdateManageData();
    this.fetchUpdateHistoryData();
    this.fetchLocationsGraphQL(); // Gọi hàm fetch locations
  }


  fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
  fileExtension = '.xlsx';

  public exportExcel(jsonData: any[], fileName: string): void {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonData);
    const wb: XLSX.WorkBook = { Sheets: { 'data': ws }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    this.saveExcelFile(excelBuffer, fileName);
  }


  // Lấy dữ liệu lịch sử đề nghị cập nhật chi tiết
  public fetchApprovalHistoryDetail(requestID: string | number): void {
    this.http.get<approvalHistoryDetailData[]>(this.fixedTestApiUrl_history_detail).subscribe({
      next: (data) => {
        this._approvalHistoryDetailData.next(data);
      },
      error: (err) => {
        console.error(`MaterialService: Error fetching approval history detail data (from fixed URL) for request ${requestID}:`, err);
        this._approvalHistoryDetailData.next([]);
      }
    });
  }

  private mapRawToMaterial(raw: RawGraphQLMaterial, selectedIds: string[]): RawGraphQLMaterial {
    return {
      ...raw,
      inventoryId: raw.inventoryId,
      checked: selectedIds.includes(raw.inventoryId),
      select_update: false,
    };
  }

  private loadSelectedIds(): void {
    const savedIds = localStorage.getItem('selectedMaterialIds');
    if (savedIds) {
      this._selectedIds.next(JSON.parse(savedIds));
    }
  };


  private fetchAndInitializeData(): void {
    this.http.get<RawGraphQLMaterial[]>(this.apiUrl).subscribe({
      next: (apiData) => {
        const selectedIds = this._selectedIds.value;
        const updatedData = apiData.map(item => ({
          ...item,
          checked: selectedIds.includes(item.inventoryId)
        }))
        this._materialsData.next(updatedData);
        console.log('MaterialService (HTTP): Data successfully fetched and set to _materialsData:', updatedData);
      },
      error: (err) => {
        console.error('MaterialService (HTTP): Error fetching data from API:', err);
        this._materialsData.next([]);
        this._totalCount.next(0);
      }
    });
  }


  
  public fetchMaterialsGraphQL(offset: number, limit: number, filter?: string, sortBy?: string, sortDirection?: string): void {
    if (!this.apollo) {
      console.error("Apollo client is not injected into MaterialService.");
      this.fetchAndInitializeData();
      return;
    }
    this.apollo.watchQuery<MaterialsQueryResponse>({
      query: GET_MATERIALS_QUERY,
      variables: {},
      fetchPolicy: 'network-only'
    }).valueChanges.subscribe({
      next: ({ data, loading, error }) => {
        if (loading) return;
        if (error) {
          console.error('MaterialService (GraphQL): Error fetching materials. Full Apollo error object:', JSON.stringify(error, null, 2));
          if (error.graphQLErrors && error.graphQLErrors.length > 0) {
            error.graphQLErrors.forEach((err, index) => {
              console.error(`MaterialService (GraphQL): GraphQL Error ${index + 1}:`, JSON.stringify(err, null, 2));
            });
          }
          if (error.networkError) {
            console.error('MaterialService (GraphQL): Network Error:', JSON.stringify(error.networkError, null, 2));
          }
          this._materialsData.next([]);
          this._totalCount.next(0);
          return;
        }
        if (data) {
          const items = data.getAllInventory; // Changed from data.materials

          if (Array.isArray(items)) {
            const selectedIds = this._selectedIds.value;
            const mappedData = items.map(rawItem => this.mapRawToMaterial(rawItem, selectedIds));
            this._materialsData.next(mappedData);
            console.log('MaterialService (GraphQL): Data successfully fetched:', mappedData);
            this._totalCount.next(mappedData.length); // Set total count based on the length of received items
          } else {
            this._materialsData.next([]);
            this._totalCount.next(0);
            console.warn('MaterialService (GraphQL): getAllInventory did not return an array.');
          }
        } else {
          this._materialsData.next([]);
          this._totalCount.next(0);
        }
      },
      error: (err) => {
        console.error('MaterialService (GraphQL): Subscription error (outer catch):', JSON.stringify(err, null, 2));
        this._materialsData.next([]);
        this._totalCount.next(0);
      }
    });
  }

  public fetchLocationsGraphQL(): void {
    if (!this.apollo) {
      console.error("Apollo client is not injected into MaterialService.");
      // Có thể thêm fallback nếu cần, ví dụ: fetch qua REST API
      return;
    }
    this.apollo.watchQuery<LocationQueryResponse>({
      query: GET_LOCATION_QUERY,
      fetchPolicy: 'network-only' // Hoặc 'cache-first' tùy theo yêu cầu
    }).valueChanges.subscribe({
      next: ({ data, loading, error }) => {
        if (loading) return;
        if (error) {
          console.error('MaterialService (GraphQL): Error fetching locations:', JSON.stringify(error, null, 2));
          this._locationsData.next([]);
          return;
        }
        if (data && data.allLocations) {
          if (Array.isArray(data.allLocations)) {
            this._locationsData.next(data.allLocations);
            console.log('MaterialService (GraphQL): Locations data successfully fetched:', data.allLocations);
          } else {
            this._locationsData.next([]);
            console.warn('MaterialService (GraphQL): allLocations did not return an array.');
          }
        } else {
          this._locationsData.next([]);
        }
      },
      error: (err) => {
        console.error('MaterialService (GraphQL): Subscription error fetching locations:', JSON.stringify(err, null, 2));
        this._locationsData.next([]);
      }
    });
  }

  toggleItemSelection(materialId: string): void {
    const currentIds = this._selectedIds.value;
    const newIds = currentIds.includes(materialId)
      ? currentIds.filter(id => id !== materialId)
      : [...currentIds, materialId];
    this._selectedIds.next(newIds);
    localStorage.setItem('selectedMaterialIds', JSON.stringify(newIds));

    const updatedData = this._materialsData.value.map((item) =>
      item.inventoryId === materialId ? { ...item, checked: !item.checked } : item
    );
    this._materialsData.next(updatedData);
  }

// Xóa khỏi danh sách cập nhật
  removeItemFromUpdate(materialId: string): void {
    const updatedData = this._materialsData.value.map(item => {
      if (item.inventoryId === materialId) {
        return {
          ...item,
          checked: false,
          select_update: false 
        };
      }
      return item;
    });
    this._materialsData.next(updatedData);
  }



  fixedTestApiUrl_request_detail = environment.restApiBaseUrl + '/api/material/request-detail/123';
  fixedTestApiUrl_history_detail = environment.restApiBaseUrl + '/api/material/approval-detail-history/123';


  getData_updateManage(): Observable<updateManageData[]> {
    return this.updateManageData$;
  }

  getRequestDetailsById(requestID: string | number): Observable<RawGraphQLMaterial[]> {
    return this.http.get<RawGraphQLMaterial[]>(this.fixedTestApiUrl_request_detail).pipe(
    );
  }

  getData_updateDetail(): Observable<RawGraphQLMaterial[]> {
    return this.requestDetail$;
  }

  getItemsForUpdate(): Observable<RawGraphQLMaterial[]> {
    return this.materialsData$.pipe(
      map(materials => materials.filter(material => material.checked === true))
    );
  }

  getData(): Observable<RawGraphQLMaterial[]> {
    return this.materialsData$;
  }

  getData_approvalHistory(): Observable<updateHistoryData[]> {
    return this.updateHistoryData$;
  }

  getSelectedIds(): Observable<string[]> {
    return this.selectedIds$;
  }


  addItem(item: RawGraphQLMaterial): void {
    const currentData = this._materialsData.value;
    this._materialsData.next([...currentData, item]);
  }


  removeItem(inventoryIdToRemove: string): void {
    const filteredData = this._materialsData.value.filter(item => item.inventoryId !== inventoryIdToRemove);
    this._materialsData.next(filteredData);
    const currentSelectedIds = this._selectedIds.value;
    if (currentSelectedIds.includes(inventoryIdToRemove)) {
      const newSelectedIds = currentSelectedIds.filter(selectedId => selectedId !== inventoryIdToRemove);
      this._selectedIds.next(newSelectedIds);
      localStorage.setItem('selectedMaterialIds', JSON.stringify(newSelectedIds));
    }
  }

  // Lấy dữ liệu đơn đề nghị cập nhật
  fetchUpdateManageData(): void {
    this.http.get<updateManageData[]>(this.apiUrl_update_manage).subscribe({
      next: (data: updateManageData[]) => {
        this._updateManageData.next(data);
      },
      error: (error) => {
        console.error('Error fetching update-manage data:', error);
      }
    });
  }

  // Lấy lịch sử dữ liệu đề nghị cập nhật
  fetchUpdateHistoryData(): void {
    this.http.get<updateHistoryData[]>(this.apiUrl_history_manage).subscribe({
      next: (data: updateHistoryData[]) => {
        this._updateHistoryData.next(data);
      },
      error: (error) => {
        console.error('Error fetching update-history data:', error);
      }
    });
  }

  getUpdateManageData(): Observable<updateManageData[]> {
    return this.updateManageData$;
  }

  updateManageItem(updatedItem: updateManageData, index: number): void {
    const currentData = this._updateManageData.value;
    if (index >= 0 && index < currentData.length) {
      const newData = [...currentData];
      newData[index] = updatedItem;
      this._updateManageData.next(newData);
    }
  }

  // 
  deleteUpdateManageItem(index: number): void {
    const currentData = this._updateManageData.value;
    if (index >= 0 && index < currentData.length) {
      const newData = currentData.filter((_, i) => i !== index);
      this._updateManageData.next(newData);
    }
  }

  // Xuất excel
  private saveExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], { type: this.fileType });
    FileSaver.saveAs(data, fileName + this.fileExtension);
  }

}
