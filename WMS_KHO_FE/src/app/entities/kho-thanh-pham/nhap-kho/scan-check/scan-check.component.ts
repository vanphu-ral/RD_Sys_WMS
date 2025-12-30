import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NhapKhoService, PushInventoryPayload } from '../service/nhap-kho.service';
import { AuthService } from '../../../../services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { AlertDialogComponent } from '../dialog/alert-dialog.component';
import { BarcodeFormat } from '@zxing/library';
import { forkJoin } from 'rxjs';
import { ZXingScannerComponent } from '@zxing/ngx-scanner';

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

  @ViewChild('palletInput') palletInput!: ElementRef;
  @ViewChild('locationInput') locationInput!: ElementRef;
  @ViewChild(ZXingScannerComponent) scanner!: ZXingScannerComponent;

  locations: { id: number; code: string }[] = [];
  currentDevice: MediaDeviceInfo | undefined = undefined;
  availableDevices: MediaDeviceInfo[] = [];
  formats: BarcodeFormat[] = [
    BarcodeFormat.QR_CODE,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8
  ];
  hasPermission: boolean = false;

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

    this.route.params.subscribe((params) => {
      this.requestId = +params['id'];
    });

    this.route.queryParams.subscribe((queryParams) => {
      this.scanMode = queryParams['mode'] || 'all';
      this.targetPalletId = queryParams['palletId'] ? +queryParams['palletId'] : undefined;
      this.targetPalletCode = queryParams['palletCode'] || '';
    });

    if (this.requestId) {
      this.loadLocationCode();
      this.loadImportRequirementInfo();
    }
  }

  checkIfMobile(): void {
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth <= 768;
  }

  loadLocationCode(): void {
    this.nhapKhoService.getMinimalLocations().subscribe({
      next: (res) => {
        this.locations = res;
      },
      error: (err) => {
        console.error('Lỗi khi load locations:', err);
        this.snackBar.open('Không thể tải danh sách location!', 'Đóng', { duration: 3000 });
      }
    });
  }

  getLocationCode(locationId: number): string {
    const loc = this.locations.find(l => l.id === locationId);
    return loc ? loc.code : 'N/A';
  }

  loadImportRequirementInfo(): void {
    if (!this.requestId) return;

    this.isLoading = true;
    this.nhapKhoService.getImportRequirement(this.requestId).subscribe({
      next: (res) => {
        this.importRequirementInfo = res.general_info || res.data?.general_info;

        if (!this.importRequirementInfo) {
          this.snackBar.open('Không tìm thấy thông tin yêu cầu nhập!', 'Đóng', { duration: 3000 });
          this.router.navigate(['/kho-thanh-pham/nhap-kho-sx']);
          return;
        }

        const pallets = this.importRequirementInfo.list_pallet || [];

        // Build allowed codes
        if (this.scanMode === 'single' && this.targetPalletCode) {
          const targetPallet = pallets.find((p: any) => p.serial_pallet === this.targetPalletCode);
          if (!targetPallet) {
            this.snackBar.open('Không tìm thấy pallet cần scan!', 'Đóng', { duration: 3000 });
            this.router.navigate(['/kho-thanh-pham/nhap-kho-sx/phe-duyet', this.requestId]);
            return;
          }
          this.allowedPalletCodes = [targetPallet.serial_pallet].filter(c => c);
          this.allowedBoxCodes = (targetPallet.list_box || []).map((b: any) => b.box_code);
        } else {
          this.allowedPalletCodes = pallets
            .map((p: any) => p.serial_pallet)
            .filter((c: string) => c && c.trim());
          this.allowedBoxCodes = pallets.flatMap((p: any) =>
            (p.list_box || []).map((b: any) => b.box_code)
          );
        }

        // Load scanned items (nếu có trong DB)
        this.loadScannedItemsFromAPI(pallets);

        // Hiển thị thông báo nếu có dữ liệu đã scan
        if (this.scannedPallets.length > 0 || this.scannedBoxes.length > 0) {
          const message = `Đã tải ${this.scannedPallets.length} pallet và ${this.scannedBoxes.length} thùng đã scan`;
          this.snackBar.open(message, '', {
            duration: 3000,
            panelClass: ['snackbar-success']
          });
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Lỗi khi tải thông tin:', err);
        this.snackBar.open('Không thể tải thông tin!', 'Đóng', { duration: 3000 });
        this.isLoading = false;
      },
    });
  }

  loadScannedItemsFromAPI(pallets: any[]): void {
    console.log('Loading scanned items from API...', pallets);

    // ============================================
    // LOAD PALLETS ĐÃ SCAN
    // ============================================
    pallets.forEach((p: any) => {
      // Kiểm tra pallet đã scan: scan_status = true hoặc "Đã scan"
      const isScanned = p.scan_status === true ||
        p.scan_status === 'Đã scan' ||
        p.confirmed === true;

      // Chỉ load pallet có serial_pallet (không rỗng)
      if (isScanned && p.serial_pallet && p.serial_pallet.trim()) {
        const scannedPallet = this.mapPalletToScannedPallet(p);
        this.scannedPallets.push(scannedPallet);
        console.log('Loaded pallet:', scannedPallet.serialPallet);
      }
    });

    // ============================================
    // LOAD BOXES ĐÃ SCAN
    // ============================================
    pallets.forEach((p: any) => {
      const palletSerial = p.serial_pallet || '';
      const isLoosePallet = !palletSerial || palletSerial.trim() === '';

      (p.list_box || []).forEach((box: any) => {
        // Kiểm tra box đã scan
        const isBoxScanned = box.scan_status === true ||
          box.scan_status === 'Đã scan' ||
          box.confirmed === true;

        if (isBoxScanned) {
          const scannedBox: ScannedBox = {
            id: box.id,
            boxCode: box.box_code,
            quantity: box.quantity || 0,
            quantityImported: box.quantity_imported || box.quantity || 0, // Ưu tiên quantity_imported từ API
            locationId: box.location_id || 0,
            locationCode: box.location_code || '',
            note: box.note || '',
            serialPallet: palletSerial,
            isLooseBox: isLoosePallet, // Đánh dấu thùng lẻ nếu không có pallet
            scanBy: box.scan_by || '',
            timeChecked: box.scan_time || box.updated_date || '',
            sapCode: this.importRequirementInfo?.inventory_code || '',
            name: this.importRequirementInfo?.inventory_name || '',
            lot: this.importRequirementInfo?.lot_number || '',
            confirmed: box.confirmed || false,
          };

          this.scannedBoxes.push(scannedBox);
          console.log('Loaded box:', scannedBox.boxCode, isLoosePallet ? '(Thùng lẻ)' : '');
        }
      });
    });

    // Sắp xếp theo thời gian mới nhất
    this.scannedPallets.sort((a, b) => {
      const timeA = new Date(a.timeChecked || 0).getTime();
      const timeB = new Date(b.timeChecked || 0).getTime();
      return timeB - timeA; // Mới nhất lên đầu
    });

    this.scannedBoxes.sort((a, b) => {
      const timeA = new Date(a.timeChecked || 0).getTime();
      const timeB = new Date(b.timeChecked || 0).getTime();
      return timeB - timeA; // Mới nhất lên đầu
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

  async openCameraScanner(field: 'pallet' | 'location'): Promise<void> {
    if (!this.selectedMode && field === 'pallet') {
      this.snackBar.open('Vui lòng chọn mode scan!', 'Đóng', { duration: 3000 });
      return;
    }

    this.scannerActive = field;
    this.isScanning = true;

    // Đợi UI render xong rồi khởi tạo camera
    setTimeout(() => {
      this.initCamera();
    }, 100);
  }

  initCamera(): void {
    console.log('[Camera] Initializing camera...');

    // Cho phép ZXingScanner tự xin quyền và chọn camera
    this.hasPermission = true;

    // Enumerate devices để ưu tiên back camera
    navigator.mediaDevices.enumerateDevices()
      .then((devices) => {
        this.availableDevices = devices.filter(d => d.kind === 'videoinput');

        console.log('[Camera] Available cameras:', this.availableDevices);

        if (this.availableDevices.length === 0) {
          console.warn('[Camera] No cameras found');
          return;
        }

        // Ưu tiên camera sau (back camera)
        const backCamera = this.availableDevices.find(d =>
          d.label.toLowerCase().includes('back') ||
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('environment')
        );

        // Nếu không tìm thấy back camera, dùng camera cuối cùng
        this.currentDevice = backCamera || this.availableDevices[this.availableDevices.length - 1];

        console.log('[Camera] Selected camera:', this.currentDevice?.label || 'default');
      })
      .catch((err) => {
        console.error('[Camera] Error enumerating devices:', err);
        // Không cần hiện lỗi ở đây, để ZXingScanner tự xử lý
      });
  }

  onCamerasNotFound(): void {
    console.error('[Camera] No cameras found');
    this.snackBar.open('Không tìm thấy camera trên thiết bị!', 'Đóng', { duration: 3000 });
    this.stopScanning();
  }

  onPermissionDenied(): void {
    console.error('[Camera] Camera permission denied');
    this.hasPermission = false;

    const userAgent = navigator.userAgent.toLowerCase();
    let instruction = '';

    if (userAgent.includes('android')) {
      instruction = ' Android: Cài đặt → Ứng dụng → Trình duyệt → Quyền → Bật Camera.';
    } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      instruction = ' iOS: Cài đặt → Safari → Camera → Cho phép.';
    }

    this.snackBar.open(
      'Cần cấp quyền camera!' + (instruction ? ' ' + instruction : ''),
      'Đóng',
      { duration: 6000 }
    );

    this.stopScanning();
  }

  onCameraError(error: any): void {
    console.error('[Camera] Error:', error?.name, error?.message);

    let errorMessage = 'Lỗi khi mở camera!';

    // Chỉ xử lý các lỗi quan trọng
    if (error?.name === 'NotAllowedError') {
      errorMessage = 'Bạn đã từ chối quyền camera. Vui lòng cho phép và thử lại.';
    } else if (error?.name === 'NotFoundError') {
      errorMessage = 'Không tìm thấy camera!';
    } else if (error?.name === 'NotReadableError') {
      errorMessage = 'Camera đang được sử dụng bởi ứng dụng khác. Vui lòng đóng và thử lại.';
    }

    this.snackBar.open(errorMessage, 'Đóng', { duration: 4000 });
    this.stopScanning();
  }

  onScanSuccess(decodedText: string): void {
    const code = decodedText.trim();

    // Chống scan trùng
    if (code === this.lastScannedCode) return;
    this.lastScannedCode = code;

    // Phân loại mã
    if (code.startsWith('P')) {
      this.scanPallet = code;
      this.snackBar.open('✓ Đã quét pallet!', '', { duration: 1500 });
    } else if (code.startsWith('B')) {
      this.scanPallet = code;
      this.snackBar.open('✓ Đã quét thùng!', '', { duration: 1500 });
    } else {
      this.scanLocation = code;
      this.snackBar.open('✓ Đã quét location!', '', { duration: 1500 });
    }

    // Nếu đã có đủ pallet/thùng và location → thực hiện scan
    if (this.scanPallet && this.scanLocation) {
      this.stopScanning();
      setTimeout(() => this.performScan(), 100);
    }
  }

  stopScanning(): void {
    console.log('[Camera] Stopping...');

    this.lastScannedCode = null;
    this.isScanning = false;
    this.scannerActive = null;
    this.hasPermission = false;

    // Cleanup scanner
    if (this.scanner) {
      try {
        this.scanner.reset();
        console.log('[Camera] Stopped successfully');
      } catch (e) {
        console.error('[Camera] Error stopping:', e);
      }
    }
  }

  ngOnDestroy(): void {
    this.stopScanning();
  }

  performScan(): void {
    const scannedCode = this.scanPallet.trim().toUpperCase();
    const username = this.authService.getUsername();
    const locationCode = this.scanLocation.trim().toUpperCase();
    const location = this.locations.find(l => l.code.toUpperCase() === locationCode);

    if (!location) {
      this.playAudio('assets/audio/beep_warning.mp3');
      this.dialog.open(AlertDialogComponent, { data: 'Location không tồn tại!' });
      this.resetScanInputs();
      return;
    }
    const locationId = location.id;

    const isPalletAllowed = this.allowedPalletCodes.includes(scannedCode);
    const isBoxAllowed = this.allowedBoxCodes.includes(scannedCode);

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
      this.playAudio('assets/audio/beep_warning.mp3');

      // Cho phép cập nhật location nếu khác
      if (existing.locationId !== locationId) {
        const dialogRef = this.dialog.open(AlertDialogComponent, {
          data: `Pallet này đã được scan vào kho ${existing.locationCode}. Bạn có muốn cập nhật sang kho ${locationCode}?`
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            existing.locationId = locationId;
            existing.locationCode = locationCode;
            existing.timeChecked = new Date().toISOString();
            this.snackBar.open('✓ Đã cập nhật location cho pallet!', '', { duration: 2000 });
          }
        });
      } else {
        this.dialog.open(AlertDialogComponent, { data: 'Pallet này đã được scan!' });
      }

      this.resetScanInputs();
      return;
    }

    if (this.scanMode === 'single' && this.scannedPallets.length >= 1) {
      this.playAudio('assets/audio/beep_warning.mp3');
      this.dialog.open(AlertDialogComponent, { data: 'Đã đủ số lượng pallet cần scan!' });
      this.resetScanInputs();
      return;
    }

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
    this.snackBar.open('✓ Scan pallet thành công!', '', { duration: 2000 });
    this.resetScanInputs();
  }

  scanBoxMode(code: string, locationId: number, locationCode: string, pallets: any[], username: string): void {
    let boxInfo: any = null;
    let palletInfo: any = null;

    for (const pallet of pallets) {
      const box = (pallet.list_box || []).find((b: any) => b.box_code === code);
      if (box) {
        palletInfo = pallet;
        boxInfo = box;
        break;
      }
    }

    if (!boxInfo) {
      this.playAudio('assets/audio/beep_warning.mp3');
      this.dialog.open(AlertDialogComponent, { data: 'Thùng không tồn tại!' });
      this.resetScanInputs();
      return;
    }

    // Kiểm tra trùng
    const existing = this.scannedBoxes.find(item =>
      item.boxCode.toUpperCase() === code
    );

    if (existing) {
      this.playAudio('assets/audio/beep_warning.mp3');

      // Cho phép cập nhật location nếu khác
      if (existing.locationId !== locationId) {
        const dialogRef = this.dialog.open(AlertDialogComponent, {
          data: `Thùng này đã được scan vào kho ${existing.locationCode}. Bạn có muốn cập nhật sang kho ${locationCode}?`
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            existing.locationId = locationId;
            existing.locationCode = locationCode;
            existing.timeChecked = new Date().toISOString();
            this.snackBar.open('✓ Đã cập nhật location cho thùng!', '', { duration: 2000 });
          }
        });
      } else {
        this.dialog.open(AlertDialogComponent, { data: 'Thùng này đã được scan!' });
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
    this.snackBar.open(`✓ Scan thùng thành công!${isLoose ? ' (Thùng lẻ)' : ''}`, '', { duration: 2000 });
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
          scan_status: true, // Đã scan
          confirmed: true,   // Đã confirm
          location_id: item.locationId, // Thêm location_id nếu API cần
          scan_by: username,
          scan_time: new Date().toISOString()
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
          inventory_identifier: item.boxCode, // Box code là identifier
          quantity_imported: item.quantityImported, // Số lượng đã nhập
          confirmed: true, // Đã confirm
          location_id: item.locationId, // Location
          scan_status: true, // Đã scan
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

    return {
      id: pallet.id,
      serialPallet: pallet.serial_pallet,
      numBoxInPallet: pallet.num_box_per_pallet || 0,
      totalQuantityInPallet: pallet.total_quantity || 0,
      quantityPerBox: pallet.quantity_per_box || 0,
      // Ưu tiên quantity_imported từ API, fallback về total_quantity
      quantityImported: pallet.quantity_imported || pallet.total_quantity || 0,
      locationId: pallet.location_id || 0,
      locationCode: pallet.location_code || '',
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