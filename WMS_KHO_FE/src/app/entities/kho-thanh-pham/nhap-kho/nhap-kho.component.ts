import { ChangeDetectorRef, Component } from '@angular/core';
import { KhoThanhPhamModule } from '../kho-thanh-pham.module';
import { Router } from '@angular/router';
import { NhapKhoService } from './service/nhap-kho.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BarcodeFormat } from '@zxing/library';
import { CameraDevice, Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
export interface NhapKhoItem {
  id: number;
  po_number: string | null;
  client_id: string;
  inventory_name: string;
  number_of_pallet: number;
  number_of_box: number;
  box_scan_progress?: number;
  quantity: number;
  wo_code: string;
  lot_number: string;
  import_date: string;
  status: boolean;
  note: string;
  approved_by: string | null;
  is_check_all: boolean;
  updated_by: string;
  updated_date: string;

  scannedCount: number; // số đã scan
  totalCount: number;
}

@Component({
  selector: 'app-nhap-kho-component',
  standalone: false,
  templateUrl: './nhap-kho.component.html',
  styleUrl: './nhap-kho.component.scss',
})
export class NhapKhoComponent {
  showMobileFilters: boolean = false;
  displayedColumns: string[] = [
    // 'id',
    'stt',
    'inventory_name',
    // 'order_id',
    'client_id',
    'wo_code',
    // 'po_number',
    'lot_number',
    'branch',
    'number_of_pallet',
    'number_of_box',
    'production_team',
    // 'production_decision_number',
    'item_no_sku',
    // 'approved_by',
    'note',
    'updated_by',
    'updated_date',
    'status',
    'progress',
    'actions',
  ];


  filterValues = {
    inventory_name: '',
    lot_number: '',
    wo_code: '',
    client_id: '',
    po_number: '',
    status: '',
    updated_by: '',
  };

  filterColumns: string[] = [
    'inventory_name',
    'lot_number',
    'wo_code',
    'client_id',
    'po_number',
    'status',
  ];

  nhapKhoList: NhapKhoItem[] = [];
  originalList: NhapKhoItem[] = [];
  filteredList: NhapKhoItem[] = [];
  searchTerm: string = '';
  totalItems: number = 0;
  pageSize: number = 10;
  currentPage: number = 1;
  totalPages: number = 1;

  //search
  maTimKiem: string = '';

  //camrera
  isMobile: boolean = false;
  debugLogs: string[] = [];
  isScanning: boolean = false;
  isLoading = false;
  scannerActive: 'pallet' | 'location' | null = null;
  qrScanner?: Html5Qrcode;
  scannerEnabled = false;
  currentDevice: MediaDeviceInfo | undefined = undefined;
  hasPermission = false;
  availableDevices: MediaDeviceInfo[] = [];
  currentStream: MediaStream | null = null;
  formats: BarcodeFormat[] = [
    BarcodeFormat.QR_CODE,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8
  ];
  selectedCameraId: string | null = null;
  availableCameras: CameraDevice[] = [];
  lastScannedCode: string | null = null;

  //input scan
  scanPallet: string = '';
  scanBox: string = '';

  constructor(private router: Router, private nhapKhoService: NhapKhoService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) { }
  ngOnInit(): void {
    this.checkIfMobile();
    this.loadDanhSachNhapKho();
  }
  checkIfMobile(): void {
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth <= 768;
  }
  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('vi-VN');
  }
  loadDanhSachNhapKho(): void {
    this.nhapKhoService.getDanhSachNhapKho().subscribe({
      next: (res) => {
        console.log('API response:', res);

        // Sắp xếp theo id giảm dần
        const sorted = [...res].sort((a, b) => b.id - a.id);

        // Map sang NhapKhoItem
        const mapped: NhapKhoItem[] = sorted.map((r: any) => ({
          ...r,
          scannedCount: r.box_scan_progress ?? 0,
          totalCount: r.number_of_box ?? 0,
        }));

        // Gán vào cả 2 mảng
        this.originalList = mapped;
        this.filteredList = [...mapped]; // Copy để giữ nguyên originalList

        // Tính toán pagination
        this.totalItems = this.filteredList.length;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        this.currentPage = 1;

        // Slice để hiển thị trang đầu tiên
        this.slicePage();
      },
      error: (err) => {
        console.error('Lỗi khi lấy danh sách nhập kho:', err);
      },
    });
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Chờ nhập': 'status-warn-label',
      'Đã nhập': 'status-active-label',
      'Đã nhập lẻ': 'status-partial-label'  // Thêm class mới
    };
    return statusMap[status] || 'status-warn-label';
  }

  computeProgressPercent(item: NhapKhoItem): number {
    const total = Number(item.number_of_box ?? 0);
    const scanned = Number(item.box_scan_progress ?? 0);
    if (!total || total <= 0) return 0;
    const pct = Math.round((scanned / total) * 100);
    return Math.min(100, Math.max(0, pct));
  }

  //naviagte
  onApprove(nhapkho: NhapKhoItem): void {
    this.router.navigate(
      ['/kho-thanh-pham/nhap-kho-sx/phe-duyet', nhapkho.id]
      // {
      //   queryParams: {
      //     maSanPham: nhapkho.maSanPham,
      //     status: nhapkho.status,
      //   },
      // }
    );
  }

  // Navigate đến trang chi tiết
  onViewDetail(nhapkho: NhapKhoItem): void {
    this.router.navigate(
      ['/kho-thanh-pham/nhap-kho-sx/detail', nhapkho.id]
      // {
      //   queryParams: {
      //     maSanPham: nhapkho.maSanPham,
      //     status: nhapkho.status,
      //   },
      // }
    );
  }

  // Navigate đến trang scan
  onScan(nhapkho: NhapKhoItem): void {
    this.router.navigate(
      ['/kho-thanh-pham/nhap-kho-sx/phe-duyet', nhapkho.id, 'scan'],
    );
  }


  onSearch(): void {
    console.log('Searching for:', this.searchTerm);
  }

  onRefresh(): void {
    this.loadDanhSachNhapKho();
    this.cdr.detectChanges();
  }

  onAddNew(): void {
    console.log('Add new location');
  }

  onDelete(location: Location): void {
    console.log('Delete location:', location);
  }
  slicePage(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.nhapKhoList = this.filteredList.slice(start, end);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.slicePage();
  }


  onPageSizeChange(): void {
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.slicePage();
  }
  private isApproved(value: any): boolean {
    return (
      value === true ||
      value === 'true' ||
      value === 1 ||
      value === '1' ||
      value === 'approved'
    );
  }

  onApplySearch(): void {
    const q = (this.maTimKiem || '').trim();
    if (!q) {
      this.snackBar.open('Vui lòng nhập mã pallet hoặc mã thùng để tìm.', 'Đóng', { duration: 3000 });
      return;
    }

    this.nhapKhoService.searchImportRequirements(q).subscribe({
      next: (items) => {
        if (!items || items.length === 0) {
          this.snackBar.open('Mã này chưa được tạo đơn nhập kho.', 'Đóng', { duration: 4000 });
          this.resetSearchInput();  // Reset sau khi search
          return;
        }

        if (items.length === 1) {
          const item = items[0];
          const statusCandidates = item.status ?? item.is_approved ?? item.approved ?? item.scan_status ?? item.is_active;

          if (this.isApproved(statusCandidates)) {
            this.snackBar.open('Đã duyệt. Chuyển tới đơn...', 'Đóng', { duration: 1200 });
            this.resetSearchInput();  // Reset
            this.router.navigate(['kho-thanh-pham/nhap-kho-sx/phe-duyet', item.id]);
          } else {
            this.snackBar.open('Đơn tìm thấy nhưng chưa được duyệt.', 'Đóng', { duration: 4000 });
            this.resetSearchInput();  // Reset
            this.router.navigate(['kho-thanh-pham/nhap-kho-sx/phe-duyet', item.id]);
          }
          return;
        }

        const approvedItem = items.find((it: any) => {
          const s = it.status ?? it.is_approved ?? it.approved ?? it.scan_status ?? it.is_active;
          return this.isApproved(s);
        });

        if (approvedItem) {
          this.snackBar.open('Tìm thấy nhiều đơn. Chuyển tới đơn đã duyệt...', 'Đóng', { duration: 1200 });
          this.resetSearchInput();  // Reset
          this.router.navigate(['kho-thanh-pham/nhap-kho-sx/phe-duyet', approvedItem.id]);
        } else {
          this.snackBar.open('Tìm thấy nhiều đơn nhưng không có đơn nào đã duyệt.', 'Đóng', { duration: 4000 });
          this.resetSearchInput();  // Reset
        }
      },
      error: (err) => {
        console.error('Lỗi khi tìm nhanh:', err); // Nếu backend trả 400 hoặc 404, coi như "không tìm thấy" 
        if (err?.status === 400 || err?.status === 404) {
          this.snackBar.open('Mã này chưa được tạo đơn nhập kho.', 'Đóng',
            { duration: 4000 });
          this.resetSearchInput();
          return;
        } // Nếu là lỗi xác thực/permission 
        if (err?.status === 401 || err?.status === 403) {
          this.snackBar.open('Bạn chưa đăng nhập hoặc không có quyền truy cập.', 'Đóng',
            { duration: 4000 });
          this.resetSearchInput();
          return;
        } // Mặc định: lỗi server 
        const serverMsg = err?.error?.detail || err?.error?.message;
        const userMsg = serverMsg ? `Lỗi server: ${serverMsg}` : 'Lỗi khi tìm. Vui lòng thử lại sau.';
        this.snackBar.open(userMsg, 'Đóng', { duration: 4000 });
        this.resetSearchInput();
      }
    });
  }
  async openCameraScanner(field: 'pallet' | 'location') {
    this.scannerActive = field;
    this.isScanning = true;
    this.logDebug("=== Open Scanner ===");

    try {
      if (this.qrScanner) {
        try {
          await this.qrScanner.stop();
          await this.qrScanner.clear();
          this.logDebug("Old scanner stopped");
        } catch (e) {
          this.logDebug("Stop old scanner failed: " + e);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      this.qrScanner = new Html5Qrcode("qr-reader");
      this.logDebug("Scanner created");

      const cameras = await Html5Qrcode.getCameras();
      this.logDebug(`Found ${cameras.length} cameras`);
      this.logDebug(JSON.stringify(cameras.map(c => ({ id: c.id, label: c.label }))));

      if (!cameras || cameras.length === 0) {
        this.snackBar.open("Không tìm thấy camera", "Đóng", { duration: 3000 });
        this.stopScanning();
        return;
      }

      // Lưu danh sách camera (CameraDevice[])
      this.availableCameras = cameras;

      const backCameras = cameras.filter(c =>
        (c.label || "").toLowerCase().includes("back") ||
        (c.label || "").toLowerCase().includes("environment") ||
        (c.label || "").toLowerCase().includes("rear")
      );

      // Sử dụng camera đã chọn hoặc back camera mặc định
      let targetCam: CameraDevice;
      if (this.selectedCameraId) {
        targetCam = cameras.find(c => c.id === this.selectedCameraId) ||
          (backCameras.length > 0 ? backCameras[backCameras.length - 1] : cameras[0]);
      } else {
        targetCam = backCameras.length > 0 ? backCameras[backCameras.length - 1] : cameras[0];
      }

      // Lưu camera hiện tại
      this.selectedCameraId = targetCam.id;

      this.logDebug("Selected camera: " + targetCam.label);

      await this.startScanner(targetCam.id);

    } catch (e: any) {
      this.logDebug("=== ERROR ===");
      this.logDebug("Error name: " + (e?.name || "unknown"));
      this.logDebug("Error message: " + (e?.message || "unknown"));
      this.logDebug("Error toString: " + e?.toString());

      let errorMsg = "Không thể mở camera!";

      if (e?.name === "NotAllowedError" || e?.name === "PermissionDeniedError") {
        errorMsg = "Bạn đã từ chối quyền camera. Vui lòng cấp quyền trong Cài đặt.";
      } else if (e?.name === "NotFoundError" || e?.name === "DevicesNotFoundError") {
        errorMsg = "Không tìm thấy camera trên thiết bị!";
      } else if (e?.name === "NotReadableError" || e?.name === "TrackStartError") {
        errorMsg = "Camera đang được sử dụng. Vui lòng đóng ứng dụng Camera/Zalo/Banking và thử lại.";
      } else if (e?.name === "OverconstrainedError") {
        errorMsg = "Camera không hỗ trợ cấu hình này!";
      } else if (e?.message) {
        errorMsg = "Lỗi: " + e.message;
      }

      this.snackBar.open(errorMsg, "Đóng", { duration: 5000 });
      this.stopScanning();
    }
  }
  async startScanner(cameraId: string) {
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    };

    await this.qrScanner!.start(
      cameraId,
      config,
      (decodedText) => {
        this.logDebug("Scanned: " + decodedText);
        this.handleHtml5Scan(decodedText);
      },
      (errorMessage) => {
        if (errorMessage && !errorMessage.includes("NotFoundException")) {
          this.logDebug("Scan error: " + errorMessage);
        }
      }
    );

    this.logDebug("Camera started successfully!");
  }
  async switchCamera() {
    if (!this.qrScanner || this.availableCameras.length <= 1) {
      this.snackBar.open("Không có camera khác để chuyển!", "", { duration: 2000 });
      return;
    }

    try {
      this.logDebug("=== Switching Camera ===");

      // Tìm index camera hiện tại
      const currentIndex = this.availableCameras.findIndex(c => c.id === this.selectedCameraId);

      // Chuyển sang camera tiếp theo (vòng tròn)
      const nextIndex = (currentIndex + 1) % this.availableCameras.length;
      const nextCamera = this.availableCameras[nextIndex];

      this.logDebug(`Switching from ${this.availableCameras[currentIndex]?.label} to ${nextCamera.label}`);

      // Stop camera hiện tại
      await this.qrScanner.stop();
      this.logDebug("Current camera stopped");

      // Cập nhật camera đã chọn
      this.selectedCameraId = nextCamera.id;

      // Delay nhỏ để đảm bảo cleanup
      await new Promise(resolve => setTimeout(resolve, 200));

      // Start camera mới
      await this.startScanner(nextCamera.id);

      this.snackBar.open(`Đã chuyển sang ${nextCamera.label}`, "", { duration: 2000 });
      this.logDebug("Camera switched successfully");

    } catch (e: any) {
      this.logDebug("Switch camera error: " + e?.message);
      this.snackBar.open("Lỗi khi chuyển camera!", "Đóng", { duration: 3000 });

      // Nếu lỗi, thử mở lại camera cũ
      try {
        await this.startScanner(this.selectedCameraId!);
      } catch {
        this.stopScanning();
      }
    }
  }
  playAudio(file: string): void {
    const audio = new Audio(file);
    audio.play();
  }
  handleHtml5Scan(code: string) {
    code = code.trim();

    // Chống scan trùng
    if (code === this.lastScannedCode) return;
    this.lastScannedCode = code;

    this.logDebug("Processing: " + code);

    // Phân loại mã và gán vào maTimKiem thay vì scanPallet/scanBox
    if (code.startsWith("P")) {
      this.maTimKiem = code;  // Gán vào maTimKiem
      this.playAudio('assets/audio/successed-295058.mp3');
      this.snackBar.open("✓ Đã quét pallet!", "", { duration: 1000 });

      // Đóng camera và tìm kiếm luôn
      this.stopScanning();
      setTimeout(() => this.onApplySearch(), 50);

    } else if (code.startsWith("B")) {
      this.maTimKiem = code;  // Gán vào maTimKiem
      this.playAudio('assets/audio/successed-295058.mp3');
      this.snackBar.open("✓ Đã quét thùng!", "", { duration: 1000 });

      // Đóng camera và tìm kiếm luôn
      this.stopScanning();
      setTimeout(() => this.onApplySearch(), 50);

    } else {
      // Mã không hợp lệ
      this.playAudio('assets/audio/beep_warning.mp3');
      this.snackBar.open("Mã không hợp lệ!", "", { duration: 2000 });
    }
  }
  resetSearchInput(): void {
    this.maTimKiem = '';
    this.scanPallet = '';
    this.scanBox = '';
  }
  async stopScanning() {
    this.logDebug("=== Stopping Scanner ===");

    this.isScanning = false;
    this.scannerActive = null;
    this.lastScannedCode = null;

    if (this.qrScanner) {
      try {
        const state = await this.qrScanner.getState();
        this.logDebug("Scanner state: " + state);

        if (state === Html5QrcodeScannerState.SCANNING) {
          await this.qrScanner.stop();
          this.logDebug("Scanner stopped");
        }

        await this.qrScanner.clear();
        this.logDebug("Scanner cleared");
      } catch (err: any) {
        this.logDebug("Stop error: " + (err?.message || err));
      } finally {
        this.qrScanner = undefined;
      }
    }
  }
  logDebug(msg: any) {
    const text = typeof msg === 'string' ? msg : JSON.stringify(msg);
    const timestamp = new Date().toLocaleTimeString();
    this.debugLogs.unshift(`[${timestamp}] ${text}`);
    console.log(`[${timestamp}] ${text}`);

    // Giới hạn log
    if (this.debugLogs.length > 50) {
      this.debugLogs = this.debugLogs.slice(0, 50);
    }
  }
  getDisplayStatus(item: NhapKhoItem): string {
    const total = Number(item.number_of_box ?? 0);
    const scanned = Number(item.box_scan_progress ?? 0);

    // Nếu chưa scan gì
    if (scanned === 0) {
      return 'Chờ nhập';
    }

    // Nếu đã scan hết
    if (scanned >= total && total > 0) {
      return 'Đã nhập';
    }

    // Nếu đã scan 1 phần (1/3, 2/3, ...)
    if (scanned > 0 && scanned < total) {
      return 'Đã nhập lẻ';
    }

    // Fallback
    return 'Chờ nhập';
  }
  applyFilter(): void {
    const filtered = this.originalList.filter((item) => {
      // Tính trạng thái động
      const displayStatus = this.getDisplayStatus(item);

      const matchInventoryName = !this.filterValues.inventory_name ||
        item.inventory_name?.toLowerCase().includes(this.filterValues.inventory_name.toLowerCase());

      const matchLotNumber = !this.filterValues.lot_number ||
        item.lot_number?.toLowerCase().includes(this.filterValues.lot_number.toLowerCase());

      const matchWoCode = !this.filterValues.wo_code ||
        item.wo_code?.toLowerCase().includes(this.filterValues.wo_code.toLowerCase());

      const matchPoNumber = !this.filterValues.po_number ||
        item.po_number?.toLowerCase().includes(this.filterValues.po_number.toLowerCase());

      const matchClientId = !this.filterValues.client_id ||
        item.client_id?.toLowerCase().includes(this.filterValues.client_id.toLowerCase());

      const updatedBy = !this.filterValues.updated_by ||
        item.updated_by?.toLowerCase().includes(this.filterValues.updated_by.toLowerCase());

      // Sử dụng displayStatus thay vì statusText cũ
      const matchStatus = !this.filterValues.status ||
        displayStatus === this.filterValues.status;

      return matchInventoryName && matchLotNumber && matchWoCode &&
        matchPoNumber && matchClientId && matchStatus && updatedBy;
    });

    this.filteredList = filtered;
    this.totalItems = this.filteredList.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.currentPage = 1;
    this.slicePage();
  }



  toggleMobileFilters(): void {
    this.showMobileFilters = !this.showMobileFilters;
  }

  clearFilters(): void {
    // Reset tất cả filter values
    this.filterValues = {
      inventory_name: '',
      lot_number: '',
      wo_code: '',
      client_id: '',
      po_number: '',
      status: '',
      updated_by: '',
    };
    this.searchTerm = '';

    // Reset filteredList về originalList
    this.filteredList = [...this.originalList];

    // Cập nhật pagination
    this.totalItems = this.filteredList.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.currentPage = 1;

    // Slice để hiển thị
    this.slicePage();
  }

  // getStatusClass(status: string): string {
  //   const statusMap: { [key: string]: string } = {
  //     'Chờ nhập': 'cho-nhap',
  //     'Đã nhập': 'da-nhap',
  //     'Đang xử lý': 'dang-xu-ly'
  //   };
  //   return statusMap[status] || '';
  // }
}
