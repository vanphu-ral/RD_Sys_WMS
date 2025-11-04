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

export interface Location {
  id: number;
  code: string;
  name: string;
  type: string;
  area: string;
  racks: number;
  multi: boolean;
  emptyRacks: number;
  restrictMulti: false;
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
  area = {
    code: '',
    name: '',
    description: '',
    address: '',
    thu_kho: '',
    updated_by: 'test',
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
      this.loadAreaById(+id);
    }
  }
  loadAreaById(id: number): void {
    console.log('Loading area with ID:', id);
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

    this.areaService.createArea(this.area).subscribe({
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
        console.error('Lỗi khi lưu area:', err);
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
