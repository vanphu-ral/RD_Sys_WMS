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
import { ActivatedRoute } from '@angular/router';
import { AreaService } from '../../area-component/service/area-service.component';
import { MatTooltip } from '@angular/material/tooltip';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { AuthService } from '../../../services/auth.service';
import { UserInfoComponent } from '../../../user/user-info.component';

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
    MatTooltip,
  ],
  templateUrl: './add-new-location.component.html',
  styleUrl: './add-new-location.component.scss',
})
export class AddNewLocationComponentComponent implements OnInit {
  isEditMode = false;
  shouldCreateSubLocations: boolean = false;

  appendMode: boolean = false;

  subLocations: {
    subCode: string;
    locationName: string;
    locationCode: string;
    areaCode: string;
    isEditing?: boolean;
  }[] = [];
  subLocationColumns: string[] = [
    'stt',
    'location',
    'subLocation',
    'combined',
    'actions',
  ];
  pagedSubLocations: any[] = [];
  areaList: any[] = [];
  pageSize = 5;
  pageIndex = 0;
  location: Location = {
    id: undefined,
    code: '',
    name: '',
    description: '',
    area_id: 0,
    address: '',
    humidity: 60,
    temperature: 30,
    barcode: '',
    is_multi_location: false,
    number_of_rack: 0,
    number_of_rack_empty: 0,
    parent_location_id: undefined,
    prefix_name: '',
    prefix_separator: '',
    child_location_row_count: 0,
    child_location_column_count: 0,
    suffix_separator: '',
    suffix_digit_len: '',
    is_active: true,
    updated_by: '',
  };

  //bien sinh sublocation
  prefix = {
    name: 'SLO',
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
  areaCode: string = '';
  constructor(
    private snackBar: MatSnackBar,
    private locationService: LocationService,
    private areaService: AreaService,
    private route: ActivatedRoute,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;

      this.areaService.getAreas().subscribe({
        next: (areaRes) => {
          this.areaList = areaRes.data;

          this.locationService.getLocationById(+id).subscribe({
            next: (res) => {
              this.location = res;
              this.selectedAreaId = res.area_id;

              const area = this.areaList.find((a) => a.id === this.selectedAreaId);
              const areaCode = (area?.code || '').replace(/\s+/g, '');
              this.areaCode = areaCode;

              this.subLocations = (res.sub_locations || []).map((item: any) => {
                const fullCode = item.code || '';

                // Format: areaCode-locationCode-subCode
                const parts = fullCode.split('-');

                let subCode = '';
                if (parts.length >= 3) {
                  subCode = parts.slice(2).join('-'); // "SLO-01-01"
                } else {
                  subCode = fullCode; // Fallback
                }

                return {
                  subCode: subCode,           //  "SLO-01-01"
                  locationCode: res.code,     // "C01"
                  locationName: item.name || item.code,
                  areaCode: areaCode,         // "19"
                  isEditing: false,
                };
              });


              this.updatePagedSubLocations();

              if (res.is_multi_location) {
                this.location.is_multi_location = true;
                this.grid.rows = res.child_location_row_count || 0;
                this.grid.columns = res.child_location_column_count || 0;
                this.grid.suffixSeparator = res.suffix_separator || '';
                this.grid.suffixLength = +(res.suffix_digit_len || 2);
                this.prefix.name = res.prefix_name || '';
                this.prefix.separator = res.prefix_separator || '';
              }
            },
            error: (err) => {
              console.error('Lỗi khi lấy location:', err);
            },
          });
        },
        error: (err) => {
          console.error('Lỗi khi lấy danh sách area:', err);
        },
      });
    } else {
      this.loadDataArea();
    }
  }


