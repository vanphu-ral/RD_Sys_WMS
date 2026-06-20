import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LuanChuyenKhoService,
  MinimalLocation,
  WarehouseTransferRequirement,
} from '../service/luan-chuyen-kho.service';
import { forkJoin } from 'rxjs';
import { PermissionService } from '../../../../services/permission.service';

export interface ChuyenKhoItem {
    id: number;
    maYeuCau: string;
    tuKho: string;
    denKho: string;
    nguoiTao: string;
    ngayTao: string;
    ghiChu: string;
    tongSoLuong: number;
    soPallet: number;
    soThung: number;
    trangThai: 'Đã duyệt' | 'Chưa duyệt';
}

@Component({
    selector: 'app-luan-chuyen-kho-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './luan-chuyen-kho-list.component.html',
    styleUrls: ['./luan-chuyen-kho-list.component.scss'],
})
export class LuanChuyenKhoListComponent implements OnInit {
    /** true  = vào từ "Tạo đơn chuyển kho"
     *  false = vào từ "Phê duyệt đơn chuyển" */
    isCreateMode = true;
    canModify = true;

    // ── Dynamic labels ──────────────────────────────────────────────────────────
    get pageTitle(): string {
        return this.isCreateMode ? 'Tạo đơn chuyển kho' : 'Phê duyệt chuyển kho';
    }

    get pageSubtitle(): string {
        return this.isCreateMode
            ? 'Create external warehouse transfer'
            : 'Approve external warehouse transfer';
    }

    get sectionTitle(): string {
        return this.isCreateMode
            ? 'Danh sách đơn chuyển kho'
            : 'Danh sách đơn chờ phê duyệt';
    }

    dataList: ChuyenKhoItem[] = [];
    pageSize = 20;
    currentPage = 1;
    totalItems = 0;
    totalPages = 0;
    readonly pageSizeOptions = [10, 20, 50];

    columnFilters = {
        maYeuCau: '',
        tuKho: '',
        denKho: '',
        nguoiTao: '',
        ngayTao: '',
        ghiChu: '',
        tongSoLuong: '',
        soPallet: '',
        soThung: '',
        trangThai: '',
    };
    private locationMap = new Map<string, string>();

    get filteredList(): ChuyenKhoItem[] {
        return this.dataList.filter((item) => this.matchesColumnFilters(item));
    }

    get paginationFrom(): number {
        if (this.totalItems === 0) return 0;
        return (this.currentPage - 1) * this.pageSize + 1;
    }

    get paginationTo(): number {
        return Math.min(this.currentPage * this.pageSize, this.totalItems);
    }

    get visiblePages(): number[] {
        const total = this.totalPages;
        const cur = this.currentPage;
        const pages: number[] = [];

        if (total <= 7) {
            return Array.from({ length: total }, (_, i) => i + 1);
        }

        pages.push(1, 2, 3);

        if (cur > 4) pages.push(-1);

        for (let p = Math.max(4, cur - 1); p <= Math.min(total - 2, cur + 1); p++) {
            if (!pages.includes(p)) pages.push(p);
        }

        if (cur < total - 3) pages.push(-1);

        [total - 1, total].forEach((p) => {
            if (!pages.includes(p)) pages.push(p);
        });

        return pages;
    }

    get hasActiveFilters(): boolean {
        return Object.values(this.columnFilters).some((v) => String(v).trim() !== '');
    }

    get emptyMessage(): string {
        if (this.dataList.length === 0) {
            return 'Không có dữ liệu';
        }
        if (this.filteredList.length === 0) {
            return 'Không có dữ liệu phù hợp với bộ lọc';
        }
        return '';
    }

    constructor(
      private route: ActivatedRoute,
      private router: Router,
      private luanChuyenKhoService: LuanChuyenKhoService,
      private permissionService: PermissionService
    ) { }

    ngOnInit(): void {
        this.canModify = this.permissionService.canPerformKhoThanhPhamActions();
        // Đọc query param ?mode=approve để phân biệt luồng
        // Mặc định là create nếu không có param
        const mode = this.route.snapshot.queryParamMap.get('mode');
        this.isCreateMode = mode !== 'approve';
        this.loadRequirements();
    }

