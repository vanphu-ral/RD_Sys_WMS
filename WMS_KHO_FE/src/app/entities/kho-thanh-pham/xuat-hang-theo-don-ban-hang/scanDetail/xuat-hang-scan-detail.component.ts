import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { XuatHangTheoDonBanService } from '../service/xuat-hang-theo-don-ban.service.component';
import { BarcodeFormat } from '@zxing/library';
import { CameraDevice, Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';

export interface ScannedItem {
  productId: number;
  inventoryCode: string;
  serialPallet: string;
  quantity: number;
  originalQuantity: number;
  productName?: string;
  scanTime?: string;
  warehouse: string;
}

@Component({
  selector: 'app-nhap-kho-component',
  standalone: false,
  templateUrl: './xuat-hang-scan-detail.component.html',
  styleUrl: './xuat-hang-scan-detail.component.scss',
})
export class ScanDetailXuatHangComponent implements OnInit {
  id: number | undefined;
  // Biến scan
  scanPallet: string = '';
  scanLocation: string = '';

  displayedColumns: string[] = [
    'stt',
    'productId',
    'productName',
    'serialPallet',
    'quantity',
    'scanTime',
    'warehouse',
  ];

  scannedList: ScannedItem[] = [];
  selectedMode: 'pallet' | 'thung' | null = null;
  chuyenKhoId: number | undefined;
  requestId: any;
  detailList: any;

  //mobile scan
  isLoading = false;
  isMobile: boolean = false;
  isScanning = false;
  scannerActive: 'pallet' | 'location' | null = null;
  lastScannedCode: string | null = null;
  currentDevice: MediaDeviceInfo | undefined = undefined;
  formats = [BarcodeFormat.QR_CODE, BarcodeFormat.CODE_128];

  pageSize: number = 10;
  pageSizeOptions: number[] = [5, 10, 15, 20];
  currentPage: number = 1;
  totalItems: number = 0;
  totalPages: number = 0;
  pagedList: any[] = [];


  //switch camera
  selectedCameraId: string | null = null;
  qrScanner?: Html5Qrcode;
  availableCameras: CameraDevice[] = [];
  debugLogs: string[] = [];
  @ViewChild('palletInput') palletInput!: ElementRef;
  @ViewChild('locationInput') locationInput!: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private xuatKhoService: XuatHangTheoDonBanService
  ) { }

  ngOnInit(): void {
    this.checkIfMobile();
    const state = history.state;
    this.requestId = state.requestId;
    this.detailList = state.detailList || [];

    // Load danh sách đã scan trước đó (nếu có)
    this.loadExistingScans();
  }
  checkIfMobile(): void {
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth <= 768;
  }
  /**
   * Load danh sách scan đã lưu trước đó
   */
  loadExistingScans(): void {
    if (!this.requestId) return;

    this.xuatKhoService.getScanList(this.requestId).subscribe({
      next: (response) => {
        if (response && Array.isArray(response)) {
          this.scannedList = response.map((item: any) => ({
            productId: item.products_in_osr_id,
            inventoryCode: item.inventory_identifier,
            serialPallet: item.serial_pallet,
            quantity: item.quantity_dispatched,
            originalQuantity: item.quantity_dispatched,
            productName: item.product_name || 'N/A',
            scanTime: this.formatScanTime(item.scan_time),
            warehouse: item.inventory_identifier,
          }));
          this.totalItems = this.scannedList.length;
          this.totalPages = Math.ceil(this.totalItems / this.pageSize);

          this.setPagedData();
        }
      },
      error: (err) => {
        console.error('Lỗi khi load danh sách scan:', err);
      }
    });
  }

  /**
   * Chọn mode scan (Pallet hoặc Thùng)
   */
  onSelectMode(mode: 'pallet' | 'thung'): void {
    this.selectedMode = mode;
    setTimeout(() => this.palletInput?.nativeElement?.focus(), 100);
  }

  /**
   * Xử lý khi nhấn Enter ở input Pallet
   */
  onPalletScanEnter(): void {
    if (!this.scanPallet || !this.scanPallet.trim()) {
      this.snackBar.open('Vui lòng nhập mã pallet/thùng!', 'Đóng', {
        duration: 2000,
        panelClass: ['snackbar-warning'],
      });
      return;
    }

    if (!this.selectedMode) {
      this.snackBar.open('Vui lòng chọn mode scan!', 'Đóng', {
        duration: 3000,
        panelClass: ['snackbar-warning'],
      });
      return;
    }

    this.performScan();
  }
  performScan(): void {
    const palletCode = this.scanPallet.trim().toUpperCase();

    // Kiểm tra trùng
    const alreadyScanned = this.scannedList.some(
      (item) => item.serialPallet === palletCode
    );

    if (alreadyScanned) {
      this.snackBar.open('Mã pallet/thùng này đã được scan!', 'Đóng', {
        duration: 3000,
        panelClass: ['snackbar-warning'],
      });
      this.resetInputs();
      return;
    }

    this.isLoading = true;

    // Gọi API lấy thông tin pallet
    this.xuatKhoService.getPalletInfo(palletCode).subscribe({
      next: (palletInfo) => {
        if (!palletInfo || !palletInfo.data) {
          this.snackBar.open('Không tìm thấy thông tin pallet/thùng!', 'Đóng', {
            duration: 3000,
            panelClass: ['snackbar-error'],
          });
          this.resetInputs();
          this.isLoading = false;
          return;
        }

        const data = palletInfo.data;

        // Kiểm tra có trong detail list không
        const matched = this.detailList.find(
          (item: any) => item.productCode === data.product_code
        );

        if (!matched) {
          this.snackBar.open('Sản phẩm không có trong đơn xuất kho!', 'Đóng', {
            duration: 3000,
            panelClass: ['snackbar-error'],
          });
          this.resetInputs();
          this.isLoading = false;
          return;
        }

        // Tạo item mới
        const now = new Date();
        const newItem: ScannedItem = {
          productId: matched.id || 0,
          inventoryCode: palletCode, // ✅ Dùng palletCode làm inventoryCode
          serialPallet: palletCode,
          quantity: data.quantity || matched.quantity || 0,
          originalQuantity: matched.quantity || 0,
          productName: data.product_name || matched.productName || 'N/A',
          scanTime: this.formatScanTime(now.toISOString()),
          warehouse: data.location_code || 'N/A', // ✅ Lấy từ API
        };

        // Thêm vào danh sách
        this.scannedList = [...this.scannedList, newItem];
        this.totalItems = this.scannedList.length;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        this.setPagedData();

        this.snackBar.open('✓ Scan thành công!', '', {
          duration: 1500,
          panelClass: ['snackbar-success'],
        });

        this.resetInputs();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Lỗi khi lấy thông tin pallet:', err);
        this.snackBar.open('Lỗi khi xử lý scan!', 'Đóng', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
        this.resetInputs();
        this.isLoading = false;
      }
    });
  }
  /**
   * Xử lý khi nhấn Enter ở input Location
   */
  onLocationScanEnter(): void {
    if (!this.scanPallet || !this.scanLocation) {
      this.snackBar.open('Vui lòng nhập đầy đủ thông tin!', 'Đóng', {
        duration: 2000,
        panelClass: ['snackbar-warning'],
      });
      return;
    }

    // Kiểm tra xem đã scan pallet này chưa
    const alreadyScanned = this.scannedList.some(
      (item) => item.serialPallet === this.scanPallet.trim()
    );

    if (alreadyScanned) {
      this.snackBar.open('Mã pallet/thùng này đã được scan!', 'Đóng', {
        duration: 3000,
        panelClass: ['snackbar-warning'],
      });
      this.scanPallet = '';
      this.scanLocation = '';
      setTimeout(() => this.palletInput?.nativeElement?.focus(), 100);
      return;
    }

    // Gọi lại API để lấy thông tin đầy đủ
    this.xuatKhoService.getPalletInfo(this.scanPallet.trim()).subscribe({
      next: (palletInfo) => {
        if (!palletInfo || !palletInfo.data) {
          this.snackBar.open('Không tìm thấy thông tin pallet!', 'Đóng', {
            duration: 3000,
            panelClass: ['snackbar-error'],
          });
          this.resetInputs();
          return;
        }

        const data = palletInfo.data;

        // Tìm sản phẩm trong detail list
        const matched = this.detailList.find(
          (item: any) => item.productCode === data.product_code
        );

        if (!matched) {
          this.snackBar.open('Sản phẩm không có trong đơn xuất!', 'Đóng', {
            duration: 3000,
            panelClass: ['snackbar-error'],
          });
          this.resetInputs();
          return;
        }

        const now = new Date();
        const formattedTime = this.formatScanTime(now.toISOString());

        const newItem: ScannedItem = {
          productId: matched.id || 0,
          inventoryCode: this.scanLocation.trim(),
          serialPallet: this.scanPallet.trim(),
          quantity: data.quantity || matched.quantity,
          originalQuantity: matched.quantity,
          productName: data.product_name || matched.productName || 'N/A',
          scanTime: formattedTime,
          warehouse: this.scanLocation.trim(),
        };

        this.scannedList = [...this.scannedList, newItem];

        this.snackBar.open('✓ Scan thành công!', '', {
          duration: 1500,
          panelClass: ['snackbar-success'],
        });

        this.resetInputs();
      },
      error: (err) => {
        console.error('Lỗi khi lấy thông tin pallet:', err);
        this.snackBar.open('Lỗi khi xử lý scan!', 'Đóng', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
        this.resetInputs();
      }
    });
  }
  playAudio(file: string): void {
    const audio = new Audio(file);
    audio.play();
  }

  getPalletPlaceholder(): string {
    return this.selectedMode === 'pallet' ? 'Scan mã Pallet...' : 'Scan mã Thùng...';
  }
  //camera mobile
  async openCameraScanner(field: 'pallet' | 'location') {
    if (!this.selectedMode && field === 'pallet') {
      this.snackBar.open('Vui lòng chọn mode scan!', 'Đóng', { duration: 3000 });
      return;
    }

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

      this.availableCameras = cameras;

      const backCameras = cameras.filter(c =>
        (c.label || "").toLowerCase().includes("back") ||
        (c.label || "").toLowerCase().includes("environment") ||
        (c.label || "").toLowerCase().includes("rear")
      );

      let targetCam: CameraDevice;
      if (this.selectedCameraId) {
        targetCam = cameras.find(c => c.id === this.selectedCameraId) ||
          (backCameras.length > 0 ? backCameras[backCameras.length - 1] : cameras[0]);
      } else {
        targetCam = backCameras.length > 0 ? backCameras[backCameras.length - 1] : cameras[0];
      }

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

      const currentIndex = this.availableCameras.findIndex(c => c.id === this.selectedCameraId);
      const nextIndex = (currentIndex + 1) % this.availableCameras.length;
      const nextCamera = this.availableCameras[nextIndex];

      this.logDebug(`Switching from ${this.availableCameras[currentIndex]?.label} to ${nextCamera.label}`);

      await this.qrScanner.stop();
      this.logDebug("Current camera stopped");

      this.selectedCameraId = nextCamera.id;

      await new Promise(resolve => setTimeout(resolve, 200));

      await this.startScanner(nextCamera.id);

      this.snackBar.open(`Đã chuyển sang ${nextCamera.label}`, "", { duration: 2000 });
      this.logDebug("Camera switched successfully");

    } catch (e: any) {
      this.logDebug("Switch camera error: " + e?.message);
      this.snackBar.open("Lỗi khi chuyển camera!", "Đóng", { duration: 3000 });

      try {
        await this.startScanner(this.selectedCameraId!);
      } catch {
        this.stopScanning();
      }
    }
  }

  handleHtml5Scan(code: string) {
    code = code.trim();

    if (code === this.lastScannedCode) return;
    this.lastScannedCode = code;

    this.logDebug("Processing: " + code);

    // CHỈ CẦN PALLET - không cần location
    if (code.startsWith("P") || code.startsWith("B")) {
      this.scanPallet = code;
      this.snackBar.open("✓ Đã quét mã!", "", { duration: 1000 });

      // TRIGGER SCAN NGAY
      this.stopScanning();
      setTimeout(() => this.onPalletScanEnter(), 50);
    } else {
      this.snackBar.open("Mã không hợp lệ! (Phải bắt đầu bằng P hoặc B)", "Đóng", {
        duration: 2000
      });
    }
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

    if (this.debugLogs.length > 50) {
      this.debugLogs = this.debugLogs.slice(0, 50);
    }
  }

  ngOnDestroy(): void {
    this.stopScanning();
  }

  onScanSuccess(decodedText: string): void {
    const code = decodedText.trim();
    if (code === this.lastScannedCode) return;
    this.lastScannedCode = code;

    if (this.scannerActive === 'pallet') {
      this.scanPallet = code;
      this.playAudio('assets/audio/successed-295058.mp3');
      this.snackBar.open('✓ Đã scan pallet/thùng!', '', { duration: 1500 });
    } else {
      this.scanLocation = code;
      this.snackBar.open('✓ Đã scan location!', '', { duration: 1500 });
    }

    // Khi đã có đủ dữ liệu thì gọi lại logic sẵn có
    if (this.scanPallet && this.scanLocation) {
      this.stopScanning();
      setTimeout(() => this.onLocationScanEnter(), 100);
    }
  }

  // stopScanning(): void {
  //   this.lastScannedCode = null;
  //   this.isScanning = false;
  //   this.scannerActive = null;
  // }

  /**
   * Reset inputs và focus về pallet
   */
  resetInputs(): void {
    this.scanPallet = '';
    this.scanLocation = '';
    setTimeout(() => this.palletInput?.nativeElement?.focus(), 100);
  }

  /**
   * Format thời gian scan
   */
  formatScanTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  /**
   * Xử lý phân trang
   */
  setPagedData(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pagedList = this.scannedList.slice(startIndex, endIndex);
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.setPagedData();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.setPagedData();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.onPageChange(this.currentPage);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.onPageChange(this.currentPage);
    }
  }

  /**
   * Lưu thông tin scan
   */
  submitScan(): void {
    if (this.scannedList.length === 0) {
      this.snackBar.open('Chưa có dữ liệu scan để gửi!', 'Đóng', {
        duration: 3000,
        panelClass: ['snackbar-error'],
      });
      return;
    }

    const payload = {
      scan_details: this.scannedList.map((item) => ({
        products_in_osr_id: item.productId,
        inventory_identifier: item.inventoryCode,
        serial_pallet: item.serialPallet,
        quantity_dispatched: item.quantity >= 0 ? item.quantity : 0,
        scan_time: new Date().toISOString().slice(0, 19),
        scan_by: 'admin', // TODO: Lấy từ user đang login
      })),
    };

    this.xuatKhoService.submitScan(this.requestId, payload).subscribe({
      next: () => {
        this.snackBar.open('✓ Lưu thông tin scan thành công!', 'Đóng', {
          duration: 3000,
          panelClass: ['snackbar-success'],
        });
        setTimeout(() => {
          this.router.navigate([
            '/kho-thanh-pham/xuat-don-ban-hang/detail/',
            this.requestId,
          ]);
        }, 2000);
      },
      error: (err) => {
        console.error('Lỗi khi gửi scan:', err);
        this.snackBar.open('Lỗi khi gửi dữ liệu scan!', 'Đóng', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
      },
    });
  }

  /**
   * Quay lại trang detail
   */
  back(): void {
    const requestId = this.route.snapshot.paramMap.get('id');
    this.router.navigate(
      ['/kho-thanh-pham/xuat-don-ban-hang/detail', requestId]
    );
  }
}