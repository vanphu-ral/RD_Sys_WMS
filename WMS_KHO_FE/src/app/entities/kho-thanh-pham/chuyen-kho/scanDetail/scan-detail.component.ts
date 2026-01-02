import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ChuyenKhoService } from '../service/chuyen-kho.service.component';
import { AuthService } from '../../../../services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { BarcodeFormat } from '@zxing/library';
import { CameraDevice, Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';

export interface ScannedItem {
  id?: number;
  productId: number;
  inventoryCode: string;
  serialPallet: string;
  quantity: number;
  originalQuantity: number;
  productName?: string;
  scanTime?: string;
  warehouse: string;
  confirmed?: boolean;
  isNew?: boolean; // Flag để đánh dấu item mới scan (chưa lưu DB)
}

export interface DetailItem {
  id: number;
  internal_warehouse_transfer_requests_id: number;
  product_code: string;
  product_name: string;
  total_quantity: number;
  dvt: string;
  scanned_quantity?: number;
  status?: 'pending' | 'partial' | 'completed';
}

@Component({
  selector: 'app-scan-detail',
  standalone: false,
  templateUrl: './scan-detail.component.html',
  styleUrl: './scan-detail.component.scss',
})
export class ScanDetailComponent implements OnInit {
  // ===== ROUTE PARAMS =====
  requestId: number | undefined;
  scanMode: 'single' | 'all' = 'all';
  selectedItemId: number | null = null;
  // ===== SCAN INPUTS =====
  scanPallet: string = '';
  scanLocation: string = '';
  selectedMode: 'pallet' | 'thung' | null = null;
  globalQuantity: number | null = null;

  // ===== DATA =====
  scannedList: ScannedItem[] = [];
  detailList: DetailItem[] = [];

  // ===== TABLE =====
  displayedColumns: string[] = [
    'stt',
    'productId',
    'productName',
    'serialPallet',
    'quantity',
    'scanTime',
    'warehouse',
  ];

  // ===== PAGINATION =====
  pageSize: number = 10;
  pageSizeOptions: number[] = [5, 10, 15, 20];
  currentPage: number = 1;
  totalItems: number = 0;
  totalPages: number = 0;
  pagedList: any[] = [];

  // ===== UI STATE =====
  isLoading = false;
  //mobile scan
  isMobile: boolean = false;
  isScanning = false;
  scannerActive: 'pallet' | 'location' | null = null;
  lastScannedCode: string | null = null;
  currentDevice: MediaDeviceInfo | undefined = undefined;
  formats = [BarcodeFormat.QR_CODE, BarcodeFormat.CODE_128];

  //switch camera
  selectedCameraId: string | null = null;
  qrScanner?: Html5Qrcode;
  availableCameras: CameraDevice[] = [];
  debugLogs: string[] = [];

  // ===== VIEWCHILD =====
  @ViewChild('palletInput') palletInput!: ElementRef;
  @ViewChild('locationInput') locationInput!: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private chuyenKhoService: ChuyenKhoService,
    private authService: AuthService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.checkIfMobile();
    const state = history.state;
    this.requestId = +this.route.snapshot.paramMap.get('id')!;
    const scanModeParam = this.route.snapshot.paramMap.get('reqId');
    const queryMode = this.route.snapshot.queryParamMap.get('mode');

    if (this.requestId) {
      this.loadDetailList();
      this.loadScannedData();

      // Xác định chế độ scan
      if (queryMode === 'all' || scanModeParam === 'all') {
        this.scanMode = 'all';
      } else if (scanModeParam && scanModeParam !== 'all') {
        this.scanMode = 'single';
        this.selectedItemId = +scanModeParam;
      }
    }
  }

  checkIfMobile(): void {
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth <= 768;
  }

  // ===== LOAD DETAIL LIST =====
  loadDetailList(): void {
    this.isLoading = true;
    this.chuyenKhoService.getTransferItemsById(this.requestId!).subscribe({
      next: (res) => {
        this.detailList = res.map((item) => ({
          ...item,
          scanned_quantity: 0,
          status: 'pending' as const,
        }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Lỗi khi tải danh sách chi tiết:', err);
        this.snackBar.open('Không thể tải danh sách sản phẩm!', 'Đóng', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
        this.isLoading = false;
      },
    });
  }

  // ===== LOAD SCANNED DATA (Đã lưu trong DB) =====
  loadScannedData(): void {
    this.chuyenKhoService.getScannedData(this.requestId!).subscribe({
      next: (res) => {
        this.scannedList = res.map((item: any) => ({
          id: item.id,
          productId: item.products_in_IWTR_id,
          inventoryCode: item.inventory_identifier,
          serialPallet: item.serial_pallet,
          quantity: item.quantity_dispatched,
          originalQuantity: item.quantity_dispatched,
          scanTime: this.formatDateTime(item.scan_time),
          warehouse: item.scan_by || 'N/A',
          confirmed: true,
          isNew: false,
        }));
        this.totalItems = this.scannedList.length;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);

        this.setPagedData();
        this.updateDetailStatus();
      },
      error: (err) => {
        console.error('Lỗi khi tải dữ liệu scan:', err);
      },
    });
  }
  // ===== SELECT MODE =====
  onSelectMode(mode: 'pallet' | 'thung'): void {
    this.selectedMode = mode;
    setTimeout(() => this.palletInput?.nativeElement?.focus(), 100);
  }

  // ===== GET PLACEHOLDER TEXT =====
  getPalletPlaceholder(): string {
    return this.selectedMode === 'pallet' ? 'Scan mã Pallet...' : 'Scan mã Thùng...';
  }

  // ===== ENTER HANDLERS =====
  onPalletScanEnter(): void {
    this.locationInput?.nativeElement?.focus();
  }

  onLocationScanEnter(): void {
    if (!this.selectedMode) {
      this.snackBar.open('Vui lòng chọn mode scan!', 'Đóng', {
        duration: 3000,
        panelClass: ['snackbar-warning'],
      });
      return;
    }

    if (!this.scanPallet || !this.scanLocation) {
      this.snackBar.open('Vui lòng nhập đầy đủ thông tin scan!', 'Đóng', {
        duration: 3000,
        panelClass: ['snackbar-warning'],
      });
      return;
    }

    if (this.selectedMode === 'pallet') {
      this.scanPalletMode();
    } else {
      this.scanThungMode();
    }
  }


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

    if (code.startsWith("P")) {
      this.scanPallet = code;
      this.playAudio('assets/audio/successed-295058.mp3');
      this.snackBar.open("✓ Đã quét pallet!", "", { duration: 1000 });
    } else if (code.startsWith("B")) {
      this.scanPallet = code;
      this.playAudio('assets/audio/successed-295058.mp3');
      this.snackBar.open("✓ Đã quét thùng!", "", { duration: 1000 });
    } else {
      this.scanLocation = code;
      this.playAudio('assets/audio/successed-295058.mp3');
      this.snackBar.open("✓ Đã quét location!", "", { duration: 1000 });
    }

    if (this.scanPallet && this.scanLocation) {
      this.logDebug("Both codes ready, performing scan...");
      this.stopScanning();
      setTimeout(() => this.onLocationScanEnter(), 50);
    }
  }
  playAudio(file: string): void {
    const audio = new Audio(file);
    audio.play();
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

  // ===== SCAN MODE PALLET =====
  scanPalletMode(): void {
    const palletCode = this.scanPallet.trim().toUpperCase();

    this.isLoading = true;
    this.chuyenKhoService.scanPallet(palletCode).subscribe({
      next: (inventories) => {
        if (!inventories || inventories.length === 0) {
          this.snackBar.open('Không tìm thấy thùng nào trong pallet này!', 'Đóng', {
            duration: 3000,
            panelClass: ['snackbar-warning'],
          });
          this.isLoading = false;
          return;
        }

        let addedCount = 0;
        inventories.forEach((inventory: any) => {
          const added = this.addScannedItem(inventory);
          if (added) addedCount++;
        });

        if (addedCount > 0) {
          this.snackBar.open(
            `✓ Đã thêm ${addedCount} thùng từ pallet vào danh sách!`,
            '',
            {
              duration: 2000,
              panelClass: ['snackbar-success'],
            }
          );
        }

        this.clearScanInputs();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Lỗi khi scan pallet:', err);
        this.snackBar.open('Không tìm thấy pallet này trong hệ thống!', 'Đóng', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
        this.isLoading = false;
      },
    });
  }

  // ===== SCAN MODE THÙNG =====
  scanThungMode(): void {
    const thungCode = this.scanPallet.trim().toUpperCase();

    this.isLoading = true;
    this.chuyenKhoService.getInventoryByIdentifier(thungCode).subscribe({
      next: (inventory) => {
        const added = this.addScannedItem(inventory);

        if (added) {
          this.snackBar.open('✓ Đã thêm thùng vào danh sách!', '', {
            duration: 1500,
            panelClass: ['snackbar-success'],
          });
        }

        this.clearScanInputs();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Lỗi khi scan thùng:', err);
        this.snackBar.open('Không tìm thấy thùng này trong hệ thống!', 'Đóng', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
        this.isLoading = false;
      },
    });
  }

  // ===== ADD SCANNED ITEM (CHƯA LƯU DB) =====
  // ===== ADD SCANNED ITEM (CHƯA LƯU DB) =====
  addScannedItem(inventory: any): boolean {
    // CHECK TRÙNG MÃ THÙNG
    const existingItem = this.scannedList.find(
      (item) => item.inventoryCode.toUpperCase() === inventory.identifier.toUpperCase()
    );

    if (existingItem) {
      if (existingItem.confirmed) {
        this.snackBar.open(
          `Thùng ${inventory.identifier} đã được scan và xác nhận trước đó!`,
          'Đóng',
          {
            duration: 3000,
            panelClass: ['snackbar-warning'],
          }
        );
        return false;
      }

      existingItem.warehouse = this.scanLocation;
      existingItem.scanTime = this.formatDateTime(new Date().toISOString());

      this.snackBar.open(
        `Thùng ${inventory.identifier} đã có trong danh sách! Đã cập nhật kho.`,
        '',
        {
          duration: 2000,
          panelClass: ['snackbar-info'],
        }
      );
      return false;
    }

    // KIỂM TRA MÃ CÓ TRONG DETAIL LIST KHÔNG
    const detailItem = this.detailList.find(
      (item) => item.product_code === inventory.sap_code
    );

    if (!detailItem) {
      this.snackBar.open(
        `Sản phẩm ${inventory.sap_code} không nằm trong yêu cầu chuyển kho!`,
        'Đóng',
        {
          duration: 3000,
          panelClass: ['snackbar-error'],
        }
      );
      return false;
    }

    // **KIỂM TRA CHẾ ĐỘ SINGLE - CHỈ CHO SCAN SẢN PHẨM ĐÃ CHỌN**
    if (this.scanMode === 'single' && this.selectedItemId !== null) {
      if (detailItem.id !== this.selectedItemId) {
        this.snackBar.open(
          `Sản phẩm này không phải là sản phẩm được chọn để scan!`,
          'Đóng',
          {
            duration: 3000,
            panelClass: ['snackbar-warning'],
          }
        );
        return false;
      }
    }

    // **KIỂM TRA TỔNG SỐ LƯỢNG SCAN CỦA SẢN PHẨM NÀY**
    const currentScannedQty = this.scannedList
      .filter((item) => item.productId === detailItem.id)
      .reduce((sum, item) => sum + item.quantity, 0);

    const newTotalQty = currentScannedQty + (inventory.available_quantity || 0);

    // **KIỂM TRA VƯỢT QUÁ SỐ LƯỢNG YÊU CẦU**
    if (newTotalQty > detailItem.total_quantity) {
      const remaining = detailItem.total_quantity - currentScannedQty;
      this.snackBar.open(
        `Vượt quá số lượng yêu cầu!\n` +
        `Yêu cầu: ${detailItem.total_quantity} ${detailItem.dvt}\n` +
        `Đã scan: ${currentScannedQty} ${detailItem.dvt}\n` +
        `Còn lại: ${remaining} ${detailItem.dvt}\n` +
        `Thùng này: ${inventory.available_quantity} ${detailItem.dvt}`,
        'Đóng',
        {
          duration: 5000,
          panelClass: ['snackbar-error'],
        }
      );
      return false;
    }

    // THÊM ITEM MỚI VÀO DANH SÁCH
    const now = new Date();
    const newItem: ScannedItem = {
      id: undefined,
      productId: detailItem.id,
      inventoryCode: inventory.identifier,
      serialPallet: inventory.serial_pallet || 'N/A',
      quantity: inventory.available_quantity || 0, // ✅ Số lượng từng thùng
      originalQuantity: inventory.initial_quantity || 0,
      productName: inventory.name || detailItem.product_name,
      scanTime: this.formatDateTime(now.toISOString()),
      warehouse: this.scanLocation,
      confirmed: false,
      isNew: true,
    };

    this.scannedList = [...this.scannedList, newItem];
    this.totalItems = this.scannedList.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);

    this.setPagedData(); // Cập nhật lại pagination
    this.updateDetailStatus();

    // **HIỂN THỊ THÔNG BÁO CHI TIẾT**
    const updatedScannedQty = currentScannedQty + (inventory.available_quantity || 0);
    const remaining = detailItem.total_quantity - updatedScannedQty;

    this.snackBar.open(
      `✓ Đã thêm thùng ${inventory.identifier}\n` +
      `SL thùng: ${inventory.available_quantity} ${detailItem.dvt}\n` +
      `Tổng đã scan: ${updatedScannedQty}/${detailItem.total_quantity} ${detailItem.dvt}\n` +
      `Còn lại: ${remaining} ${detailItem.dvt}`,
      '',
      {
        duration: 3000,
        panelClass: ['snackbar-success'],
      }
    );

    return true;
  }

  // **THÊM METHOD TÍNH TỔNG SỐ LƯỢNG ĐÃ SCAN**
  getTotalScannedQuantity(productId?: number): number {
    if (productId) {
      // Tổng số lượng đã scan của 1 sản phẩm cụ thể
      return this.scannedList
        .filter((item) => item.productId === productId)
        .reduce((sum, item) => sum + item.quantity, 0);
    } else {
      // Tổng số lượng đã scan của TẤT CẢ sản phẩm
      return this.scannedList.reduce((sum, item) => sum + item.quantity, 0);
    }
  }

  // **THÊM METHOD LẤY SỐ LƯỢNG CÒN LẠI**
  getRemainingQuantity(productId: number): number {
    const detailItem = this.detailList.find((item) => item.id === productId);
    if (!detailItem) return 0;

    const scannedQty = this.getTotalScannedQuantity(productId);
    return detailItem.total_quantity - scannedQty;
  }

  // **THÊM METHOD LẤY THÔNG TIN SẢN PHẨM ĐANG SCAN (CHO MODE SINGLE)**
  getSelectedProductInfo(): DetailItem | null {
    if (this.scanMode === 'single' && this.selectedItemId !== null) {
      return this.detailList.find((item) => item.id === this.selectedItemId) || null;
    }
    return null;
  }

  // ===== UPDATE DETAIL STATUS =====
  updateDetailStatus(): void {
    this.detailList.forEach((detail) => {
      const scannedItems = this.scannedList.filter(
        (scan) => scan.productId === detail.id
      );

      const totalScanned = scannedItems.reduce((sum, item) => sum + item.quantity, 0);

      detail.scanned_quantity = totalScanned;

      if (totalScanned === 0) {
        detail.status = 'pending';
      } else if (totalScanned < detail.total_quantity) {
        detail.status = 'partial';
      } else {
        detail.status = 'completed';
      }
    });
  }

  // ===== APPLY GLOBAL QUANTITY =====
  applyGlobalQuantity(): void {
    if (this.globalQuantity == null || this.globalQuantity < 0) return;

    this.scannedList.forEach((item) => {
      if (!item.confirmed) {
        item.quantity = this.globalQuantity!;
      }
    });

    this.snackBar.open('Đã áp dụng số lượng cho tất cả!', '', { duration: 1500 });
  }

  // ===== CLEAR INPUTS =====
  clearScanInputs(): void {
    this.scanPallet = '';
    this.scanLocation = '';
    setTimeout(() => this.palletInput?.nativeElement?.focus(), 100);
  }

  // ===== FORMAT DATETIME =====
  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  }

  // ===== SUBMIT SCAN (LƯU VÀO DB) =====
  submitScan(): void {
    const newItems = this.scannedList.filter((item) => item.isNew === true);

    if (newItems.length === 0) {
      this.snackBar.open('Không có dữ liệu mới để lưu!', 'Đóng', {
        duration: 3000,
        panelClass: ['snackbar-warning'],
      });
      return;
    }

    const username = this.authService.getUsername();

    const payload = {
      scan_details: newItems.map((item) => ({
        products_in_IWTR_id: item.productId,
        inventory_identifier: item.inventoryCode,
        serial_pallet: item.serialPallet,
        quantity_dispatched: item.quantity,
        scan_time: new Date().toISOString().slice(0, 19),
        scan_by: username,
      })),
    };

    this.isLoading = true;

    this.chuyenKhoService.submitScan(this.requestId!, payload).subscribe({
      next: () => {
        this.snackBar.open('✓ Lưu thông tin scan thành công!', '', {
          duration: 2000,
          panelClass: ['snackbar-success'],
        });

        setTimeout(() => {
          this.router.navigate([
            '/kho-thanh-pham/chuyen-kho-noi-bo/detail/',
            this.requestId,
          ]);
        }, 1500);
      },
      error: (err) => {
        console.error('Lỗi khi gửi scan:', err);
        this.snackBar.open(
          err.error?.message || 'Lỗi khi gửi dữ liệu scan!',
          'Đóng',
          {
            duration: 3000,
            panelClass: ['snackbar-error'],
          }
        );
        this.isLoading = false;
      },
    });
  }

  // ===== PAGINATION =====
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
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  // ===== BACK =====
  back(): void {
    this.router.navigate([
      '/kho-thanh-pham/chuyen-kho-noi-bo/detail/',
      this.requestId,
    ]);
  }
}