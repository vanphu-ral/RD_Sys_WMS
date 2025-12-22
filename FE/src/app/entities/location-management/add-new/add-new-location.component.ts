import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { RouterLinkWithHref } from '@angular/router';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LocationService } from '../service/location-management.service.component';
import { Location } from '../models/location.model';
import { AreaService } from '../../area-component/service/area-service.component';

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
    MatSlideToggleModule,
  ],
  templateUrl: './add-new-location.component.html',
  styleUrl: './add-new-location.component.scss',
})
export class AddNewLocationComponentComponent implements OnInit {
  subLocations: {
    subCode: string;
    locationName: string;
    isEditing?: boolean;
  }[] = [];
  subLocationColumns: string[] = ['stt', 'location', 'subLocation', 'actions'];
  pagedSubLocations: any[] = [];
  areaList: any[] = [];
  pageSize = 5;
  pageIndex = 0;
  location = {
    code: '',
    name: '',
    description: '',
    area_id: '',
    address: '',
    humidity: '',
    temperature: '',
    barcode: '',
    restrictMulti: false,
  };

  //bien sinh sublocation
  prefix = {
    name: 'SLOT',
    separator: '-',
  };

  grid = {
    rows: 4,
    columns: 32,
    start: 1,
    slotLength: 2,
    suffixLength: 2,
    suffixSeparator: '-',
  };
  selectedAreaId: number | undefined;

  constructor(
    private snackBar: MatSnackBar,
    private locationService: LocationService,
    private areaService: AreaService
  ) {}

  ngOnInit(): void {
    this.loadDataArea();
  }

  loadDataArea(): void {
    this.areaService.getAreas().subscribe({
      next: (res) => {
        this.areaList = res.data; 
      },
      error: (err) => {
        console.error('Lỗi khi lấy danh sách area:', err);
      },
    });
  }

  onSearch(): void {
    console.log('Searching for:');
  }

  onRefresh(): void {
    console.log('Refreshing data...');
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

  //xu ly su kien sub location
  onClear() {
    // reset cấu hình
  }

  getPreview(): string {
    const prefix = this.prefix.name || '';
    const separator = this.prefix.separator || '';
    const start = this.grid.start || 1;
    const suffixSeparator = this.grid.suffixSeparator || '';
    const column = this.grid.columns || 1;
    const slotLength = this.grid.slotLength || 2;
    const suffixLength = this.grid.suffixLength || 2;

    const rowFormatted = start.toString().padStart(slotLength, '0');
    const colFormatted = column.toString().padStart(suffixLength, '0');

    return `${prefix}${separator}${rowFormatted}${suffixSeparator}${colFormatted}`;
  }
  getTotalLocations(): number {
    return (this.grid.rows || 0) * (this.grid.columns || 0);
  }

  onGenerate() {
    this.subLocations = []; // reset danh sách cũ

    this.subLocations = [];

    const prefix = this.prefix.name || 'SLOT';
    const separator = this.prefix.separator || '-';

    const rows = this.grid.rows || 1;
    const columns = this.grid.columns || 1;
    const start = this.grid.start || 1;
    const slotLength = this.grid.slotLength || 2;
    const suffixLength = this.grid.suffixLength || 2;
    const suffixSeparator = this.grid.suffixSeparator || separator;

    for (let r = 0; r < rows; r++) {
      const rowNum = (start + r).toString().padStart(slotLength, '0');

      for (let c = 0; c < columns; c++) {
        const colNum = (c + 1).toString().padStart(suffixLength, '0');
        const subCode = `${prefix}${separator}${rowNum}${suffixSeparator}${colNum}`;

        this.subLocations.push({
          subCode,
          locationName: this.location.name,
        });
      }
    }
    this.updatePagedData();
    console.log('Generated SubLocations:', this.subLocations);
  }

  onEditSubLocation(index: number) {
    const globalIndex = this.pageIndex * this.pageSize + index;
    this.subLocations[globalIndex].isEditing = true;
    this.updatePagedData();
  }
  onConfirmEdit(index: number) {
    const globalIndex = this.pageIndex * this.pageSize + index;
    this.subLocations[globalIndex].isEditing = false;
    this.updatePagedData();
  }

  onPageChange(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.updatePagedData();
  }

  updatePagedData() {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    this.pagedSubLocations = this.subLocations.slice(start, end);
  }

  onDeleteSubLocation(index: number) {
    const globalIndex = this.pageIndex * this.pageSize + index;
    this.subLocations.splice(globalIndex, 1);
    this.updatePagedData();
  }

  onCancel() {
    // location.restrictMulti = false;
  }

  onSave(): void {
    const payload: Location = {
      code: this.location.code,
      name: this.location.name,
      area_id: this.selectedAreaId || 0,
      address: this.location.address,
      description: this.location.description,
      is_multi_location: this.location.restrictMulti || false,
      number_of_rack: this.grid.rows * this.grid.columns,
      number_of_rack_empty: this.grid.rows * this.grid.columns,
      parent_location_id: undefined,
      barcode: this.location.barcode,
      humidity: 50,
      temperature: 24,
      prefix_name: this.prefix.name,
      prefix_separator: this.prefix.separator,
      child_location_row_count: this.grid.rows,
      child_location_column_count: this.grid.columns,
      suffix_separator: this.grid.suffixSeparator,
      suffix_digit_len: this.grid.suffixLength.toString(),
    };

    this.locationService.createLocation(payload).subscribe({
      next: (res) => {
        const parentId = res.id!;
        this.snackBar.open('Tạo location thành công!', 'Đóng', {
          duration: 3000,
          panelClass: ['snackbar-success'],
        });

        // Nếu có sub-location thì gọi tiếp
        if (this.location.restrictMulti && this.subLocations.length > 0) {
          const subPayload = this.subLocations.map((sub) => ({
            code: sub.subCode,
            name: sub.subCode,
            area_id: this.selectedAreaId || 0,
            address: this.location.address,
            is_multi_location: 0,
            humidity: 60,
            temperature: 30,
            barcode: sub.subCode,
            is_active: 1,
            updated_by: 'test',
            parent_location_id: parentId,
          }));

          this.locationService
            .createSubLocations(parentId, subPayload)
            .subscribe({
              next: () => {
                this.snackBar.open('Tạo sub-location thành công!', 'Đóng', {
                  duration: 3000,
                  panelClass: ['snackbar-success'],
                });
                // this.router.navigate(['/locations']);
              },
              error: (err) => {
                console.error('Lỗi khi tạo sub-location:', err);
                this.snackBar.open('Tạo sub-location thất bại!', 'Đóng', {
                  duration: 3000,
                  panelClass: ['snackbar-error'],
                });
              },
            });
        } else {
          // this.router.navigate(['/locations']);
        }
      },
      error: (err) => {
        console.error('Lỗi khi tạo location:', err);
        this.snackBar.open('Tạo location thất bại!', 'Đóng', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
      },
    });
  }
}
