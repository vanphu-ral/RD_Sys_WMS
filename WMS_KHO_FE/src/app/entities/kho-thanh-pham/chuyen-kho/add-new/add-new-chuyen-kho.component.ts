import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ChuyenKhoService } from '../service/chuyen-kho.service.component';
import { ConfirmDialogComponent } from '../dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
export interface MainInfo {
  maPO: string;
  maChungTu: string;
  soPhieu: string;
  ngayNhap: string;
  ghiChu: string;
  tenKhachHang: string;
  maKhachHang: string;
  donViLinh: string;
  lyDoNhapXuat: string;
  soPallet: number;
  soThung: number;
  soLuongSP: number;
}
export interface DetailItem {
  maHangHoa: string;
  tenHangHoa: string;
  ngayGiaoHang: string;
  maPO: string;
  khoXuatBan: string;
  soLuongSP: number;
  donViTinh: string;
}
@Component({
  selector: 'app-nhap-kho-component',
  standalone: false,
  templateUrl: './add-new-chuyen-kho.component.html',
  styleUrl: './add-new-chuyen-kho.component.scss',
})
export class AddYeuCauChuyenKhoComponent implements OnInit {
  //ma yeu cau
  maYeuCau: string = '';

  nhapKhoId: number | undefined;

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
    'maPO',
    'khoXuatBan',
    'soLuongSP',
    'donViTinh',
  ];
  mainInfo: MainInfo = {
    maPO: '',
    maChungTu: '',
    soPhieu: '',
    ngayNhap: '',
    ghiChu: '',
    tenKhachHang: '',
    maKhachHang: '',
    donViLinh: '',
    lyDoNhapXuat: '',
    soPallet: 0,
    soThung: 0,
    soLuongSP: 0,
  };

  detailList: DetailItem[] = [];

  //phan trang
  pageSizeOptions = [5, 10, 20];
  pageSize = 10;
  currentPage = 1;
  @ViewChild('warehouseInput') warehouseInput!: ElementRef<HTMLInputElement>;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private chuyenKhoService: ChuyenKhoService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.nhapKhoId = +params['id'];
    });

    this.route.queryParams.subscribe((queryParams) => {
      console.log('Mã sản phẩm:', queryParams['maSanPham']);
      console.log('Status:', queryParams['status']);
    });
    this.chuyenKhoService.getWarehouses().subscribe({
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

  //lay du lieu
  onApplyRequest(): void {
    const id = +this.maYeuCau;
    if (!id) return;

    this.chuyenKhoService.getTransferRequestById(id).subscribe({
      next: (res) => {
        const owtr = res.OWTR;
        const wtr1 = res.WTR1 || [];

        // Ánh xạ bảng chính
        this.mainInfo = {
          maPO: owtr.U_InvCode || '', // Mã PO
          maKhachHang: owtr.CardCode || '', // Mã khách hàng
          soPallet: wtr1.length, // Số pallet = số dòng WTR1
          soThung: wtr1.length, // Số thùng = số dòng WTR1 (giả định mỗi dòng là 1 thùng)
          soLuongSP: wtr1.reduce(
            (sum: number, item: any) => sum + (item.Quantity || 0),
            0
          ), // Tổng số lượng SP
          soPhieu: owtr.U_InvCode || '',
          maChungTu: owtr.U_Docnum || '', // Mã chứng từ
          ngayNhap: new Date(owtr.DocDate).toLocaleDateString(), // Ngày nhập
          ghiChu: owtr.Comments || '', // Ghi chú
          tenKhachHang: owtr.CardName || '', // Tên khách hàng
          donViLinh: owtr.U_Pur_NVNhan || '', // Đơn vị lĩnh
          lyDoNhapXuat: owtr.U_Category || '', // Lý do nhập/xuất
        };

        // Ánh xạ bảng chi tiết
        this.detailList = wtr1.map((item: any) => ({
          maHangHoa: item.ItemCode || '',
          tenHangHoa: item.Dscription || '',
          ngayGiaoHang: item.ShipDate
            ? new Date(item.ShipDate).toLocaleDateString()
            : '',
          maPO: item.U_PO || '',
          khoXuatBan: owtr.ToWhsCode || '', // từ OWTR
          soLuongSP: item.Quantity || 0,
          donViTinh: item.UomCode || '',
        }));

        console.log(this.mainInfo);
      },
      error: (err) => {
        console.error('Lỗi khi lấy yêu cầu chuyển kho:', err);
        this.snackBar.open('Không tìm thấy yêu cầu chuyển kho!', 'Đóng', {
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

  //confirm
  onConfirm(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { message: 'Bạn có chắc muốn lưu yêu cầu chuyển kho này?' },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.saveTransferRequest();
      }
    });
  }

  // xac nhan chuyen kho
  saveTransferRequest(): void {
    const tuKhoObj = this.warehouses.find((w) => w.id === this.fromWarehouseId);
    const denKhoObj = this.warehouses.find((w) => w.id === this.toWarehouseId);

    if (!tuKhoObj || !denKhoObj) {
      this.snackBar.open('Vui lòng chọn đầy đủ Từ kho và Đến kho!', 'Đóng', {
        duration: 3000,
        panelClass: ['snackbar-error'],
      });
      return;
    }

    const headerPayload = {
      tu_kho: tuKhoObj.id,
      den_kho: denKhoObj.id,
      don_vi_linh: this.mainInfo.donViLinh,
      don_vi_nhan: this.mainInfo.tenKhachHang,
      ly_do_xuat_nhap: this.mainInfo.lyDoNhapXuat,
      ma_yc_cknb: this.mainInfo.maChungTu,
      so_phieu_xuat: this.mainInfo.maPO, 
      so_chung_tu: this.mainInfo.maChungTu, 
      ngay_chung_tu: this.mainInfo.ngayNhap,
      note: this.mainInfo.ghiChu,
      series_pgh: 's',
      status: false,
      updated_by: 'admin',
    };

    this.chuyenKhoService.saveRequestHeader(headerPayload).subscribe({
      next: (res) => {
        const requestId = res.id;

        const itemsPayload = this.detailList.map((item) => ({
          dvt: item.donViTinh,
          product_code: item.maHangHoa,
          product_name: item.tenHangHoa,
          total_quantity: item.soLuongSP,
          updated_by: 'admin',
        }));

        this.chuyenKhoService
          .saveRequestItems(requestId, itemsPayload)
          .subscribe({
            next: () => {
              this.snackBar.open('Lưu thành công!', 'Đóng', {
                duration: 3000,
                panelClass: ['snackbar-success'],
              });
            },
            error: (err) => {
              console.error('Lỗi khi lưu bảng con:', err);
              this.snackBar.open('Lỗi khi lưu sản phẩm!', 'Đóng', {
                duration: 3000,
                panelClass: ['snackbar-error'],
              });
            },
          });
      },
      error: (err) => {
        console.error('Lỗi khi lưu bảng cha:', err);
        this.snackBar.open('Lỗi khi lưu yêu cầu!', 'Đóng', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
      },
    });
  }

  get pagedDetailList(): DetailItem[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.detailList.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.detailList.length / this.pageSize);
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
    this.router.navigate(['kho-thanh-pham/chuyen-kho-noi-bo']);
  }

  onSelectWarehouse(): void {
    // TODO: Open dialog or navigate to warehouse selection
    console.log('Chọn kho nhập');
  }

  // onConfirm(): void {
  //   //can 1 dialog confirm
  //   this.snackBar.open('Lưu thành công!', 'Đóng', {
  //     duration: 3000,
  //     horizontalPosition: 'right',
  //     verticalPosition: 'bottom',
  //     panelClass: ['snackbar-success', 'snackbar-position'],
  //   });
  // }
  goBack(): void {
    this.router.navigate(['/kho-thanh-pham/nhap-kho-sx']);
  }
}