  getSelectedAreaName(): string {
    const area = this.areaList.find((a) => a.id === this.selectedAreaId);
    return area?.name || '';
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

  onExportExcel(): void {
    const exportData = this.subLocations.map((item) => ({
      STT: this.subLocations.indexOf(item) + 1,
      Location: item.locationCode,
      SubLocation: item.subCode,
      FullCode: `${item.areaCode}-${item.locationCode}-${item.subCode}`,
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = {
      Sheets: { SubLocations: worksheet },
      SheetNames: ['SubLocations'],
    };

    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    const blob: Blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    });

    FileSaver.saveAs(blob, `SubLocations_${this.location.code}.xlsx`);
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
    if (!this.location?.id) return;

    this.locationService.clearSubLocations(this.location.id).subscribe({
      next: () => {
        this.snackBar.open('Đã xoá toàn bộ sub-location thành công!', 'Đóng', {
          duration: 3000,
          panelClass: ['snackbar-success'],
        });

        this.subLocations = [];
        this.updatePagedSubLocations();
      },
      error: (err) => {
        console.error('Lỗi khi xoá sub-location:', err);
        this.snackBar.open('Xoá sub-location thất bại!', 'Đóng', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
      },
    });
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
    this.shouldCreateSubLocations = true;

    const existingCount = this.subLocations.length;
    const start = this.appendMode ? existingCount + 1 : 1;

    this.subLocations = this.appendMode ? [...this.subLocations] : [];

    for (let r = 0; r < this.grid.rows; r++) {
      const rowNum = (start + r).toString().padStart(this.grid.slotLength, '0');

      for (let c = 0; c < this.grid.columns; c++) {
        const colNum = (c + 1).toString().padStart(this.grid.suffixLength, '0');
        const subCode = `${this.prefix.name}${this.prefix.separator}${rowNum}${this.grid.suffixSeparator}${colNum}`;

        this.subLocations.push({
          subCode,
          locationName: this.location.name,
          locationCode: this.location.code,
          areaCode: this.areaCode,
          isEditing: false,
        });

      }
    }

    this.updatePagedData();
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
  updatePagedSubLocations(): void {
    const start = this.pageIndex * this.pageSize;
    this.pagedSubLocations = this.subLocations.slice(
      start,
      start + this.pageSize
    );
  }
  onPageChangeSubs(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePagedSubLocations();
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
  getBarcodeValue(): string {
    const area = this.areaList.find((a) => a.id === this.selectedAreaId);
    const areaName = (area?.code || '').replace(/\s+/g, '');
    const locationName = (this.location.code || '').replace(/\s+/g, '');
    return `${areaName}-${locationName}`;
  }

  updateBarcode(): void {
    this.location.barcode = this.getBarcodeValue();
  }

  onSave(): void {
    const username = this.authService.getUsername();

    const area = this.areaList.find((a) => a.id === this.selectedAreaId);
    const areaCode = (area?.code || '').replace(/\s+/g, '');
    const isMulti = this.location.is_multi_location;

    const payload: Location = {
      code: this.location.code,
      name: this.location.code,
      area_id: this.selectedAreaId || 0,
      address: this.location.address,
      description: this.location.description,
      is_multi_location: isMulti,
      barcode: this.location.barcode,
      humidity: +(this.location?.humidity ?? 0),
      temperature: +(this.location?.temperature ?? 0),
      updated_by: username,
    };

    if (isMulti) {
      Object.assign(payload, {
        number_of_rack: this.grid.rows * this.grid.columns,
        number_of_rack_empty: this.grid.rows * this.grid.columns,
        prefix_name: this.prefix.name,
        prefix_separator: this.prefix.separator,
        child_location_row_count: this.grid.rows,
        child_location_column_count: this.grid.columns,
        suffix_separator: this.grid.suffixSeparator,
        suffix_digit_len: this.grid.suffixLength,
      });
    }

    const request$ =
      this.isEditMode && this.location.id
        ? this.locationService.updateLocation(this.location.id, payload)
        : this.locationService.createLocation(payload);

    request$.subscribe({
      next: (res) => {
        const parentId = res.id || this.location.id;
        this.snackBar.open(
          `${this.isEditMode ? 'Cập nhật' : 'Tạo'} vị trí thành công!`,
          'Đóng',
          {
            duration: 3000,
            panelClass: ['snackbar-success'],
          }
        );

        if (
          isMulti &&
          this.shouldCreateSubLocations &&
          this.subLocations.length > 0
        ) {
          const subPayload = this.subLocations.map((sub) => ({
            code: areaCode + '-' + sub.locationCode + '-' + sub.subCode,
            name: sub.subCode,
            area_id: this.selectedAreaId || 0,
            address: this.location.address,
            is_multi_location: 0,
            humidity: 60,
            temperature: 30,
            barcode: areaCode + '-' + sub.locationCode + '-' + sub.subCode,
            is_active: 1,
            updated_by: username,
            // parent_location_id: parentId,
          }));

          this.locationService
            .createSubLocations(parentId, subPayload)
            .subscribe({
              next: () => {
                this.snackBar.open(
                  `${this.isEditMode ? 'Cập nhật' : 'Tạo'
                  } sub location thành công!`,
                  'Đóng',
                  {
                    duration: 3000,
                    panelClass: ['snackbar-success'],
                  }
                );
              },
              error: (err) => {
                console.error('Lỗi khi tạo sub-location:', err);
                this.snackBar.open(
                  `${this.isEditMode ? 'Cập nhật' : 'Tạo'} location thất bại!`,
                  'Đóng',
                  {
                    duration: 3000,
                    panelClass: ['snackbar-error'],
                  }
                );
              },
            });
        }
      },
      error: (err) => {
        console.error('Lỗi khi lưu vị trí:', err);
        this.snackBar.open(
          `${this.isEditMode ? 'Cập nhật' : 'Tạo'} vị trí thất bại!`,
          'Đóng',
          {
            duration: 3000,
            panelClass: ['snackbar-error'],
          }
        );
      },
    });
  }
}
