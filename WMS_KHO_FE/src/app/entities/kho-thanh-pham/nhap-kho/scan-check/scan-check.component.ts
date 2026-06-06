import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NhapKhoService, PushInventoryPayload } from '../service/nhap-kho.service';
import { AuthService } from '../../../../services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { AlertDialogComponent } from '../dialog/alert-dialog.component';
import { BarcodeFormat } from '@zxing/library';
import { catchError, forkJoin, of } from 'rxjs';
import { ZXingScannerComponent } from '@zxing/ngx-scanner';
import { CameraDevice, Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';

export interface ScannedPallet {
  id: number;
  serialPallet: string;
  numBoxInPallet?: number;
  totalQuantityInPallet?: number;
  quantityPerBox?: number;
  quantityImported: number;
  locationId: number;
  locationCode?: string;
  poNumber?: string;
  customerName?: string;
  itemNoSku?: string;
  dateCode?: string;
  productionDecisionNumber?: string;
  note?: string;
  scanStatus: 'Đã scan' | 'Chưa scan';
  scanBy?: string;
  timeChecked?: string;
  listBox?: any[];
  sapCode?: string;
  name?: string;
  lot?: string;
  confirmed?: boolean;
}

export interface ScannedBox {
  id: number;
  boxCode: string;
  quantity: number;
  quantityImported: number;
  locationId: number;
  locationCode?: string;
  note?: string;
  serialPallet?: string;
  isLooseBox: boolean;
  scanBy?: string;
  timeChecked?: string;
  sapCode?: string;
  name?: string;
  lot?: string;
  confirmed?: boolean;
}

@Component({
  selector: 'app-nhap-kho-component',
  standalone: false,
  templateUrl: './scan-check.component.html',
  styleUrl: './scan-check.component.scss',
})
export class ScanCheckComponent implements OnInit {
  requestId: number | undefined;
  scanMode: 'single' | 'all' = 'all';
  targetPalletId: number | undefined;
  targetPalletCode: string = '';
  allowedPalletCodes: string[] = [];
  allowedBoxCodes: string[] = [];

  importRequirementInfo: any;

  // Scan inputs
  scanPallet: string = '';
  scanLocation: string = '';
  selectedMode: 'pallet' | 'thung' | null = null;
  globalQuantityPallet: number | null = null;
  globalQuantityBox: number | null = null;
  lastScannedCode: string | null = null;

  // Separate lists for Pallet and Box
  scannedPallets: ScannedPallet[] = [];
  scannedBoxes: ScannedBox[] = [];

  // Active tab
  activeTab: 'pallet' | 'box' = 'pallet';

  //switch camera
  selectedCameraId: string | null = null;
  availableCameras: CameraDevice[] = [];

  // Table columns
  palletColumns: string[] = [
    'stt',
    'serialPallet',
    'poNumber',
    'customerName',
    'numBoxInPallet',
    'quantityPerBox',
    'totalQuantityInPallet',
    'quantityImported',
    'locationId',
    'scanStatus',
    'timeChecked',
  ];

  boxColumns: string[] = [
    'stt',
    'boxCode',
    'serialPallet',
    'quantity',
    'quantityImported',
    'locationId',
    'scanStatus',
    'timeChecked',
  ];

  // Pagination for Pallets
  pageSizePallet: number = 10;
  currentPagePallet: number = 1;
  totalItemsPallet: number = 0;
  totalPagesPallet: number = 0;
  pagedPallets: ScannedPallet[] = [];

  debugLogs: string[] = [];

  // Pagination for Boxes
  pageSizeBox: number = 10;
  currentPageBox: number = 1;
  totalItemsBox: number = 0;
  totalPagesBox: number = 0;
  pagedBoxes: ScannedBox[] = [];

  pageSizeOptions: number[] = [5, 10, 15, 20];

  isScanning: boolean = false;
  isMobile: boolean = false;
  isLoading = false;
  scannerActive: 'pallet' | 'location' | null = null;
  qrScanner?: Html5Qrcode;

  @ViewChild('palletInput') palletInput!: ElementRef;
  @ViewChild('locationInput') locationInput!: ElementRef;
  @ViewChild(ZXingScannerComponent) scanner!: ZXingScannerComponent;

  locations: { id: number; code: string }[] = [];
  private locationsLoaded = false;
  availableDevices: MediaDeviceInfo[] = [];
  currentStream: MediaStream | null = null;
  formats: BarcodeFormat[] = [
    BarcodeFormat.QR_CODE,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8
  ];
  scannerEnabled = false;
  currentDevice: MediaDeviceInfo | undefined = undefined;
  hasPermission = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private nhapKhoService: NhapKhoService,
    private authService: AuthService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.checkIfMobile();

    this.route.queryParams.subscribe((queryParams) => {
      this.scanMode = queryParams['mode'] || 'all';
      this.targetPalletId = queryParams['palletId'] ? +queryParams['palletId'] : undefined;
      this.targetPalletCode = queryParams['palletCode'] || '';
    });

    this.route.params.subscribe((params) => {
      const nextId = +(params['id'] || 0);
      if (!nextId) return;
      const isNewPage = this.requestId !== nextId;
      this.requestId = nextId;
      if (isNewPage) {
        this.locationsLoaded = false;
      }
      this.loadScanPageData();
    });
    // this.initCamera();
  }

  checkIfMobile(): void {
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth <= 768;
  }

  /** Tải locations trước rồi mới map dữ liệu đã scan — tránh hiển thị kho N/A. */
  private loadScanPageData(): void {
    if (!this.requestId) return;

    this.isLoading = true;
    const locations$ = this.locationsLoaded
      ? of(this.locations)
      : this.nhapKhoService.getMinimalLocations().pipe(
          catchError((err) => {
            console.error('Lỗi khi load locations:', err);
            this.snackBar.open('Không thể tải danh sách location!', 'Đóng', { duration: 3000 });
            return of([] as { id: number; code: string }[]);
          })
        );

    forkJoin({
      locations: locations$,
      importReq: this.nhapKhoService.getImportRequirement(this.requestId),
    }).subscribe({
      next: ({ locations, importReq }) => {
        this.locations = locations || [];
        this.locationsLoaded = true;
        this.importRequirementInfo = importReq?.general_info || importReq?.data?.general_info;

        if (!this.importRequirementInfo) {
          this.snackBar.open('Không tìm thấy thông tin yêu cầu nhập!', 'Đóng', { duration: 3000 });
          this.router.navigate(['/kho-thanh-pham/nhap-kho-sx']);
          this.isLoading = false;
          return;
        }

        const pallets = this.importRequirementInfo.list_pallet || [];

        if (this.scanMode === 'single' && this.targetPalletCode) {
          const targetPallet = pallets.find((p: any) => p.serial_pallet === this.targetPalletCode);
          if (!targetPallet) {
            this.snackBar.open('Không tìm thấy pallet cần scan!', 'Đóng', { duration: 3000 });
            this.router.navigate(['/kho-thanh-pham/nhap-kho-sx/phe-duyet', this.requestId]);
            this.isLoading = false;
            return;
          }
          this.allowedPalletCodes = [targetPallet.serial_pallet].filter((c) => c);
          this.allowedBoxCodes = (targetPallet.list_box || []).map((b: any) => b.box_code);
        } else {
          this.allowedPalletCodes = pallets
            .map((p: any) => p.serial_pallet)
            .filter((c: string) => c && c.trim());
          this.allowedBoxCodes = pallets.flatMap((p: any) =>
            (p.list_box || []).map((b: any) => b.box_code)
          );
        }

        this.loadScannedItemsFromAPI(pallets);

        if (this.scannedPallets.length > 0 || this.scannedBoxes.length > 0) {
          const message = `Đã tải ${this.scannedPallets.length} pallet và ${this.scannedBoxes.length} thùng đã scan`;
          this.snackBar.open(message, '', {
            duration: 3000,
            panelClass: ['snackbar-success'],
          });
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Lỗi khi tải thông tin scan:', err);
        this.snackBar.open('Không thể tải thông tin!', 'Đóng', { duration: 3000 });
        this.isLoading = false;
      },
    });
  }

  /** Tra cứu location từ danh sách minimal theo mã vừa quét (không phân biệt hoa thường). */
  private findLocationByScannedCode(
    scanned: string
  ): { id: number; code: string } | null {
    const normalized = (scanned || '').trim().toUpperCase();
    if (!normalized) {
      return null;
    }
    const loc = this.locations.find(
      (l) => (l.code || '').trim().toUpperCase() === normalized
    );
    if (!loc) {
      return null;
    }
    return {
      id: Number(loc.id),
      code: (loc.code || '').trim(),
    };
  }

  getLocationCode(locationId: number | string | null | undefined): string {
    const id = Number(locationId);
    if (!id || Number.isNaN(id)) {
      return '';
    }
    const loc = this.locations.find((l) => Number(l.id) === id);
    return loc?.code ?? '';
  }

  /** Hiển thị cột Kho: ưu tiên mã đã gán khi scan, fallback tra minimal theo id. */
  displayLocationCode(item: {
    locationId?: number | string | null;
    locationCode?: string;
  }): string {
    const storedCode = (item.locationCode || '').trim();
    if (storedCode) {
      return storedCode;
    }
    const fromMinimal = this.getLocationCode(item.locationId);
    return fromMinimal || '-';
  }

  private resolveLocationCode(
    locationId: number | string | null | undefined,
    fallbackCode?: string
  ): string {
    const fromId = this.getLocationCode(locationId);
    if (fromId) {
      return fromId;
    }
    return (fallbackCode ?? '').trim();
  }

  /** Location hợp lệ chỉ khi id tồn tại trong minimal và map được ra mã kho. */
  private hasValidScanLocation(item: {
    locationId?: number | string | null;
    locationCode?: string;
  }): boolean {
    const locationId = Number(item.locationId);
    if (!locationId || Number.isNaN(locationId)) {
      return false;
    }
    const codeFromMinimal = this.getLocationCode(locationId);
    return !!codeFromMinimal;
  }

  private applyScannedLocation(
    item: { locationId: number; locationCode?: string },
    location: { id: number; code: string }
  ): void {
    item.locationId = Number(location.id);
    item.locationCode = location.code;
  }

  loadScannedItemsFromAPI(pallets: any[]): void {
    console.log('Loading scanned items from API...', pallets);
    console.log('Scan mode:', this.scanMode);
    console.log('Target pallet ID:', this.targetPalletId);

    // reset trước khi load lại
    this.scannedPallets = [];
    this.scannedBoxes = [];

    // ============================================
    // LỌC PALLETS THEO MODE
    // ============================================
    let filteredPallets = pallets || [];

    if (this.scanMode === 'single' && this.targetPalletId) {
      // Chỉ lấy pallet được chọn
      filteredPallets = filteredPallets.filter(p => p.id === this.targetPalletId);

      if (filteredPallets.length === 0) {
        console.warn('Không tìm thấy pallet với ID:', this.targetPalletId);
        return;
      }

      console.log('Filtered to single pallet:', filteredPallets[0]?.serial_pallet);
    }

    // ============================================
    // LOAD PALLETS ĐÃ SCAN (CHỈ PALLET ĐƯỢC LỌC)
    // ============================================
    filteredPallets.forEach((p: any) => {
      const palletSerial = p.serial_pallet ?? p.serialPallet ?? p.pallet_code ?? '';
      const palletScanStatus = p.scan_status ?? p.scanStatus;
      const isPalletScanned =
        p.confirmed === true ||
        palletScanStatus === true ||
        (typeof palletScanStatus === 'string' && palletScanStatus.toString().toLowerCase().includes('đã'));

      if (isPalletScanned && palletSerial && palletSerial.toString().trim()) {
        const scannedPallet = this.mapPalletToScannedPallet(p);
        this.scannedPallets.push(scannedPallet);
        console.log('Loaded pallet:', scannedPallet.serialPallet);
      }
    });

    // ============================================
    // LOAD BOXES ĐÃ SCAN (BAO GỒM THÙNG LẺ)
    // ============================================
    filteredPallets.forEach((p: any) => {
      const palletSerial = p.serial_pallet ?? p.serialPallet ?? '';
      const isLoosePallet = !palletSerial || palletSerial.toString().trim() === '';

      const listBox = Array.isArray(p.list_box) ? p.list_box : (Array.isArray(p.listBox) ? p.listBox : []);

      listBox.forEach((box: any) => {
        // Kiểm tra box đã scan: scan_status, confirmed hoặc có time_checked/scan_time/updated_date
        const boxScanStatus = box.scan_status ?? box.scanStatus;
        const timeCheckedRaw = box.time_checked ?? box.timeChecked ?? box.scan_time ?? box.updated_date ?? box.timeCheckedAt;
        const isBoxScanned =
          boxScanStatus === true ||
          (typeof boxScanStatus === 'string' &&
            boxScanStatus.toString().toLowerCase().includes('đã')) ||
          Boolean(timeCheckedRaw);

        if (isBoxScanned) {
          const rawLocationId = box.location_id ?? box.locationId ?? null;
          const locationIdNumber =
            rawLocationId !== null && rawLocationId !== undefined
              ? Number(rawLocationId)
              : 0;
          const codeFromMinimal = this.getLocationCode(locationIdNumber);
          const locationId = codeFromMinimal ? locationIdNumber : 0;
          const locationCode = codeFromMinimal
            ? codeFromMinimal
            : this.resolveLocationCode(0, box.location_code ?? box.locationCode);

          const scannedBox: ScannedBox = {
            id: box.id,
            boxCode: box.box_code ?? box.boxCode ?? '',
            quantity: box.quantity || 0,
            quantityImported: box.quantity_imported || box.quantity || 0,
            locationId,
            locationCode,
            note: box.note || '',
            serialPallet: palletSerial,
            isLooseBox: isLoosePallet,
            scanBy: box.scan_by ?? box.scanBy ?? '',
            timeChecked: timeCheckedRaw ?? '',
            sapCode: box.sap_code ?? this.importRequirementInfo?.inventory_code ?? '',
            name: box.name ?? this.importRequirementInfo?.inventory_name ?? '',
            lot: box.lot ?? this.importRequirementInfo?.lot_number ?? '',
            confirmed: box.confirmed === true,
          };

          this.scannedBoxes.push(scannedBox);
          console.log('Loaded box:', scannedBox.boxCode, isLoosePallet ? '(Thùng lẻ)' : '');
        }
      });
    });

    // Sắp xếp theo thời gian mới nhất (nếu có)
    this.scannedPallets.sort((a, b) => {
      const timeA = new Date(a.timeChecked || 0).getTime();
      const timeB = new Date(b.timeChecked || 0).getTime();
      return timeB - timeA;
    });

    this.scannedBoxes.sort((a, b) => {
      const timeA = new Date(a.timeChecked || 0).getTime();
      const timeB = new Date(b.timeChecked || 0).getTime();
      return timeB - timeA;
    });

    console.log('Total loaded pallets:', this.scannedPallets.length);
    console.log('Total loaded boxes:', this.scannedBoxes.length);

    // Cập nhật pagination
    this.updatePalletPagination();
    this.updateBoxPagination();

    // Tự động chuyển tab nếu có dữ liệu
    if (this.scannedBoxes.length > 0 && this.scannedPallets.length === 0) {
      this.activeTab = 'box';
    }
  }


  onSelectMode(mode: 'pallet' | 'thung'): void {
    this.selectedMode = mode;
    setTimeout(() => this.palletInput?.nativeElement?.focus(), 100);
    this.scanPallet = '';
    this.scanLocation = '';
    this.stopScanning();
  }

  onPalletScanEnter(): void {
    this.locationInput?.nativeElement?.focus();
  }

  onLocationScanEnter(): void {
    if (!this.selectedMode) {
      this.snackBar.open('Vui lòng chọn mode scan!', 'Đóng', { duration: 3000 });
      return;
    }

    if (!this.scanPallet.trim() || !this.scanLocation.trim()) {
      this.snackBar.open('Vui lòng nhập đầy đủ thông tin!', 'Đóng', { duration: 3000 });
      return;
    }

    this.performScan();
    setTimeout(() => this.palletInput?.nativeElement?.focus(), 100);
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
  handleHtml5Scan(code: string) {
    code = code.trim();

    // Chống scan trùng
    if (code === this.lastScannedCode) return;
    this.lastScannedCode = code;

    this.logDebug("Processing: " + code);

    // Phân loại mã
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
    // Nếu đủ cả hai → thực hiện scan
    if (this.scanPallet && this.scanLocation) {
      this.logDebug("Both codes ready, performing scan...");
      this.stopScanning();
      setTimeout(() => this.performScan(), 50);
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

  // async initCamera() {
  //   console.log('[Camera] Initializing...');
  //   this.scannerEnabled = false;

  //   try {
  //     // 👉 CHỈ xin quyền – nhưng PHẢI dừng stream ngay
  //     const tempStream = await navigator.mediaDevices.getUserMedia({
  //       video: { facingMode: { ideal: 'environment' } }
  //     });

  //     // Lưu lại để còn stop được
  //     this.currentStream = tempStream;

  //     // Dừng stream tạm ngay lập tức (nếu không sẽ chiếm camera)
  //     this.currentStream.getTracks().forEach(t => t.stop());
  //     this.currentStream = null;

  //     // Lấy danh sách camera
  //     const devices = await navigator.mediaDevices.enumerateDevices();
  //     this.availableDevices = devices.filter(d => d.kind === 'videoinput');

  //     if (!this.availableDevices.length) {
  //       this.snackBar.open('Không tìm thấy camera!', 'Đóng', { duration: 3000 });
  //       this.stopScanning();
  //       return;
  //     }

  //     const backCamera = this.availableDevices.find(d =>
  //       (d.label || '').toLowerCase().includes('back') ||
  //       (d.label || '').toLowerCase().includes('rear') ||
  //       (d.label || '').toLowerCase().includes('environment')
  //     );

  //     this.currentDevice = backCamera || this.availableDevices[0];
  //     this.hasPermission = true;

  //     // 👉 chỉ lúc này mới bật ZXING
  //     this.scannerEnabled = true;

  //     console.log('[Camera] Ready');
  //   } catch (err: any) {
  //     console.error('[Camera] init error', err);

  //     if (err.name === 'NotAllowedError') {
  //       this.snackBar.open('Bạn đã từ chối quyền camera!', 'Đóng', { duration: 3000 });
  //     } else if (err.name === 'NotReadableError') {
  //       this.snackBar.open('Camera đang bận, hãy đóng ứng dụng khác!', 'Đóng', { duration: 3000 });
  //     } else {
  //       this.snackBar.open('Không truy cập được camera', 'Đóng', { duration: 3000 });
  //     }

  //     this.stopScanning();
  //   }
  // }




  onCamerasFound(devices: MediaDeviceInfo[]) {
    this.availableDevices = devices;

    const back = devices.find(d =>
      (d.label || '').toLowerCase().includes('back')
    );

    this.currentDevice = back || devices[0];

    if (this.hasPermission) {
      this.scannerEnabled = true;
    }
  }

  onPermission(has: boolean) {
    this.hasPermission = has;
    if (has) this.scannerEnabled = true;
  }

  onCameraError(error: any) {
    console.error(error);

    if (error?.name === 'NotReadableError') {
      this.snackBar.open(
        'Camera đang bận. Đóng ứng dụng khác (Zalo, Camera, QR App...) rồi thử lại',
        'Đóng',
        { duration: 4000 }
      );
    }

    this.stopScanning();
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



  onScanStart(stream: MediaStream) {
    console.log('[ZXING] stream started');
    this.currentStream = stream;
  }

  ngOnDestroy(): void {
    this.stopScanning();
    this.locationsLoaded = false;
  }

  performScan(): void {
    const scannedCode = this.scanPallet.trim().toUpperCase();
    const username = this.authService.getUsername();
    const resolvedLocation = this.findLocationByScannedCode(this.scanLocation);

    if (!resolvedLocation) {
      this.playAudio('assets/audio/beep_warning.mp3');
      this.dialog.open(AlertDialogComponent, { data: 'Mã kho không tồn tại trong danh sách location!' });
      this.resetScanInputs();
      return;
    }
    const locationId = resolvedLocation.id;
    const locationCode = resolvedLocation.code;

    const isPalletAllowed = this.allowedPalletCodes.some(
      (c) => (c || '').trim().toUpperCase() === scannedCode
    );
    const isBoxAllowed = this.allowedBoxCodes.some(
      (c) => (c || '').trim().toUpperCase() === scannedCode
    );

    if (!isPalletAllowed && !isBoxAllowed) {
      this.playAudio('assets/audio/beep_warning.mp3');
      const message = this.scanMode === 'single'
        ? `Mã này không thuộc pallet ${this.targetPalletCode}!`
        : 'Mã này không có trong danh sách yêu cầu nhập!';
      this.dialog.open(AlertDialogComponent, { data: message });
      this.resetScanInputs();
      return;
    }

    const pallets = this.importRequirementInfo.list_pallet || [];

    if (this.selectedMode === 'pallet') {
      this.scanPalletMode(scannedCode, locationId, locationCode, pallets, username);
    } else {
      this.scanBoxMode(scannedCode, locationId, locationCode, pallets, username);
    }
  }

  scanPalletMode(code: string, locationId: number, locationCode: string, pallets: any[], username: string): void {
    const palletInfo = pallets.find((p: any) => p.serial_pallet === code);

    if (!palletInfo) {
      this.playAudio('assets/audio/beep_warning.mp3');
      this.dialog.open(AlertDialogComponent, { data: 'Pallet không tồn tại!' });
      this.resetScanInputs();
      return;
    }

    // Kiểm tra đã scan chưa (check trong scannedPallets)
    const existing = this.scannedPallets.find(item =>
      item.serialPallet?.toUpperCase() === code
    );

    if (existing) {
      const existingLocId = Number(existing.locationId) || 0;
      const newLocId = Number(locationId);
      const existingLocCode = this.displayLocationCode(existing);
      const hasValidExistingLocation = this.hasValidScanLocation(existing);

      if (!hasValidExistingLocation) {
        this.applyScannedLocation(existing, { id: locationId, code: locationCode });
        existing.timeChecked = new Date().toISOString();
        existing.scanBy = username;
        existing.confirmed = false;
        this.updatePalletPagination();
        this.playAudio('assets/audio/successed-295058.mp3');
        this.snackBar.open('✓ Scan pallet thành công!', '', { duration: 2000 });
        this.resetScanInputs();
        return;
      }

      this.playAudio('assets/audio/beep_warning.mp3');

      if (existingLocId === newLocId) {
        this.dialog.open(AlertDialogComponent, {
          data: `Pallet này đã được scan vào kho ${existingLocCode}.`,
        });
      } else {
        this.applyScannedLocation(existing, { id: locationId, code: locationCode });
        existing.timeChecked = new Date().toISOString();
        existing.scanBy = username;
        existing.confirmed = false;
        this.updatePalletPagination();
        this.snackBar.open(
          `✓ Đã cập nhật kho từ ${existingLocCode} sang ${locationCode}!`,
          '',
          { duration: 2500 }
        );
      }

      this.resetScanInputs();
      return;
    }

    // **SỬA LOGIC KIỂM TRA ĐỦ SỐ LƯỢNG CHO MODE SINGLE**
    if (this.scanMode === 'single') {
      // Trong mode single, CHỈ ĐƯỢC SCAN 1 PALLET (pallet được chọn)
      if (this.scannedPallets.length >= 1) {
        this.playAudio('assets/audio/beep_warning.mp3');
        this.dialog.open(AlertDialogComponent, {
          data: 'Bạn đang ở chế độ scan đơn. Chỉ được scan 1 pallet!'
        });
        this.resetScanInputs();
        return;
      }

      // Kiểm tra có đúng pallet được chọn không
      if (palletInfo.id !== this.targetPalletId) {
        this.playAudio('assets/audio/beep_warning.mp3');
        this.dialog.open(AlertDialogComponent, {
          data: `Pallet này không phải là pallet ${this.targetPalletCode}!`
        });
        this.resetScanInputs();
        return;
      }
    }

    // Tạo scanned pallet mới
    const newScannedPallet: ScannedPallet = {
      id: palletInfo.id,
      serialPallet: palletInfo.serial_pallet,
      numBoxInPallet: palletInfo.num_box_per_pallet,
      totalQuantityInPallet: palletInfo.total_quantity,
      quantityPerBox: palletInfo.quantity_per_box,
      quantityImported: palletInfo.total_quantity,
      locationId: locationId,
      locationCode: locationCode,
      poNumber: palletInfo.po_number || '',
      customerName: palletInfo.customer_name || '',
      itemNoSku: palletInfo.item_no_sku || '',
      dateCode: palletInfo.date_code || '',
      productionDecisionNumber: palletInfo.production_decision_number || '',
      note: palletInfo.note || '',
      scanStatus: 'Đã scan',
      scanBy: username,
      timeChecked: new Date().toISOString(),
      listBox: palletInfo.list_box || [],
      sapCode: this.importRequirementInfo?.inventory_code || '',
      name: this.importRequirementInfo?.inventory_name || '',
      lot: this.importRequirementInfo?.lot_number || '',
      confirmed: false,
    };

    this.scannedPallets.unshift(newScannedPallet);
    this.updatePalletPagination();
    this.activeTab = 'pallet';
    this.playAudio('assets/audio/successed-295058.mp3');

    const message = this.scanMode === 'single'
      ? '✓ Scan pallet thành công!'
      : '✓ Scan pallet thành công!';

    this.snackBar.open(message, '', { duration: 2000 });
    this.resetScanInputs();
  }

  scanBoxMode(code: string, locationId: number, locationCode: string, pallets: any[], username: string): void {
    let boxInfo: any = null;
    let palletInfo: any = null;

    // **THÊM LỌC THEO MODE SINGLE**
    const palletsToSearch = this.scanMode === 'single' && this.targetPalletId
      ? pallets.filter(p => p.id === this.targetPalletId)
      : pallets;

    for (const pallet of palletsToSearch) {
      const box = (pallet.list_box || []).find(
        (b: any) => (b.box_code || '').trim().toUpperCase() === code
      );
      if (box) {
        palletInfo = pallet;
        boxInfo = box;
        break;
      }
    }

    if (!boxInfo) {
      this.playAudio('assets/audio/beep_warning.mp3');
      const message = this.scanMode === 'single'
        ? `Thùng này không thuộc pallet ${this.targetPalletCode}!`
        : 'Thùng không tồn tại!';
      this.dialog.open(AlertDialogComponent, { data: message });
      this.resetScanInputs();
      return;
    }

    // Kiểm tra trùng
    const existing = this.scannedBoxes.find(item =>
      item.boxCode.toUpperCase() === code
    );

    if (existing) {
      const existingLocId = Number(existing.locationId) || 0;
      const newLocId = Number(locationId);
      const existingLocCode = this.displayLocationCode(existing);
      const hasValidExistingLocation = this.hasValidScanLocation(existing);

      if (!hasValidExistingLocation) {
        this.applyScannedLocation(existing, { id: locationId, code: locationCode });
        existing.timeChecked = new Date().toISOString();
        existing.scanBy = username;
        existing.confirmed = false;
        this.updateBoxPagination();
        this.playAudio('assets/audio/successed-295058.mp3');
        this.snackBar.open('✓ Scan thùng thành công!', '', { duration: 2000 });
        this.resetScanInputs();
        return;
      }

      this.playAudio('assets/audio/beep_warning.mp3');

      if (existingLocId === newLocId) {
        this.dialog.open(AlertDialogComponent, {
          data: `Thùng này đã được scan vào kho ${existingLocCode}.`,
        });
      } else {
        this.applyScannedLocation(existing, { id: locationId, code: locationCode });
        existing.timeChecked = new Date().toISOString();
        existing.scanBy = username;
        existing.confirmed = false;
        this.updateBoxPagination();
        this.snackBar.open(
          `✓ Đã cập nhật kho từ ${existingLocCode} sang ${locationCode}!`,
          '',
          { duration: 2500 }
        );
      }

      this.resetScanInputs();
      return;
    }

    const isLoose = !palletInfo.serial_pallet || palletInfo.serial_pallet.trim() === '';

    const newScannedBox: ScannedBox = {
      id: boxInfo.id,
      boxCode: boxInfo.box_code,
      quantity: boxInfo.quantity || 0,
      quantityImported: boxInfo.quantity || 0,
      locationId: locationId,
      locationCode: locationCode,
      note: boxInfo.note || '',
      serialPallet: palletInfo.serial_pallet || '',
      isLooseBox: isLoose,
      scanBy: username,
      timeChecked: new Date().toISOString(),
      sapCode: this.importRequirementInfo?.inventory_code || '',
      name: this.importRequirementInfo?.inventory_name || '',
      lot: this.importRequirementInfo?.lot_number || '',
      confirmed: false,
    };

    this.scannedBoxes.unshift(newScannedBox);
    this.updateBoxPagination();
    this.activeTab = 'box';
    this.playAudio('assets/audio/successed-295058.mp3');

    const looseText = isLoose ? ' (Thùng lẻ)' : '';
    this.snackBar.open(`✓ Scan thùng thành công!${looseText}`, '', { duration: 2000 });
    this.resetScanInputs();
  }

  playAudio(file: string): void {
    const audio = new Audio(file);
    audio.play();
  }

  resetScanInputs(): void {
    this.scanPallet = '';
    this.scanLocation = '';
    setTimeout(() => this.palletInput?.nativeElement?.focus(), 100);
  }

  applyGlobalQuantityPallet(): void {
    if (this.globalQuantityPallet == null || this.globalQuantityPallet < 0) return;

    this.scannedPallets.forEach((item) => {
      if (!item.confirmed) {
        item.quantityImported = this.globalQuantityPallet!;
      }
    });

    this.snackBar.open('Đã áp dụng số lượng cho tất cả pallet!', '', { duration: 1500 });
  }

  applyGlobalQuantityBox(): void {
    if (this.globalQuantityBox == null || this.globalQuantityBox < 0) return;

    this.scannedBoxes.forEach((item) => {
      if (!item.confirmed) {
        item.quantityImported = this.globalQuantityBox!;
      }
    });

    this.snackBar.open('Đã áp dụng số lượng cho tất cả thùng!', '', { duration: 1500 });
  }

  confirmScannedItems(): void {
    const totalScanned = this.scannedPallets.length + this.scannedBoxes.length;
    if (totalScanned === 0) {
      this.snackBar.open('Chưa có dữ liệu để xác nhận!', 'Đóng', { duration: 3000 });
      return;
    }

    const invalidPallets = this.scannedPallets.filter((item) => !this.hasValidScanLocation(item));
    const invalidBoxes = this.scannedBoxes.filter((item) => !this.hasValidScanLocation(item));
    if (invalidPallets.length > 0 || invalidBoxes.length > 0) {
      this.snackBar.open(
        'Có mục chưa có kho hợp lệ. Vui lòng scan lại mã kho từ danh sách location.',
        'Đóng',
        { duration: 4000, panelClass: ['snackbar-error'] }
      );
      return;
    }

    const username = this.authService.getUsername();
    const apiCalls: any[] = [];

    // ============================================
    // PAYLOAD CHO PALLET API
    // ============================================
    if (this.scannedPallets.length > 0) {
      const palletPayload = {
        updates: this.scannedPallets.map(item => ({
          id: item.id,
          serial_pallet: item.serialPallet,
          quantity_per_box: item.quantityPerBox || 0,
          num_box_per_pallet: item.numBoxInPallet || 0,
          total_quantity: item.quantityImported, // Sử dụng số lượng đã nhập
          po_number: item.poNumber || '',
          customer_name: item.customerName || '',
          production_decision_number: item.productionDecisionNumber || '',
          item_no_sku: item.itemNoSku || '',
          date_code: item.dateCode || '',
          note: item.note || '',
          location_id: Number(item.locationId),
          scan_by: username,
          scan_time: new Date().toISOString(),
          scan_status: true,
          confirmed: false,
        }))
      };

      // Gọi API update pallet
      apiCalls.push(
        this.nhapKhoService.updatePalletInfo(palletPayload)
      );
    }

    // ============================================
    // PAYLOAD CHO BOX API (Container Inventories)
    // ============================================
    if (this.scannedBoxes.length > 0) {
      const boxPayload = {
        updates: this.scannedBoxes.map(item => ({
          id: item.id,
          inventory_identifier: item.boxCode,
          quantity_imported: item.quantityImported,
          location_id: Number(item.locationId),
          confirmed: false,
          scan_status: true,
          scan_by: username,
          scan_time: new Date().toISOString()
        }))
      };

      // Gọi API update box
      apiCalls.push(
        this.nhapKhoService.updateContainerInventories(boxPayload)
      );
    }

    // ============================================
    // GỌI API SONG SONG VỚI FORKJOIN
    // ============================================
    if (apiCalls.length === 0) {
      this.snackBar.open('Không có dữ liệu để cập nhật!', 'Đóng', { duration: 3000 });
      return;
    }

    this.isLoading = true;

    forkJoin(apiCalls).subscribe({
      next: (responses) => {
        console.log('Cập nhật thành công:', responses);

        // Đánh dấu đã confirm
        this.scannedPallets.forEach(item => item.confirmed = true);
        this.scannedBoxes.forEach(item => item.confirmed = true);

        // Thông báo thành công
        this.snackBar.open('✓ Xác nhận thành công!', '', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });

        // Chuyển về trang phê duyệt
        setTimeout(() => {
          this.router.navigate(['/kho-thanh-pham/nhap-kho-sx/phe-duyet/', this.requestId]);
        }, 1500);
      },
      error: (err) => {
        console.error('Lỗi xác nhận:', err);

        // Xử lý lỗi chi tiết
        let errorMessage = 'Lỗi khi xác nhận! Vui lòng thử lại.';

        if (err.error && err.error.message) {
          errorMessage = err.error.message;
        } else if (err.message) {
          errorMessage = err.message;
        }

        this.snackBar.open(errorMessage, 'Đóng', {
          duration: 5000,
          panelClass: ['snackbar-error']
        });

        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  // Pallet Pagination
  updatePalletPagination(): void {
    this.totalItemsPallet = this.scannedPallets.length;
    this.totalPagesPallet = Math.ceil(this.totalItemsPallet / this.pageSizePallet);
    const startIndex = (this.currentPagePallet - 1) * this.pageSizePallet;
    const endIndex = startIndex + this.pageSizePallet;
    this.pagedPallets = this.scannedPallets.slice(startIndex, endIndex);
  }

  onPageChangePallet(page: number): void {
    if (page < 1 || page > this.totalPagesPallet) return;
    this.currentPagePallet = page;
    this.updatePalletPagination();
  }

  onPageSizeChangePallet(size: number): void {
    this.pageSizePallet = size;
    this.currentPagePallet = 1;
    this.updatePalletPagination();
  }

  // Box Pagination
  updateBoxPagination(): void {
    this.totalItemsBox = this.scannedBoxes.length;
    this.totalPagesBox = Math.ceil(this.totalItemsBox / this.pageSizeBox);
    const startIndex = (this.currentPageBox - 1) * this.pageSizeBox;
    const endIndex = startIndex + this.pageSizeBox;
    this.pagedBoxes = this.scannedBoxes.slice(startIndex, endIndex);
  }

  onPageChangeBox(page: number): void {
    if (page < 1 || page > this.totalPagesBox) return;
    this.currentPageBox = page;
    this.updateBoxPagination();
  }

  onPageSizeChangeBox(size: number): void {
    this.pageSizeBox = size;
    this.currentPageBox = 1;
    this.updateBoxPagination();
  }

  onCancel(): void {
    this.router.navigate(['/kho-thanh-pham/nhap-kho-sx/phe-duyet/', this.requestId]);
  }

  private mapPalletToScannedPallet(pallet: any): ScannedPallet {
    // Xác định scan status
    let scanStatus: 'Đã scan' | 'Chưa scan' = 'Chưa scan';
    if (pallet.scan_status === true || pallet.scan_status === 'Đã scan') {
      scanStatus = 'Đã scan';
    }

    // Xác định confirmed
    const confirmed = pallet.confirmed === true || scanStatus === 'Đã scan';

    const rawLocationId = Number(pallet.location_id) || 0;
    const codeFromMinimal = this.getLocationCode(rawLocationId);

    return {
      id: pallet.id,
      serialPallet: pallet.serial_pallet,
      numBoxInPallet: pallet.num_box_per_pallet || 0,
      totalQuantityInPallet: pallet.total_quantity || 0,
      quantityPerBox: pallet.quantity_per_box || 0,
      // Ưu tiên quantity_imported từ API, fallback về total_quantity
      quantityImported: pallet.quantity_imported || pallet.total_quantity || 0,
      locationId: codeFromMinimal ? rawLocationId : 0,
      locationCode: codeFromMinimal || this.resolveLocationCode(0, pallet.location_code),
      poNumber: pallet.po_number || '',
      customerName: pallet.customer_name || '',
      itemNoSku: pallet.item_no_sku || '',
      dateCode: pallet.date_code || '',
      productionDecisionNumber: pallet.production_decision_number || '',
      note: pallet.note || '',
      scanStatus: scanStatus,
      scanBy: pallet.scan_by || '',
      timeChecked: pallet.scan_time || pallet.updated_date || '',
      listBox: pallet.list_box || [],
      sapCode: this.importRequirementInfo?.inventory_code || '',
      name: this.importRequirementInfo?.inventory_name || '',
      lot: this.importRequirementInfo?.lot_number || '',
      confirmed: confirmed,
    };
  }
}