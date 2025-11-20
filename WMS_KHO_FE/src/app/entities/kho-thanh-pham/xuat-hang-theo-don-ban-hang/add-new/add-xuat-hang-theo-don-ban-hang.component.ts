import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { XuatHangTheoDonBanService } from '../service/xuat-hang-theo-don-ban.service.component';
import { ConfirmDialogXuatHangComponent } from '../dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../../services/auth.service';
export interface MainInfo {
  donViLinh: string;
  soPhieuGiaoHang: string;
  maKhachHang: string;
  tenKhachHang: string;
  soChungTu: string;
  ghiChu: string;
  lyDoNhapXuat: string;
  ngayGiaoHang: string;
  soPallet: number;
  soBox: number;
  tongSoLuong: number;
}

export interface DetailItem {
  maHangHoa: string;
  tenHangHoa: string;
  ngayGiaoHang: string;
  soLuong: number;
  maPO: string;
  donViTinh: string;
}

@Component({
  selector: 'app-nhap-kho-component',
  standalone: false,
  templateUrl: './add-xuat-hang-theo-don-ban-hang.component.html',
  styleUrl: './add-xuat-hang-theo-don-ban-hang.component.scss',
})
export class AddXuatHangTheoDonBanHangComponent implements OnInit {
  nhapKhoId: number | undefined;
  totalPages = 9;

  maYeuCau: string = '';

  //chon kho nhap
  warehouses: { id: number; name: string }[] = [];
  filteredFromWarehouses: { id: number; name: string }[] = [];
  filteredToWarehouses: { id: number; name: string }[] = [];
  fromWarehouseInputText: string = '';
  toWarehouseInputText: string = '';
  fromWarehouseId: number | null = null;
  toWarehouseId: number | null = null;

