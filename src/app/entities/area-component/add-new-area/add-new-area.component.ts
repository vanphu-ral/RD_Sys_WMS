import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, NgForm } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLinkWithHref } from '@angular/router';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AreaService } from '../service/area-service.component';

export interface Area {
  id: number;
  code: string;
  name: string;
  thu_kho: string;
  description: string;
  address: string;
  is_active: boolean;
}
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
  templateUrl: './add-new-area.component.html',
  styleUrl: './add-new-area.component.scss',
})
export class AddNewAreaComponentComponent implements OnInit {
  isSaveArea = false;
  isEditMode = false;
  pageTitle = 'Thêm mới Area';
  submitLabel = 'Lưu';
  area = {
    id: 0,
    code: '',
    name: '',
    description: '',
    address: '',
    thu_kho: '',
    is_active: false,
  };

  constructor(
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private areaService: AreaService,
    private router: Router
  ) {}
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.pageTitle = 'Chỉnh sửa Area';
      this.submitLabel = 'Cập nhật';
      this.loadAreaById(+id);
    }
  }
  loadAreaById(id: number): void {
    this.areaService.getAreas().subscribe({
      next: (res) => {
        const found = res.data.find((item) => item.id === +id);
        if (found) {
          this.area = {
            id: found.id,
            code: found.code,
            name: found.name,
            thu_kho: found.storekeeper,
            description: found.description,
            address: found.address,
            is_active: !!found.is_active,
          };
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy danh sách Area:', err);
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

  onGenerate() {
    // sinh danh sách sub-location
  }

  onCancel() {
    // location.restrictMulti = false;
  }

  onSave(areaForm: NgForm): void {
    if (areaForm.invalid) {
      this.snackBar.open('Vui lòng điền đầy đủ thông tin!', 'Đóng', {
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'bottom',
        panelClass: ['snackbar-error', 'snackbar-position'],
      });
      return;
    }

    if (this.isEditMode) {
      // Trường hợp cập nhật
      const payload = {
        code: this.area.code,
        name: this.area.name,
        thu_kho: this.area.thu_kho,
        description: this.area.description,
        address: this.area.address,
        is_active: this.area.is_active ? 1 : 0,
      };

      this.areaService.updateArea(this.area.id, payload).subscribe({
        next: () => {
          this.snackBar.open('Cập nhật thành công!', 'Đóng', {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'bottom',
            panelClass: ['snackbar-success', 'snackbar-position'],
          });
          this.router.navigate(['/areas']);
        },
        error: (err) => {
          console.error('Lỗi khi cập nhật kho:', err);
          this.snackBar.open('Cập nhật thất bại!', 'Đóng', {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'bottom',
            panelClass: ['snackbar-error', 'snackbar-position'],
          });
        },
      });
    } else {
      // Trường hợp thêm mới
      const payload = {
        code: this.area.code,
        name: this.area.name,
        thu_kho: this.area.thu_kho,
        description: this.area.description,
        address: this.area.address,
        is_active: this.area.is_active ? 1 : 0,
      };

      this.areaService.createArea(payload).subscribe({
        next: () => {
          this.isSaveArea = true;
          this.snackBar.open('Lưu thành công!', 'Đóng', {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'bottom',
            panelClass: ['snackbar-success', 'snackbar-position'],
          });
          // this.router.navigate(['/areas']);
        },
        error: (err) => {
          console.error('Lỗi khi lưu kho:', err);
          this.snackBar.open('Lưu thất bại!', 'Đóng', {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'bottom',
            panelClass: ['snackbar-error', 'snackbar-position'],
          });
        },
      });
    }
  }
}
