import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApolloError } from '@apollo/client/core';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  constructor(private snackBar: MatSnackBar) {}

  /**
   * Xử lý GraphQL errors
   */
  handleGraphQLError(error: ApolloError | any): void {
    const errorMessage = this.parseGraphQLError(error);
    this.showError(errorMessage);
  }

  /**
   * Parse GraphQL error thành message dễ hiểu
   */
  private parseGraphQLError(error: any): string {
    // Network errors
    if (error.networkError) {
      const status = error.networkError.status;
      
      switch (status) {
        case 401:
          return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        case 403:
          return 'Bạn không có quyền truy cập dữ liệu này.';
        case 404:
          return 'Không tìm thấy dữ liệu yêu cầu.';
        case 500:
          return 'Lỗi máy chủ. Vui lòng thử lại sau.';
        case 503:
          return 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.';
        default:
          return `Lỗi kết nối: ${error.networkError.message}`;
      }
    }

    // GraphQL errors
    if (error.graphQLErrors && error.graphQLErrors.length > 0) {
      const graphQLError = error.graphQLErrors[0];
      
      // Custom error messages based on error code
      if (graphQLError.extensions) {
        const code = graphQLError.extensions['code'];
        
        switch (code) {
          case 'UNAUTHENTICATED':
            return 'Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.';
          case 'FORBIDDEN':
            return 'Bạn không có quyền thực hiện thao tác này.';
          case 'BAD_USER_INPUT':
            return 'Dữ liệu đầu vào không hợp lệ.';
          case 'INTERNAL_SERVER_ERROR':
            return 'Lỗi hệ thống. Vui lòng liên hệ quản trị viên.';
          default:
            return graphQLError.message || 'Đã xảy ra lỗi không xác định.';
        }
      }
      
      return graphQLError.message || 'Đã xảy ra lỗi không xác định.';
    }

    // Default error message
    return error.message || 'Đã xảy ra lỗi khi xử lý yêu cầu.';
  }

  /**
   * Show error message
   */
  showError(message: string, duration: number = 5000): void {
    this.snackBar.open(message, 'Đóng', {
      duration,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  /**
   * Show success message
   */
  showSuccess(message: string, duration: number = 3000): void {
    this.snackBar.open(message, 'Đóng', {
      duration,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Show warning message
   */
  showWarning(message: string, duration: number = 4000): void {
    this.snackBar.open(message, 'Đóng', {
      duration,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['warning-snackbar']
    });
  }

  /**
   * Show info message
   */
  showInfo(message: string, duration: number = 3000): void {
    this.snackBar.open(message, 'Đóng', {
      duration,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['info-snackbar']
    });
  }

  /**
   * Show loading message
   */
  showLoading(message: string = 'Đang tải...'): void {
    this.snackBar.open(message, '', {
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['loading-snackbar']
    });
  }

  /**
   * Dismiss all snackbars
   */
  dismiss(): void {
    this.snackBar.dismiss();
  }
}
