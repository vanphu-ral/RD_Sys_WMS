import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { QuanLyKhoService } from '../service/quan-ly-kho.service.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CameraDevice, Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-scan-check-dialog',
  templateUrl: './scan-check-dialog.component.html',
  styleUrls: ['./scan-check-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatProgressBarModule,
    MatTooltipModule, // Thêm import này
  ],
})
export class ScanCheckDialogComponent implements OnInit, OnDestroy {
  isPalletMode = true;
  mode: 'check' | 'update' | 'transfer' = 'check';
  selectedScanMode: 'pallet' | 'box' | null = null;
  isInfoVisible = false;
  isBoxMode = !this.isPalletMode;

  // Loader
  isLoading = false;

  palletScan = '';
  locationScan = '';
  targetWarehouse = '';
  updatedQuantity: number | undefined;
  scannedItems: {
    code: string;
    name: string;
    location: string;
    quantity: string;
    scannedAt: string;
    scannedBy: string;
  }[] = [];
  productInfo = {
    maSanPham: '',
    maThung: '',
    capNhatBoi: '',
    tenSanPham: '',
    location: '',
    scanBoi: '',
    tenKhachHang: '',
    area: '',
    soLuongGoc: '',
    maKhachHang: '',
    trangThai: '',
    soLuongHienTai: '',
    maPallet: '',
    ngayCapNhat: '',
    po: '',
    lot: '',
    partNumber: '',
    ghiChu: '',
    ngaySanXuat: '',
    hanSuDung: '',
  };

  locations: { id: number; code: string }[] = [];

  // ============================================
  // CAMERA SCAN VARIABLES
  // ============================================
  isMobile: boolean = false;
  isScanning: boolean = false;
  scannerActive: 'pallet' | 'location' | null = null;
  qrScanner?: Html5Qrcode;
  selectedCameraId: string | null = null;
  availableCameras: CameraDevice[] = [];
  lastScannedCode: string | null = null;
  debugLogs: string[] = [];

  scanStep: 'pallet' | 'location' = 'pallet';
  isAutoScanMode = false;
  isPausedForTransition = false;

  @ViewChild('palletInput') palletInput!: ElementRef;
  @ViewChild('locationInput') locationInput!: ElementRef;
  private statusMap: Record<string, string> = { available: 'Có sẵn', reserved: 'Đã giữ', pending: 'Chờ xử lý', damaged: 'Hỏng', unavailable: 'Hết hàng', };

  constructor(
    public dialogRef: MatDialogRef<ScanCheckDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private snackBar: MatSnackBar,
    private http: HttpClient,
    private quanLyKhoService: QuanLyKhoService
  ) { }

  ngOnInit(): void {
    this.checkIfMobile();
    this.mode = this.data.mode || 'check';
    this.updatedQuantity = parseInt(this.productInfo.soLuongHienTai);

    if (this.mode === 'transfer') {
      this.quanLyKhoService.getLocations().subscribe({
        next: (data) => {
          this.locations = data;
        },
        error: (err) => {
          console.error('Lỗi khi lấy danh sách kho:', err);
          this.snackBar.open('Không lấy được danh sách kho!', 'Đóng', {
            duration: 3000,
            panelClass: ['snackbar-error'],
          });
        },
      });
    }
  }

  ngOnDestroy(): void {
    this.stopScanning();
  }

  // ============================================
  // CAMERA FUNCTIONS
  // ============================================
  checkIfMobile(): void {
    this.isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth <= 768;
  }

