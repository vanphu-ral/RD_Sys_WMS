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
  productCode?: string;
  serialPallet: string;
  quantity: number;
  originalQuantity: number;
  productName?: string;
  scanTime?: string;
  warehouse: string;
  confirmed?: boolean;
  location_id?: number;
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
  scanRequestId: number | undefined;
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
    'productCode',
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
  locationMap: Map<number, string> = new Map();
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

    this.requestId = Number(this.route.snapshot.paramMap.get('id')) || undefined;

    const scanIdParam = this.route.snapshot.paramMap.get('scanId')
      ?? this.route.snapshot.paramMap.get('reqId')
      ?? this.route.snapshot.paramMap.get('requestId');

    if (scanIdParam) {
      this.scanRequestId = Number(scanIdParam) || undefined;
    } else {
      // fallback: lấy từ URL segments: /detail/:id/scan/:scanRequestId
      const segments = this.route.snapshot.url.map(s => s.path).filter(Boolean);
      const scanIndex = segments.findIndex(seg => seg.toLowerCase() === 'scan');
      if (scanIndex !== -1 && segments.length > scanIndex + 1) {
        const segVal = segments[scanIndex + 1];
        this.scanRequestId = Number(segVal) || undefined;
      }
    }

    if (!this.scanRequestId && this.requestId) {
      this.scanRequestId = undefined;
    }

    // Load data chỉ khi requestId/scanRequestId đã xác định
    if (this.requestId) {
      this.loadDetailList();
      // gọi loadScannedData chỉ khi scanRequestId có giá trị hợp lệ
      if (this.scanRequestId) {
        this.loadScannedData();
      } else {
        console.warn('scanRequestId not found in route; scanned data will not be loaded.');
      }

      this.loadLocations();

      // Xác định chế độ scan
      const scanModeParam = this.route.snapshot.paramMap.get('reqId');
      const queryMode = this.route.snapshot.queryParamMap.get('mode');
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
  // method to load minimal locations
  loadLocations(): void {
    this.chuyenKhoService.getMinimalLocations().subscribe({
      next: (res) => {
        this.locationMap.clear();
        (res || []).forEach((loc: any) => {
          if (loc && loc.id != null) {
            this.locationMap.set(Number(loc.id), String(loc.code || '').trim());
          }
        });
      },
      error: (err) => {
        console.warn('Không tải được danh sách locations:', err);
      }
    });
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
    const idToUse = this.scanRequestId ?? this.requestId;
    if (!idToUse) {
      console.warn('No scanRequestId available to load scanned data');
      return;
    }

    const mapAndSetScanned = (res: any[]) => {
      const detailById = new Map<number, any>();
      (this.detailList || []).forEach((d: any) => {
        if (d && d.id != null) detailById.set(Number(d.id), d);
      });

      this.scannedList = (res || []).map((item: any) => {
        const productId = item.product_in_iwtr_id ?? item.products_in_iwtr_id ?? item.product_in_osr_id ?? item.product_id;
        const detail = productId != null ? detailById.get(Number(productId)) : undefined;

        return {
          id: item.id,
          productId: item.products_in_iwtr_id,
          productCode: detail?.product_code ?? (item.sap_code ?? item.product_code ?? item.inventory_code),
          productName: detail?.product_name ?? (item.product_name ?? ''),
          inventoryCode: item.inventory_identifier,
          serialPallet: item.serial_pallet,
          quantity: item.quantity_dispatched,
          originalQuantity: item.quantity_dispatched,
          scanTime: this.formatDateTime(item.scan_time),
          warehouse: this.getLocationCodeById(item.new_location) || 'N/A',
          confirmed: true,
          isNew: false,
        } as ScannedItem;
      });

      this.totalItems = this.scannedList.length;
      this.totalPages = Math.ceil(this.totalItems / this.pageSize);
      this.setPagedData();
      this.updateDetailStatus();
    };

    this.chuyenKhoService.getScannedData(idToUse).subscribe({
      next: (res) => {
        if ((this.detailList || []).length === 0 && this.requestId) {
          this.chuyenKhoService.getTransferItemsById(this.requestId).subscribe({
            next: (details) => {
              this.detailList = details.map((item: any) => ({ ...item, scanned_quantity: 0, status: 'pending' as const }));
              mapAndSetScanned(res);
            },
            error: () => {
              mapAndSetScanned(res);
            }
          });
        } else {
          mapAndSetScanned(res);
        }
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
  addScannedItem(inventory: any): boolean {
    // Normalize helpers
    const norm = (v: any) => (v === null || v === undefined) ? '' : String(v).trim();
    const normUpper = (v: any) => norm(v).toUpperCase();

    const invIdentifier = norm(inventory.identifier);
    const invSap = normUpper(inventory.sap_code);
    const invQty = Number(inventory.available_quantity ?? 0);

    // CHECK TRÙNG MÃ THÙNG (bảo đảm tồn tại identifier)
    if (!invIdentifier) {
      console.warn('Inventory missing identifier, skip', inventory);
      return false;
    }

    const existingItem = this.scannedList.find(
      (item) => normUpper(item.inventoryCode) === invIdentifier.toUpperCase()
    );

    if (existingItem) {
      if (existingItem.confirmed) {
        this.snackBar.open(
          `Thùng ${invIdentifier} đã được scan và xác nhận trước đó!`,
          'Đóng',
          { duration: 3000, panelClass: ['snackbar-warning'] }
        );
        return false;
      }

      existingItem.warehouse = inventory.location_code || inventory.location_id || 'N/A';
      existingItem.scanTime = this.formatDateTime(new Date().toISOString());

      this.snackBar.open(
        `Thùng ${invIdentifier} đã có trong danh sách! Đã cập nhật kho.`,
        '',
        { duration: 2000, panelClass: ['snackbar-info'] }
      );
      return false;
    }

    // KIỂM TRA MÃ CÓ TRONG DETAIL LIST KHÔNG
    // So sánh sap_code của inventory với product_code của detail
    let detailItem = this.detailList.find((d: any) => {
      const detailCode = normUpper(d.product_code);

      // So sánh trực tiếp
      if (detailCode && invSap && detailCode === invSap) return true;

      // Fallback: so sánh numeric nếu cả hai có thể parse số
      const detailNum = Number(d.product_code);
      const invNum = Number(inventory.sap_code);
      if (!Number.isNaN(detailNum) && !Number.isNaN(invNum) && detailNum === invNum) return true;

      return false;
    });

    console.log('Product code matching:', {
      invSap,
      detailItem,
      allDetailCodes: this.detailList.map(d => normUpper(d.product_code))
    });

    if (!detailItem) {
      this.snackBar.open(
        `Sản phẩm ${invSap || invIdentifier} không nằm trong yêu cầu xuất kho!`,
        'Đóng',
        { duration: 3000, panelClass: ['snackbar-error'] }
      );
      return false;
    }

    // SINGLE MODE check
    if (this.scanMode === 'single' && this.selectedItemId !== null) {
      if (detailItem.id !== this.selectedItemId) {
        this.snackBar.open(
          `Sản phẩm này không phải là sản phẩm được chọn để scan!`,
          'Đóng',
          { duration: 3000, panelClass: ['snackbar-warning'] }
        );
        return false;
      }
    }

    // TÍNH SỐ ĐÃ SCAN HIỆN TẠI
    const currentScannedQty = this.scannedList
      .filter((item) => item.productId === detailItem.id)
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0);

    const newTotalQty = currentScannedQty + invQty;

    // Nếu available_quantity = 0 thì không thêm
    if (!invQty || invQty <= 0) {
      this.snackBar.open(
        `Thùng ${invIdentifier} không có số lượng khả dụng để scan.`,
        'Đóng',
        { duration: 3000, panelClass: ['snackbar-warning'] }
      );
      return false;
    }
    const resolvedWarehouse = this.getLocationCodeById(inventory.location_id) ||
      (inventory.location_code ? String(inventory.location_code).trim() : undefined) ||
      (inventory.location_id != null ? String(inventory.location_id) : 'N/A');
    let resolvedLocationId: number | null = null;
    const scannedLocCode = this.scanLocation.trim().toUpperCase();
    for (const [id, code] of this.locationMap.entries()) {
      if (code.toUpperCase() === scannedLocCode) {
        resolvedLocationId = id;
        break;
      }
    }

    // Nếu không tìm thấy location hợp lệ
    if (!resolvedLocationId) {
      this.snackBar.open(
        `Location "${this.scanLocation}" không hợp lệ!`,
        'Đóng',
        { duration: 3000, panelClass: ['snackbar-error'] }
      );
      return false;
    }
    // THÊM ITEM MỚI
    const now = new Date();
    const newItem: ScannedItem = {
      id: undefined,
      productId: detailItem.id,
      productCode: invSap,
      inventoryCode: invIdentifier,
      serialPallet: norm(inventory.serial_pallet) || 'N/A',
      quantity: invQty,
      originalQuantity: Number(inventory.initial_quantity ?? 0),
      productName: inventory.name || detailItem.product_name,
      scanTime: this.formatDateTime(now.toISOString()),
      warehouse: scannedLocCode,
      location_id: resolvedLocationId,
      confirmed: false,
      isNew: true,
    };

    this.scannedList = [...this.scannedList, newItem];
    this.totalItems = this.scannedList.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);

    this.setPagedData();
    this.updateDetailStatus();

    const updatedScannedQty = currentScannedQty + invQty;
    const remaining = Number(detailItem.total_quantity || 0) - updatedScannedQty;

    this.snackBar.open(
      `✓ Đã thêm thùng ${invIdentifier}\n` +
      `SL thùng: ${invQty} ${detailItem.dvt}\n` +
      `Tổng đã scan: ${updatedScannedQty}/${detailItem.total_quantity} ${detailItem.dvt}\n` +
      `Còn lại: ${remaining} ${detailItem.dvt}`,
      '',
      { duration: 3000, panelClass: ['snackbar-success'] }
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
        product_in_iwtr_id: item.productId,
        inventory_identifier: item.inventoryCode,
        serial_pallet: item.serialPallet,
        quantity_dispatched: item.quantity,
        new_location: item.location_id,
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
  private getLocationCodeById(id: any): string | undefined {
    if (id == null) return undefined;
    const n = Number(id);
    if (Number.isNaN(n)) return undefined;
    return this.locationMap.get(n);
  }

}