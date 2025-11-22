import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { Router, RouterLinkWithHref } from '@angular/router';
import { LocationService } from './service/location-management.service.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Location } from './models/location.model';
import { AreaService } from '../area-component/service/area-service.component';
import { Area } from '../area-component/area-management.component';

@Component({
  selector: 'app-location-component',
  standalone: true,
  imports: [
    MatIconModule,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatSelectModule,
    CommonModule,
    RouterLinkWithHref,
    MatTooltipModule,
  ],
  templateUrl: './location-management.component.html',
  styleUrl: './location-management.component.scss',
})
export class LocationManagementComponent implements OnInit {
  showMobileFilters: boolean = false;
  //filter type
  selectedTypeFilter: string = '';
  originalData: any[] = [];
  filteredData: any[] = [];
  displayedColumns: string[] = [
    // 'id',
    'stt',
    'code',
    // 'name',
    'description',
    'area_id',
    'number_of_rack',
    'is_multi_location',
    'number_of_rack_empty',
    'is_active',
    'actions',
  ];
  filterValues = {
    code: '',
    name: '',
    description: '',
    area: '',
    is_active: '',
  };
  filterColumns: string[] = ['code', 'name', 'description', 'area'];

  locations: Location[] = [];
  originalLocations: Location[] = [];

  searchTerm: string = '';
  pageSize: number = 10;
  currentPage: number = 1;
  totalItems: number = 0;
  totalPages: number = 1;
  areas: Area[] = [];
  constructor(
    private locationService: LocationService,
    private snackBar: MatSnackBar,
    private router: Router,
    private areaService: AreaService
  ) { }
  ngOnInit(): void {
    this.loadLocations();
    this.loadAreas();
  }
  //load data
  loadLocations(): void {
    this.locationService
      .getLocations(this.currentPage, this.pageSize)
      .subscribe({
        next: (res) => {
          const sorted = [...res.data].sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
          this.locations = sorted;
          this.originalLocations = [...sorted];
          this.filteredData = [...sorted];
          this.totalItems = res.meta.total_items;
          this.pageSize = res.meta.size;
          this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        },
        error: (err) => {
          console.error('Lỗi khi lấy danh sách location:', err);
        },
      });
  }

  getTypeClass(type: string): string {
    const typeClasses: { [key: string]: string } = {
      SITE: 'type-site',
      BUILDING: 'type-building',
      FLOOR: 'type-floor',
      MATERIAL: 'type-material',
    };
    return typeClasses[type] || '';
  }
  getStatusClass(isActive: boolean | undefined): string {
    return isActive === true ? 'status-active-label' : 'status-inactive-label';
  }

  getStatusLabel(isActive: boolean | undefined): string {
    return isActive === true ? 'Active' : 'Inactive';
  }
  loadAreas(): void {
    this.areaService.getAreas().subscribe({
      next: (res) => {
        this.areas = res.data; // danh sách kho chính
      },
      error: (err) => {
        console.error('Lỗi khi lấy danh sách kho:', err);
      },
    });
  }
  getAreaName(id: number): string {
    const area = this.areas.find((a) => a.id === id);
    return area?.name || `#${id}`;
  }

  onSearch(): void {
    console.log('Searching for:', this.searchTerm);
  }

  onRefresh(): void {
    this.loadLocations();
  }

  onAddNew(): void {
    console.log('Add new location');
  }

  onEdit(location: Location): void {
    this.router.navigate(['/location/add-new', location.id]);
  }

  onDelete(location: Location): void {
    console.log('Delete location:', location);
  }
  getPagedLocations(): Location[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.locations.slice(start, start + this.pageSize);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadLocations();
  }
  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadLocations();
  }
  //type
  getLocationType(location: Location): 'Multi' | 'Single' | 'SubLocation' {
    const isMulti = location.is_multi_location === true;
    const hasParent = location.parent_location_id != null;

    let type: 'Multi' | 'Single' | 'SubLocation' = 'Single';

    if (isMulti && !hasParent) type = 'Multi';
    else if (!isMulti && hasParent) type = 'SubLocation';
    else if (!isMulti && !hasParent) type = 'Single';

    // console.log('🧭', location.code, {
    //   is_multi_location: location.is_multi_location,
    //   parent_location_id: location.parent_location_id,
    //   isMulti,
    //   hasParent,
    //   resultType: type,
    // });

    return type;
  }

  applyTypeFilter(): void {
    // console.log('🔍 selectedTypeFilter:', this.selectedTypeFilter);
    if (!this.selectedTypeFilter) {
      this.filteredData = [...this.originalLocations];
    } else {
      this.filteredData = this.originalLocations.filter(
        (loc) => this.getLocationType(loc) === this.selectedTypeFilter
      );
    }
    this.filteredData = [...this.filteredData];
  }

  //doi trang thai location
  onChangeStatus(location: Location): void {
    const newStatus = !location.is_active;

    if (location.id !== undefined) {
      this.locationService
        .updateLocationStatus(location.id, newStatus)
        .subscribe({
          next: () => {
            location.is_active = newStatus;
            this.snackBar.open('Cập nhật trạng thái thành công!', 'Đóng', {
              duration: 3000,
              horizontalPosition: 'right',
              verticalPosition: 'bottom',
              panelClass: ['snackbar-success', 'snackbar-position'],
            });
          },
          error: (err) => {
            this.snackBar.open('Lỗi cập nhật trạng thái!', 'Đóng', {
              duration: 3000,
              horizontalPosition: 'right',
              verticalPosition: 'bottom',
              panelClass: ['snackbar-error', 'snackbar-position'],
            });
            console.error('Lỗi cập nhật trạng thái:', err);
          },
        });
    } else {
      this.snackBar.open(
        'Không thể cập nhật trạng thái: ID không xác định!',
        'Đóng',
        {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
          panelClass: ['snackbar-error', 'snackbar-position'],
        }
      );
      console.error('Lỗi cập nhật trạng thái: location.id is undefined');
    }
  }

  //ham tim kiem
  applyFilter(): void {
    this.currentPage = 1;

    const filters = {
      code: this.filterValues.code?.trim(),
      name: this.filterValues.name?.trim(),
      description: this.filterValues.description?.trim(),
      area_id: this.filterValues.area || '', // truyền id
      is_active: this.filterValues.is_active,
      is_multi_location: this.selectedTypeFilter,
    };

    this.locationService
      .getLocations(this.currentPage, this.pageSize, filters)
      .subscribe({
        next: (res) => {
          this.locations = res.data;
          this.filteredData = [...res.data];
          this.totalItems = res.meta.total_items;
          this.pageSize = res.meta.size;
          this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        },
        error: (err) => {
          console.error('Lỗi khi lọc danh sách location:', err);
        },
      });
  }

  //mobile filter methods
  toggleMobileFilters(): void {
    this.showMobileFilters = !this.showMobileFilters;
  }
  clearFilters(): void {
    this.filterValues = {
      code: '',
      name: '',
      description: '',
      area: '',
      is_active: '',
    };
    this.locations = [...this.originalLocations];
    this.totalItems = this.locations.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
  }
}
