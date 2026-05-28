import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  LuanChuyenKhoService,
  MinimalLocation,
  WarehouseTransferRequirement,
} from '../service/luan-chuyen-kho.service';
import { forkJoin } from 'rxjs';

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
    imports: [CommonModule],
    templateUrl: './luan-chuyen-kho-list.component.html',
    styleUrls: ['./luan-chuyen-kho-list.component.scss'],
})
export class LuanChuyenKhoListComponent implements OnInit {
    /** true  = vào từ "Tạo đơn chuyển kho"
     *  false = vào từ "Phê duyệt đơn chuyển" */
    isCreateMode = true;

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
    private locationMap = new Map<string, string>();

    constructor(
      private route: ActivatedRoute,
      private router: Router,
      private luanChuyenKhoService: LuanChuyenKhoService
    ) { }

    ngOnInit(): void {
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

    private getLocationCode(rawWarehouse: string): string {
      return this.locationMap.get(String(rawWarehouse)) || rawWarehouse;
    }

    private buildLocationMap(locations: MinimalLocation[]): void {
      this.locationMap.clear();
      (locations || []).forEach((loc) => {
        this.locationMap.set(String(loc.id), loc.code);
      });
    }

    private loadRequirements(): void {
      forkJoin({
        locations: this.luanChuyenKhoService.getMinimalLocations(),
        requirements: this.luanChuyenKhoService.getRequirements(1, 100),
      }).subscribe({
        next: ({ locations, requirements }) => {
          this.buildLocationMap(locations);
          this.dataList = (requirements || []).map((item) => this.mapRequirementToItem(item));
        },
        error: (err) => {
          console.error('[LuanChuyenKhoList] Lỗi lấy danh sách đơn:', err);
          this.dataList = [];
        }
      });
    }

    onAddNew(): void {
        this.router.navigate(['../add-new'], { relativeTo: this.route });
    }

    onViewDetail(item: ChuyenKhoItem): void {
        this.router.navigate(['../scan-approve', item.id], { relativeTo: this.route });
    }
}