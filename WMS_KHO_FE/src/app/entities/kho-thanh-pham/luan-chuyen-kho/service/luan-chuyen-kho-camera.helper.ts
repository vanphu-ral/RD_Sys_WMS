import { MatSnackBar } from '@angular/material/snack-bar';
import { CameraDevice, Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';

const MOBILE_UA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

export function isMobileViewport(): boolean {
  return MOBILE_UA.test(navigator.userAgent) || window.innerWidth <= 768;
}

export type LuanChuyenKhoCameraScanHandler = (code: string) => void;

/** Quét QR/barcode bằng camera (html5-qrcode), dùng chung cho các màn scan luân chuyển kho */
export class LuanChuyenKhoCameraScanner {
  isScanning = false;
  availableCameras: CameraDevice[] = [];
  scannerTitle = 'mã';

  private qrScanner?: Html5Qrcode;
  private selectedCameraId: string | null = null;
  private lastScannedCode: string | null = null;

  constructor(
    private readonly snackBar: MatSnackBar,
    private readonly onCode: LuanChuyenKhoCameraScanHandler
  ) {}

  async open(title = 'mã'): Promise<void> {
    this.scannerTitle = title;
    this.isScanning = true;
    this.lastScannedCode = null;

    try {
      if (this.qrScanner) {
        try {
          await this.qrScanner.stop();
          await this.qrScanner.clear();
        } catch {
          /* ignore */
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      this.qrScanner = new Html5Qrcode('lck-qr-reader');
      const cameras = await Html5Qrcode.getCameras();

      if (!cameras?.length) {
        this.snackBar.open('Không tìm thấy camera', 'Đóng', { duration: 3000 });
        await this.stop();
        return;
      }

      this.availableCameras = cameras;

      const backCameras = cameras.filter((c) => {
        const label = (c.label || '').toLowerCase();
        return label.includes('back') || label.includes('environment') || label.includes('rear');
      });

      let targetCam: CameraDevice;
      if (this.selectedCameraId) {
        targetCam =
          cameras.find((c) => c.id === this.selectedCameraId) ||
          (backCameras.length ? backCameras[backCameras.length - 1] : cameras[0]);
      } else {
        targetCam = backCameras.length ? backCameras[backCameras.length - 1] : cameras[0];
      }

      this.selectedCameraId = targetCam.id;
      await this.startScanner(targetCam.id);
    } catch (e: unknown) {
      const err = e as { name?: string; message?: string };
      let errorMsg = 'Không thể mở camera!';

      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        errorMsg = 'Bạn đã từ chối quyền camera. Vui lòng cấp quyền trong Cài đặt.';
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        errorMsg = 'Không tìm thấy camera trên thiết bị!';
      } else if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError') {
        errorMsg = 'Camera đang được sử dụng. Vui lòng đóng ứng dụng khác và thử lại.';
      } else if (err?.message) {
        errorMsg = `Lỗi: ${err.message}`;
      }

      this.snackBar.open(errorMsg, 'Đóng', { duration: 5000 });
      await this.stop();
    }
  }

  async switchCamera(): Promise<void> {
    if (!this.qrScanner || this.availableCameras.length <= 1) {
      this.snackBar.open('Không có camera khác để chuyển!', '', { duration: 2000 });
      return;
    }

    try {
      const currentIndex = this.availableCameras.findIndex((c) => c.id === this.selectedCameraId);
      const nextIndex = (currentIndex + 1) % this.availableCameras.length;
      const nextCamera = this.availableCameras[nextIndex];

      await this.qrScanner.stop();
      this.selectedCameraId = nextCamera.id;
      await new Promise((resolve) => setTimeout(resolve, 200));
      await this.startScanner(nextCamera.id);
    } catch {
      this.snackBar.open('Lỗi khi chuyển camera!', 'Đóng', { duration: 3000 });
      try {
        if (this.selectedCameraId) {
          await this.startScanner(this.selectedCameraId);
        }
      } catch {
        await this.stop();
      }
    }
  }

  async stop(): Promise<void> {
    this.isScanning = false;
    this.lastScannedCode = null;

    if (!this.qrScanner) return;

    try {
      const state = await this.qrScanner.getState();
      if (state === Html5QrcodeScannerState.SCANNING) {
        await this.qrScanner.stop();
      }
      await this.qrScanner.clear();
    } catch {
      /* ignore */
    } finally {
      this.qrScanner = undefined;
    }
  }

  private async startScanner(cameraId: string): Promise<void> {
    await this.qrScanner!.start(
      cameraId,
      { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
      (decodedText) => this.handleDecoded(decodedText),
      () => {
        /* scan frame noise */
      }
    );
  }

  private handleDecoded(raw: string): void {
    const code = raw.trim();
    if (!code || code === this.lastScannedCode) return;
    this.lastScannedCode = code;
    this.onCode(code);
    void this.stop();
  }
}
