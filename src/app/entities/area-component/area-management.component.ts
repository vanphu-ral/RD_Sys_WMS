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
import { AreaService } from './service/area-service.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UrlEncoderService } from '../encoded-redirect/services/url-encoder.service';
export interface Area {
  id: number;
  code: string;
  name: string;
  storekeeper: string;
  description: string;
  address: string;
  is_active: boolean;
}

@Component({
  selector: 'app-area-component',
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
  ],
  templateUrl: './area-management.component.html',
  styleUrl: './area-management.component.scss',
})
export class AreaManagementComponent {
  showMobileFilters: boolean = false;

  //total item
  totalItems: number = 0;
  //colmn
  displayedColumns: string[] = [
    'id',
    'code',
    'name',
    'storekeeper',
    'description',
    'address',
    'is_active',
    'actions',
  ];
  filterValues = {
    code: '',
    name: '',
    storekeeper: '',
    is_active: '',
    description: '',
    address: '',
  };
  filterColumns: string[] = [
    'code',
    'name',
    'is_active',
    'area',
    'description',
  ];
  //danh sach goc
  originalAreas: Area[] = [];
  //danh sach hien thi
  areas: Area[] = [];

  searchTerm: string = '';

  //phan trang
  pageSize: number = 10;
  currentPage: number = 1;
  totalPages: number = 1;

  constructor(
    private areaService: AreaService,
    private snackBar: MatSnackBar,
    private encoder: UrlEncoderService,
    private router: Router
  ) {}
  ngOnInit(): void {
    this.loadData();
  }
  loadData(): void {
    this.areaService.getAreas().subscribe({
      next: (res) => {
        this.areas = res.data;
        this.originalAreas = [...res.data];
        this.totalItems = res.meta.total_items;
        this.pageSize = [10, 25, 50, 100].includes(res.meta.size)
          ? res.meta.size
          : 10;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
      },
      error: (err) => {
        console.error('Lỗi khi lấy danh sách area:', err);
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
  getStatusClass(isActive: boolean): string {
    return isActive ? 'status-active-label' : 'status-inactive-label';
  }

  getStatusLabel(isActive: boolean): string {
    return isActive ? 'Hoạt động' : 'Không hoạt động';
  }

  onSearch(): void {
    console.log('Searching for:', this.searchTerm);
  }

  onRefresh(): void {
    this.loadData();
  }

  onAddNew(): void {
    console.log('Add new location');
  }

  onEdit(location: Location): void {
    console.log('Edit location:', location);
  }

  //cap nhat trang thai status
  onDelete(area: Area): void {
    const newStatus = !area.is_active;

    this.areaService.updateAreaStatus(area.id, newStatus).subscribe({
      next: () => {
        area.is_active = newStatus;
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
  }

  //phan trang
  getPagedAreas(): Area[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.areas.slice(start, end);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    console.log('Page changed to:', page);
  }
  onPageSizeChange(): void {
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.areas.length / this.pageSize);
  }
  applyFilter(): void {
    const { code, name, storekeeper, description, address, is_active } =
      this.filterValues;

    const isEmpty =
      !code.trim() &&
      !name.trim() &&
      !storekeeper.trim() &&
      !description.trim() &&
      !address.trim() &&
      !is_active;

    if (isEmpty) {
      this.areas = [...this.originalAreas];
      return;
    }

    this.areas = this.originalAreas.filter((loc) => {
      return (
        loc.code.toLowerCase().includes(code.toLowerCase()) &&
        loc.name.toLowerCase().includes(name.toLowerCase()) &&
        loc.storekeeper.toLowerCase().includes(storekeeper.toLowerCase()) &&
        loc.description.toLowerCase().includes(description.toLowerCase()) &&
        loc.address.toLowerCase().includes(address.toLowerCase()) &&
        (is_active === '' || String(loc.is_active) === is_active)
      );
    });
  }

  //mobile
  toggleMobileFilters(): void {
    this.showMobileFilters = !this.showMobileFilters;
  }

  clearFilters(): void {
    this.filterValues = {
      code: '',
      name: '',
      storekeeper: '',
      is_active: '',
      description: '',
      address: '',
    };
    this.applyFilter();
  }
}