    private formatDate(dateValue: string): string {
      const date = new Date(dateValue);
      if (Number.isNaN(date.getTime())) {
        return dateValue;
      }
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const hh = String(date.getHours()).padStart(2, '0');
      const min = String(date.getMinutes()).padStart(2, '0');
      return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
    }

    private mapRequirementToItem(req: WarehouseTransferRequirement): ChuyenKhoItem {
      return {
        id: req.id,
        maYeuCau: req.requirement_code,
        tuKho: this.getLocationCode(req.source_warehouse),
        denKho: this.getLocationCode(req.destination_warehouse),
        nguoiTao: req.created_by,
        ngayTao: this.formatDate(req.created_at),
        ghiChu: req.note || '',
        tongSoLuong: req.total_quantity,
        soPallet: req.number_of_pallet,
        soThung: req.number_of_box,
        trangThai: req.status === 'Đã duyệt' ? 'Đã duyệt' : 'Chưa duyệt',
      };
    }

    private getLocationCode(rawWarehouse: string | number): string {
      const key = String(rawWarehouse);
      return this.locationMap.get(key) || key;
    }

    private buildLocationMap(locations: MinimalLocation[]): void {
      this.locationMap.clear();
      (locations || []).forEach((loc) => {
        this.locationMap.set(String(loc.id), loc.code);
      });
    }

    private loadRequirements(): void {
      const requirements$ = this.isCreateMode
        ? this.luanChuyenKhoService.getRequirements(this.currentPage, this.pageSize)
        : this.luanChuyenKhoService.getApprovals(this.currentPage, this.pageSize);

      forkJoin({
        locations: this.luanChuyenKhoService.getMinimalLocations(),
        requirements: requirements$,
      }).subscribe({
        next: ({ locations, requirements }) => {
          this.buildLocationMap(locations);
          const { data, meta } = requirements;
          this.dataList = (data || []).map((item) => this.mapRequirementToItem(item));
          this.currentPage = meta.page;
          this.pageSize = meta.size;
          this.totalItems = meta.total_items;
          this.totalPages = meta.total_pages;
        },
        error: (err) => {
          console.error('[LuanChuyenKhoList] Lỗi lấy danh sách đơn:', err);
          this.dataList = [];
          this.totalItems = 0;
          this.totalPages = 0;
        }
      });
    }

    onAddNew(): void {
        this.router.navigate(['../add-new'], { relativeTo: this.route });
    }

    onViewDetail(item: ChuyenKhoItem): void {
        const target = this.isCreateMode ? '../detail' : '../scan-approve';
        this.router.navigate([target, item.id], { relativeTo: this.route });
    }

    clearColumnFilters(): void {
        Object.keys(this.columnFilters).forEach((key) => {
            (this.columnFilters as Record<string, string>)[key] = '';
        });
        this.currentPage = 1;
    }

    onFilterChange(): void {
        this.currentPage = 1;
    }

    onPageSizeChange(): void {
        this.currentPage = 1;
        this.loadRequirements();
    }

    goToPage(page: number): void {
        if (page < 1 || page > this.totalPages || page === this.currentPage) return;
        this.currentPage = page;
        this.loadRequirements();
    }

    private matchesColumnFilters(item: ChuyenKhoItem): boolean {
        const f = this.columnFilters;
        if (!this.matchText(item.maYeuCau, f.maYeuCau)) return false;
        if (!this.matchText(item.tuKho, f.tuKho)) return false;
        if (!this.matchText(item.denKho, f.denKho)) return false;
        if (!this.matchText(item.nguoiTao, f.nguoiTao)) return false;
        if (!this.matchText(item.ngayTao, f.ngayTao)) return false;
        if (!this.matchText(item.ghiChu, f.ghiChu)) return false;
        if (!this.matchText(item.tongSoLuong, f.tongSoLuong)) return false;
        if (!this.matchText(item.soPallet, f.soPallet)) return false;
        if (!this.matchText(item.soThung, f.soThung)) return false;
        if (!this.matchText(item.trangThai, f.trangThai)) return false;
        return true;
    }

    private matchText(value: unknown, query: string): boolean {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return String(value ?? '').toLowerCase().includes(q);
    }
}