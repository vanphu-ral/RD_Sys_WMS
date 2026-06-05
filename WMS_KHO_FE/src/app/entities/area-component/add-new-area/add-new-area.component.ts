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
import { AreaService, AreaPayload, TenantOption } from '../service/area-service.component';
import { resolveEntitySaveErrorMessage } from '../../../services/api-error-message.util';
import { UserInfoComponent } from '../../../user/user-info.component';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface Area {
  id: number;
  code: string;
  name: string;
  thu_kho: string;
  description: string;
  address: string;
  is_active: boolean;
}

export interface UserOption {
  id: number;
  name: string;
  email?: string;
}

export interface PermissionGroup {
  type: 'add' | 'edit' | 'delete';
  label: string;
  icon: string;
  users: UserOption[];
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
    MatChipsModule,
    MatSlideToggleModule,
    MatMenuModule,
    MatTooltipModule,
  ],
  templateUrl: './add-new-area.component.html',
  styleUrl: './add-new-area.component.scss',
})
export class AddNewAreaComponentComponent implements OnInit {
  isSaveArea = false;
  isEditMode = false;
  pageTitle = 'Thêm mới kho';
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

  tenants: TenantOption[] = [];
  users: UserOption[] = [];
  selectedTenantId: string | null = null;
  private editTenantRef: { tenant_id?: string; company?: string } | null = null;

  //role view default
  viewUsers: UserOption[] = [];

  //role usser add
  permissionGroups: PermissionGroup[] = [];

  availablePermTypes: { type: 'add' | 'edit' | 'delete'; label: string; icon: string }[] = [
    { type: 'add', label: 'Thêm', icon: 'add_circle' },
    { type: 'edit', label: 'Sửa', icon: 'edit' },
    { type: 'delete', label: 'Xóa', icon: 'delete' },
  ];
  userSelections: Record<string, number | null> = { view: null };

  constructor(
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private areaService: AreaService,
    private router: Router,
  ) { }
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.pageTitle = 'Chỉnh sửa thông tin kho';
      this.submitLabel = 'Cập nhật';
      this.loadAreaById(+id);
    }
    this.loadCompanies();
    this.loadUsers();
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
          this.editTenantRef = {
            tenant_id: found.tenant_id,
            company: found.company,
          };
          this.applyTenantSelectionFromArea(this.editTenantRef);
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy danh sách Area:', err);
      },
    });
  }
  private applyTenantSelectionFromArea(found: {
    tenant_id?: string;
    company?: string;
  }): void {
    this.selectedTenantId =
      found.tenant_id ||
      this.tenants.find((t) => t.company_name === found.company)?.id ||
      null;
  }
  loadCompanies(): void {
    this.areaService.getTenants().subscribe({
      next: (tenants) => {
        this.tenants = tenants;
        if (this.editTenantRef) {
          this.applyTenantSelectionFromArea(this.editTenantRef);
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy danh sách công ty:', err);
        this.snackBar.open('Không tải được danh sách công ty', 'Đóng', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
        });
      },
    });
  }
  loadUsers(): void {
    // TODO: thay bằng API thực — ví dụ: this.userService.getUsers().subscribe(...)
    this.users = [
      { id: 1, name: 'Nguyễn Văn A', email: 'a@example.com' },
      { id: 2, name: 'Trần Thị B', email: 'b@example.com' },
      { id: 3, name: 'Lê Văn C', email: 'c@example.com' },
    ];
  }

  addUserToView(): void {
    const uid = this.userSelections['view'];
    if (!uid) return;
    const user = this.users.find(u => u.id === uid);
    if (user && !this.viewUsers.find(u => u.id === uid)) {
      this.viewUsers.push(user);
    }
    this.userSelections['view'] = null;
  }

  removeUserFromView(userId: number): void {
    this.viewUsers = this.viewUsers.filter(u => u.id !== userId);
  }

  // Thêm nhóm quyền mới (add/edit/delete)
  addPermissionGroup(type: 'add' | 'edit' | 'delete'): void {
    if (this.permissionGroups.find(g => g.type === type)) return; // đã có rồi
    const meta = this.availablePermTypes.find(p => p.type === type)!;
    this.permissionGroups.push({ type, label: meta.label, icon: meta.icon, users: [] });
    this.userSelections[type] = null;
  }

  removePermissionGroup(type: string): void {
    this.permissionGroups = this.permissionGroups.filter(g => g.type !== type);
  }

  addUserToGroup(group: PermissionGroup): void {
    const uid = this.userSelections[group.type];
    if (!uid) return;
    const user = this.users.find(u => u.id === uid);
    if (user && !group.users.find(u => u.id === uid)) {
      group.users.push(user);
    }
    this.userSelections[group.type] = null;
  }

  removeUserFromGroup(group: PermissionGroup, userId: number): void {
    group.users = group.users.filter(u => u.id !== userId);
  }

  // Helper: những loại quyền chưa được thêm
  get availableToAdd() {
    return this.availablePermTypes.filter(
      p => !this.permissionGroups.find(g => g.type === p.type)
    );
  }
  isUserInView(userId: number): boolean {
    return this.viewUsers.some(v => v.id === userId);
  }

  isUserInGroup(group: PermissionGroup, userId: number): boolean {
    return group.users.some(v => v.id === userId);
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

    const payload = this.buildAreaPayload();
    if (!payload) {
      this.snackBar.open('Vui lòng chọn công ty!', 'Đóng', {
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'bottom',
        panelClass: ['snackbar-error', 'snackbar-position'],
      });
      return;
    }

    if (this.isEditMode) {
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
          this.snackBar.open(resolveEntitySaveErrorMessage(err, 'area', true), 'Đóng', {
            duration: 4000,
            horizontalPosition: 'right',
            verticalPosition: 'bottom',
            panelClass: ['snackbar-error', 'snackbar-position'],
          });
        },
      });
    } else {
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
          this.snackBar.open(resolveEntitySaveErrorMessage(err, 'area', false), 'Đóng', {
            duration: 4000,
            horizontalPosition: 'right',
            verticalPosition: 'bottom',
            panelClass: ['snackbar-error', 'snackbar-position'],
          });
        },
      });
    }
  }

  private buildAreaPayload(): AreaPayload | null {
    const tenant = this.tenants.find((t) => t.id === this.selectedTenantId);
    if (!tenant) return null;

    return {
      code: (this.area.code || '').trim(),
      name: (this.area.name || '').trim(),
      company: tenant.company_name,
      factory: tenant.factory,
      tenant_id: tenant.id,
      thu_kho: this.area.thu_kho,
      description: this.area.description,
      address: this.area.address,
      is_active: this.area.is_active ? 1 : 0,
    };
  }
}
