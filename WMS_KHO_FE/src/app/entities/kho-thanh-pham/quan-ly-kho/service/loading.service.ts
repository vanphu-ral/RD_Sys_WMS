import { Injectable } from "@angular/core";
import { ErrorHandlerService } from "./error-handler.service";

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingCount = 0;
  private loadingState = false;

  constructor(private errorHandler: ErrorHandlerService) {}

  /**
   * Bắt đầu loading
   */
  start(message?: string): void {
    this.loadingCount++;
    
    if (this.loadingCount === 1) {
      this.loadingState = true;
      if (message) {
        this.errorHandler.showLoading(message);
      }
    }
  }

  /**
   * Kết thúc loading
   */
  stop(): void {
    this.loadingCount = Math.max(0, this.loadingCount - 1);
    
    if (this.loadingCount === 0) {
      this.loadingState = false;
      this.errorHandler.dismiss();
    }
  }

  /**
   * Reset loading state
   */
  reset(): void {
    this.loadingCount = 0;
    this.loadingState = false;
    this.errorHandler.dismiss();
  }

  /**
   * Get loading state
   */
  isLoading(): boolean {
    return this.loadingState;
  }
}