  displayedColumns: string[] = [
    'stt',
    'maHangHoa',
    'tenHangHoa',
    'ngayGiaoHang',
    'soLuong',
    'maPO',
    'donViTinh',
  ];
  mainInfo: MainInfo = {
    donViLinh:'',
    soPhieuGiaoHang: '',
    maKhachHang: '',
    tenKhachHang: '',
    soChungTu: '',
    ghiChu: '',
    lyDoNhapXuat: '',
    ngayGiaoHang: '',
    soPallet: 0,
    soBox: 0,
    tongSoLuong: 0,
  };
  pageSizeOptions = [5, 10, 20];
  pageSize = 10;
  currentPage = 1;
  detailList: DetailItem[] = [];
  @ViewChild('warehouseInput') warehouseInput!: ElementRef<HTMLInputElement>;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private xuatHangServie: XuatHangTheoDonBanService,
    private dialog: MatDialog,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.nhapKhoId = +params['id'];
    });

    this.route.queryParams.subscribe((queryParams) => {
      console.log('Mã sản phẩm:', queryParams['maSanPham']);
      console.log('Status:', queryParams['status']);
    });

    this.xuatHangServie.getWarehouses().subscribe({
      next: (data: { id: number; name: string }[]) => {
        this.warehouses = data;
        this.filteredFromWarehouses = [...data];
        this.filteredToWarehouses = [...data];
      },
      error: (err) => {
        console.error('Lỗi khi lấy danh sách kho:', err);
      },
    });
  }

  loadData(): void {
    // TODO: Load data from service using nhapKhoId
    // this.nhapKhoService.getById(this.nhapKhoId).subscribe(data => {
    //   this.mainInfo = data.mainInfo;
    //   this.detailList = data.detailList;
    // });
  }

  onApplyRequest(): void {
    const id = +this.maYeuCau;
    if (!id) return;

    this.xuatHangServie.getOutOfStockRequestById(id).subscribe({
      next: (res) => {
        if (!res.ORDR) {
          console.error('ORDR không tồn tại trong response:', res);
          this.snackBar.open('Không tìm thấy dữ liệu đơn hàng!', 'Đóng', {
            duration: 3000,
            panelClass: ['snackbar-error'],
          });
          return;
        }
        const ordr = res.ORDR;
        const rdr1 = res.RDR1 || [];

        // Bảng chính
        this.mainInfo = {
          soPhieuGiaoHang: ordr.U_InvCode || '',
          maKhachHang: ordr.CardCode || '',
          tenKhachHang: ordr.CardName || '',
          soChungTu: ordr.U_Docnum || '',
          ghiChu: ordr.Comments || '',
          lyDoNhapXuat: ordr.U_Category || '',
          donViLinh: ordr.U_Pur_NvNhan || '',
          ngayGiaoHang: ordr.DocDueDate
            ? new Date(ordr.DocDueDate).toLocaleDateString()
            : '',
          soPallet: rdr1.length,
          soBox: rdr1.length,
          tongSoLuong: rdr1.reduce(
            (sum: number, item: any) => sum + (item.Quantity || 0),
            0
          ),
        };

        // Bảng phụ
        this.detailList = rdr1.map((item: any) => ({
          maHangHoa: item.ItemCode || '',
          tenHangHoa: item.Dscription || '',
          ngayGiaoHang: item.ShipDate
            ? new Date(item.ShipDate).toLocaleDateString()
            : '',
          soLuong: item.Quantity || 0,
          maPO: item.U_PO || '',
          donViTinh: item.UomCode || '',
        }));
      },
      error: (err) => {
        console.error('Lỗi khi lấy dữ liệu:', err);
        this.snackBar.open('Không tìm thấy dữ liệu!', 'Đóng', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
      },
    });
  }

  //chon kho nhap process
  onWarehouseInput(event: Event, type: 'from' | 'to'): void {
    const input = (event.target as HTMLInputElement).value.toLowerCase();
    const filtered = this.warehouses.filter((w) =>
      w.name.toLowerCase().includes(input)
    );

    if (type === 'from') {
      this.filteredFromWarehouses = filtered;
    } else {
      this.filteredToWarehouses = filtered;
    }
  }

  onFromWarehouseSelected(id: number): void {
    this.fromWarehouseId = id;
    const warehouse = this.warehouses.find((w) => w.id === id);
    this.fromWarehouseInputText = warehouse?.name || '';
  }

  onToWarehouseSelected(id: number): void {
    this.toWarehouseId = id;
    const warehouse = this.warehouses.find((w) => w.id === id);
    this.toWarehouseInputText = warehouse?.name || '';
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  previousPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
  }
  onCancel(): void {
    this.router.navigate(['kho-thanh-pham/xuat-don-ban-hang']);
  }

  onSelectWarehouse(): void {
    // TODO: Open dialog or navigate to warehouse selection
    console.log('Chọn kho nhập');
  }

  onConfirm(): void {
    //can 1 dialog confirm
    const dialogRef = this.dialog.open(ConfirmDialogXuatHangComponent, {
      width: '400px',
      data: { message: 'Bạn có chắc muốn lưu yêu cầu chuyển kho này?' },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.saveOutOfStockRequest();
      }
    });
  }

  //xác nhận xuất kho
  saveOutOfStockRequest(): void {
    const fromWarehouse = this.fromWarehouseId;
    const toWarehouse = this.toWarehouseId;
    const username = this.authService.getUsername();

    if (!fromWarehouse || !toWarehouse) {
      this.snackBar.open('Vui lòng chọn đầy đủ Từ kho và Đến kho!', 'Đóng', {
        duration: 3000,
        panelClass: ['snackbar-error'],
      });
      return;
    }

    const headerPayload = {
      don_vi_linh: this.mainInfo.donViLinh,
      don_vi_nhan: this.mainInfo.tenKhachHang,
      kho_xuat: fromWarehouse,
      xuat_toi: toWarehouse,
      ly_do_xuat_nhap: this.mainInfo.lyDoNhapXuat ,
      ma_yc_xk: this.mainInfo.soChungTu,
      ngay_chung_tu:
        this.mainInfo.ngayGiaoHang || new Date().toISOString().slice(0, 10),
      note: this.mainInfo.ghiChu || '',
      series_pgh: '',
      status: "false",
      updated_by: username,
    };

    this.xuatHangServie.saveSalesExportRequest(headerPayload).subscribe({
      next: (res) => {
        if (res.success && res.osr_id) {
          const itemsPayload = this.detailList.map((item) => ({
            dvt: item.donViTinh,
            product_code: item.maHangHoa,
            product_name: item.tenHangHoa,
            total_quantity: item.soLuong,
            updated_by: username,
          }));

          this.xuatHangServie
            .saveSalesExportItems(res.osr_id, itemsPayload)
            .subscribe({
              next: () => {
                this.snackBar.open('Lưu xuất kho thành công!', 'Đóng', {
                  duration: 3000,
                  panelClass: ['snackbar-success'],
                });
              },
              error: (err) => {
                console.error('Lỗi khi lưu bảng phụ:', err);
                this.snackBar.open('Lỗi khi lưu chi tiết sản phẩm!', 'Đóng', {
                  duration: 3000,
                  panelClass: ['snackbar-error'],
                });
              },
            });
        } else {
          this.snackBar.open('Lưu bảng chính thất bại!', 'Đóng', {
            duration: 3000,
            panelClass: ['snackbar-error'],
          });
        }
      },
      error: (err) => {
        console.error('Lỗi khi lưu bảng chính:', err);
        this.snackBar.open('Lỗi khi gửi yêu cầu xuất kho!', 'Đóng', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/kho-thanh-pham/xuat-don-ban-hang']);
  }
}
