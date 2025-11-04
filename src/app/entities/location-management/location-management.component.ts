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
import { RouterLinkWithHref } from '@angular/router';
import { LocationService } from './service/location-management.service.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Location } from './models/location.model';

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
  displayedColumns: string[] = [
    'id',
    'code',
    'name',
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
  constructor(
    private locationService: LocationService,
    private snackBar: MatSnackBar
  ) {}
  ngOnInit(): void {
    this.loadLocations();
  }
  //load data
  loadLocations(): void {
    this.locationService
      .getLocations(this.currentPage, this.pageSize)
      .subscribe({
        next: (res) => {
          this.locations = res.data;
          this.originalLocations = [...res.data];
          this.locations = [...res.data];
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
    console.log('Edit location:', location);
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

    const filtered = this.originalLocations.filter((loc) => {
      const matchesCode = loc.code
        ?.toLowerCase()
        .includes(this.filterValues.code.trim().toLowerCase());
      const matchesName = loc.name
        ?.toLowerCase()
        .includes(this.filterValues.name.trim().toLowerCase());
      const matchesDescription = loc.description
        ?.toLowerCase()
        .includes(this.filterValues.description.trim().toLowerCase());
      const matchesArea = String(loc.area_id).includes(
        this.filterValues.area.trim()
      );

      const matchesStatus =
        this.filterValues.is_active === ''
          ? true
          : String(loc.is_active) === this.filterValues.is_active;

      return (
        matchesCode &&
        matchesName &&
        matchesDescription &&
        matchesArea &&
        matchesStatus
      );
    });

    this.totalItems = filtered.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.locations = filtered;
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