  async openCameraScanner(field: 'pallet' | 'location') {
    this.scannerActive = field;
    this.scanStep = field;
    this.isScanning = true;
    this.isAutoScanMode = false;
    this.isPausedForTransition = false;
    this.logDebug('=== Open Scanner ===');

    try {
      if (this.qrScanner) {
        try {
          await this.qrScanner.stop();
          await this.qrScanner.clear();
          this.logDebug('Old scanner stopped');
        } catch (e) {
          this.logDebug('Stop old scanner failed: ' + e);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      this.qrScanner = new Html5Qrcode('qr-reader');
      this.logDebug('Scanner created');

      const cameras = await Html5Qrcode.getCameras();
      this.logDebug(`Found ${cameras.length} cameras`);
      this.logDebug(
        JSON.stringify(cameras.map((c) => ({ id: c.id, label: c.label })))
      );

      if (!cameras || cameras.length === 0) {
        this.snackBar.open('Không tìm thấy camera', 'Đóng', { duration: 3000 });
        this.stopScanning();
        return;
      }

      this.availableCameras = cameras;

      const backCameras = cameras.filter(
        (c) =>
          (c.label || '').toLowerCase().includes('back') ||
          (c.label || '').toLowerCase().includes('environment') ||
          (c.label || '').toLowerCase().includes('rear')
      );

      let targetCam: CameraDevice;
      if (this.selectedCameraId) {
        targetCam =
          cameras.find((c) => c.id === this.selectedCameraId) ||
          (backCameras.length > 0
            ? backCameras[backCameras.length - 1]
            : cameras[0]);
      } else {
        targetCam =
          backCameras.length > 0
            ? backCameras[backCameras.length - 1]
            : cameras[0];
      }

      this.selectedCameraId = targetCam.id;
      this.logDebug('Selected camera: ' + targetCam.label);

      await this.startScanner(targetCam.id);
    } catch (e: any) {
      this.logDebug('=== ERROR ===');
      this.logDebug('Error name: ' + (e?.name || 'unknown'));
      this.logDebug('Error message: ' + (e?.message || 'unknown'));
      this.logDebug('Error toString: ' + e?.toString());

      let errorMsg = 'Không thể mở camera!';

      if (e?.name === 'NotAllowedError' || e?.name === 'PermissionDeniedError') {
        errorMsg = 'Bạn đã từ chối quyền camera. Vui lòng cấp quyền trong Cài đặt.';
      } else if (e?.name === 'NotFoundError' || e?.name === 'DevicesNotFoundError') {
        errorMsg = 'Không tìm thấy camera trên thiết bị!';
      } else if (e?.name === 'NotReadableError' || e?.name === 'TrackStartError') {
        errorMsg = 'Camera đang được sử dụng. Vui lòng đóng ứng dụng Camera/Zalo/Banking và thử lại.';
      } else if (e?.name === 'OverconstrainedError') {
        errorMsg = 'Camera không hỗ trợ cấu hình này!';
      } else if (e?.message) {
        errorMsg = 'Lỗi: ' + e.message;
      }

      this.snackBar.open(errorMsg, 'Đóng', { duration: 5000 });
      this.stopScanning();
    }
  }

  async startScanner(cameraId: string) {
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
    };

    await this.qrScanner!.start(
      cameraId,
      config,
      (decodedText) => {
        this.logDebug('Scanned: ' + decodedText);
        this.handleHtml5Scan(decodedText);
      },
      (errorMessage) => {
        if (errorMessage && !errorMessage.includes('NotFoundException')) {
          this.logDebug('Scan error: ' + errorMessage);
        }
      }
    );

    this.logDebug('Camera started successfully!');
  }

  async switchCamera() {
    if (!this.qrScanner || this.availableCameras.length <= 1) {
      this.snackBar.open('Không có camera khác để chuyển!', '', {
        duration: 2000,
      });
      return;
    }

    try {
      this.logDebug('=== Switching Camera ===');

      const currentIndex = this.availableCameras.findIndex(
        (c) => c.id === this.selectedCameraId
      );

      const nextIndex = (currentIndex + 1) % this.availableCameras.length;
      const nextCamera = this.availableCameras[nextIndex];

      this.logDebug(
        `Switching from ${this.availableCameras[currentIndex]?.label} to ${nextCamera.label}`
      );

      await this.qrScanner.stop();
      this.logDebug('Current camera stopped');

      this.selectedCameraId = nextCamera.id;

      await new Promise((resolve) => setTimeout(resolve, 200));

      await this.startScanner(nextCamera.id);

      this.snackBar.open(`Đã chuyển sang ${nextCamera.label}`, '', {
        duration: 2000,
      });
      this.logDebug('Camera switched successfully');
    } catch (e: any) {
      this.logDebug('Switch camera error: ' + e?.message);
      this.snackBar.open('Lỗi khi chuyển camera!', 'Đóng', { duration: 3000 });

      try {
        await this.startScanner(this.selectedCameraId!);
      } catch {
        this.stopScanning();
      }
    }
  }

  handleHtml5Scan(code: string) {
    code = code.trim();

    // Bỏ qua nếu đang pause
    if (this.isPausedForTransition) {
      this.logDebug('Scanner paused, ignoring scan');
      return;
    }

    if (code === this.lastScannedCode) return;
    this.lastScannedCode = code;

    this.logDebug('Processing: ' + code);

    if (this.scannerActive === 'pallet') {
      if (code.startsWith('P') || code.startsWith('B')) {
        this.palletScan = code;
        this.playAudio('assets/audio/successed-295058.mp3');
        const type = code.startsWith('P') ? 'pallet' : 'thùng';
        this.snackBar.open(`✓ Đã quét ${type}! Vui lòng quét location...`, '', { duration: 2000 });

        if (this.mode === 'transfer') {
          // Tạm dừng scan 1.5 giây để user chuyển sang mã kho
          this.isPausedForTransition = true;
          this.scanStep = 'location';

          setTimeout(() => {
            this.scannerActive = 'location';
            this.isAutoScanMode = true;
            this.lastScannedCode = null;
            this.isPausedForTransition = false;
            this.logDebug('Scanner resumed for location scan');
          }, 2000);
        } else {
          this.stopScanning();
          setTimeout(() => this.onScanComplete(), 50);
        }
      } else {
        this.playAudio('assets/audio/beep_warning.mp3');
        this.snackBar.open('Mã không hợp lệ!', '', { duration: 2000 });
      }
    } else if (this.scannerActive === 'location') {
      this.locationScan = code;
      this.playAudio('assets/audio/successed-295058.mp3');
      this.snackBar.open('✓ Đã quét location!', '', { duration: 1000 });

      // Tạm dừng để tránh scan nhầm
      this.isPausedForTransition = true;

      setTimeout(() => {
        this.stopScanning();
        this.onScanComplete();
        this.scanStep = 'pallet';
        this.isAutoScanMode = false;
        this.isPausedForTransition = false;
      }, 500);
    }
  }

  async stopScanning() {
    this.logDebug('=== Stopping Scanner ===');

    this.isScanning = false;
    this.scannerActive = null;
    this.lastScannedCode = null;
    this.isPausedForTransition = false; // Reset pause state

    if (this.qrScanner) {
      try {
        const state = await this.qrScanner.getState();
        this.logDebug('Scanner state: ' + state);

        if (state === Html5QrcodeScannerState.SCANNING) {
          await this.qrScanner.stop();
          this.logDebug('Scanner stopped');
        }

        await this.qrScanner.clear();
        this.logDebug('Scanner cleared');
      } catch (err: any) {
        this.logDebug('Stop error: ' + (err?.message || err));
      } finally {
        this.qrScanner = undefined;
      }
    }
  }

  playAudio(file: string): void {
    const audio = new Audio(file);
    audio.play().catch((e) => console.log('Audio play failed:', e));
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

  // ============================================
  // ORIGINAL FUNCTIONS
  // ============================================
  fetchProductInfo(identifier: string): void {
    this.quanLyKhoService.getInventoryByIdentifier(identifier).subscribe({
      next: (res) => {
        const rawStatus = (res.calculated_status ?? '').toString();
        const translatedStatus = this.statusMap[rawStatus] ?? this.translateUnknownStatus(rawStatus);
        this.productInfo = {
          maSanPham: res.identifier,
          maThung: res.serial_pallet,
          capNhatBoi: res.updated_by,
          tenSanPham: res.material_name,
          location: `Location #${res.location_id}`,
          scanBoi: res.updated_by,
          tenKhachHang: '',
          area: '',
          soLuongGoc: res.initial_quantity?.toString(),
          maKhachHang: res.vendor,
          trangThai: translatedStatus,
          soLuongHienTai: res.available_quantity?.toString(),
          maPallet: res.serial_pallet,
          ngayCapNhat: new Date(res.updated_date).toLocaleDateString(),
          po: res.po,
          lot: res.lot,
          partNumber: res.part_number,
          ghiChu: res.comments,
          ngaySanXuat: new Date(res.manufacturing_date).toLocaleDateString(),
          hanSuDung: new Date(res.expiration_date).toLocaleDateString(),
        };

        this.isInfoVisible = true;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Lỗi khi lấy thông tin sản phẩm:', err);
        this.snackBar.open('Không tìm thấy thông tin sản phẩm!', 'Đóng', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
      },
    });
  }
  private translateUnknownStatus(raw: string): string {
    if (!raw) { return '' };
    const normalized = raw.toLowerCase();
    if (normalized === 'available') { return 'Có sẵn' };
    return raw;
  }
  getStatusClass(status: string | null | undefined): string {
    const s = (status ?? '').toString().trim().toLowerCase();

    const availableKeys = ['available', 'có sẵn', 'còn hàng', 'con hang'];
    const unavailableKeys = ['unavailable', 'hết hàng', 'het hang'];

    if (availableKeys.some(k => s.includes(k))) return 'status-available';
    if (unavailableKeys.some(k => s.includes(k))) return 'status-unavailable';

    // fallback: nếu không rõ, trả class trung tính (chọn unavailable hoặc thêm status-unknown)
    return 'status-unavailable';
  }
  onUpdateQuantity(): void {
    if (!this.palletScan || !this.updatedQuantity || this.updatedQuantity <= 0) {
      this.snackBar.open('Vui lòng nhập mã và số lượng tồn hợp lệ!', 'Đóng', {
        duration: 3000,
        panelClass: ['snackbar-error'],
      });
      return;
    }

    const payload = {
      available_quantity: this.updatedQuantity,
      inventory_identifier: this.palletScan,
      updated_by: 'admin',
    };

    this.quanLyKhoService.updateInventoryQuantity(payload).subscribe({
      next: () => {
        this.snackBar.open('Cập nhật tồn kho thành công!', 'Đóng', {
          duration: 3000,
          panelClass: ['snackbar-success'],
        });
        this.dialogRef.close({ updated: true });
      },
      error: (err) => {
        console.error('Lỗi cập nhật tồn kho:', err);
        this.snackBar.open('Lỗi khi cập nhật tồn kho!', 'Đóng', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
      },
    });
  }

  onTransferSubmit(): void {
    if (this.scannedItems.length === 0) return;

    for (const item of this.scannedItems) {
      const locationObj = this.locations.find(
        (loc) =>
          loc.code.trim().toLowerCase() === item.location.trim().toLowerCase()
      );

      if (!locationObj) {
        this.snackBar.open(
          `Không tìm thấy mã kho cho "${item.location}"`,
          'Đóng',
          {
            duration: 3000,
            panelClass: ['snackbar-error'],
          }
        );
        continue;
      }

      const payload = {
        location_id: locationObj.id,
        inventory_identifier: item.code,
        updated_by: item.scannedBy,
      };

      this.quanLyKhoService.updateInventoryLocation(payload).subscribe({
        next: () => {
          console.log(`Đã chuyển kho cho ${item.code}`);
        },
        error: (err) => {
          console.error(`Lỗi chuyển kho cho ${item.code}:`, err);
          this.snackBar.open(`Lỗi chuyển kho cho ${item.code}`, 'Đóng', {
            duration: 3000,
            panelClass: ['snackbar-error'],
          });
        },
      });
    }

    this.snackBar.open('Đã gửi yêu cầu chuyển kho!', 'Đóng', {
      duration: 3000,
      panelClass: ['snackbar-success'],
    });

    this.dialogRef.close({ transferred: true });
  }

  toggleScanMode(mode: 'pallet' | 'box') {
    this.selectedScanMode = this.selectedScanMode === mode ? null : mode;
    this.scanStep = 'pallet';
    if (this.selectedScanMode) {
      setTimeout(() => this.palletInput?.nativeElement?.focus(), 100);
    }
  }
  focusLocationInput() {
    setTimeout(() => this.locationInput?.nativeElement?.focus(), 100);
  }

  onScanComplete(): void {
    if (!this.palletScan) return;
    this.isLoading = true;

    if (this.mode === 'check' || this.mode === 'update') {
      this.fetchProductInfo(this.palletScan);
    }

    if (this.mode === 'transfer') {
      if (!this.locationScan) {
        this.isLoading = false;
        this.snackBar.open('Vui lòng quét location!', 'Đóng', { duration: 2000 });
        return;
      }

      const newItem = {
        code: this.palletScan,
        name: this.productInfo.tenSanPham || '',
        quantity: this.productInfo.soLuongHienTai || '',
        location: this.locationScan,
        scannedAt: new Date().toLocaleString(),
        scannedBy: 'Admin',
      };

      this.scannedItems.push(newItem);
      this.palletScan = '';
      this.locationScan = '';
      this.scanStep = 'pallet';
      this.selectedScanMode = 'pallet';
      setTimeout(() => this.palletInput?.nativeElement?.focus(), 100);
      this.isLoading = false;
      this.snackBar.open('✓ Đã thêm vào danh sách!', '', { duration: 1500 });
    }

    this.isInfoVisible = true;
  }
  canSave(): boolean {
    if (this.mode === 'update') {
      return !!this.palletScan && !!this.updatedQuantity && this.updatedQuantity > 0;
    }
    if (this.mode === 'transfer') {
      return this.scannedItems.length > 0;
    }
    return false;
  }

  removeScannedItem(index: number): void {
    this.scannedItems.splice(index, 1);
  }

  onModeChange(): void {
    console.log('Mode changed:', this.isPalletMode ? 'Pallet' : 'Box');
  }

  selectPalletMode(): void {
    this.isPalletMode = true;
  }

  selectBoxMode(): void {
    this.isPalletMode = false;
  }

  onSave(): void {
    if (this.mode === 'update') {
      this.onUpdateQuantity();
    }

    if (this.mode === 'transfer') {
      this.onTransferSubmit();
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}