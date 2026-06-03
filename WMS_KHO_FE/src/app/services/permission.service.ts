import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  
  constructor(private authService: AuthService) {
    console.log('[PermissionService] Initialized');
  }

  // Lấy roles trực tiếp từ AuthService
  getUserRoles(): string[] {
    const roles = this.authService.getUserRoles();
    console.log('[PermissionService] Current user roles:', roles);
    return roles;
  }

  hasRole(roles: string | string[]): boolean {
    if (!roles) return true;
    
    const userRoles = this.getUserRoles();
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    const hasAccess = requiredRoles.some(role => userRoles.includes(role));
    
    console.log('[PermissionService] Checking roles:', {
      required: requiredRoles,
      userHas: userRoles,
      result: hasAccess
    });
    
    return hasAccess;
  }

  hasAnyRole(roles: string[]): boolean {
    const userRoles = this.getUserRoles();
    return roles.some(role => userRoles.includes(role));
  }

  hasAllRoles(roles: string[]): boolean {
    const userRoles = this.getUserRoles();
    return roles.every(role => userRoles.includes(role));
  }

  // Expose getUserRoles publicly nếu cần dùng trong components
  getRoles(): string[] {
    return this.getUserRoles();
  }

  /** Quản lý kho / vị trí: chỉ WMS_RD_VIEW → không được tạo/sửa/vô hiệu hóa */
  canModifyAreaLocation(): boolean {
    const roles = this.getUserRoles();
    if (roles.includes('WMS_RD_ADMIN') || roles.includes('WMS_RD_AREALOC')) {
      return true;
    }
    return !roles.includes('WMS_RD_VIEW');
  }

  /** Kho thành phẩm: chỉ WMS_RD_VIEW → ẩn nút tạo đơn / phê duyệt trên list */
  canPerformKhoThanhPhamActions(): boolean {
    const roles = this.getUserRoles();
    const writeRoles = [
      'WMS_RD_ADMIN',
      'WMS_RD_APPROVEIO',
      'WMS_RD_STOCKOPS',
      'WMS_RD_PUTAWAY',
    ];
    if (writeRoles.some((r) => roles.includes(r))) {
      return true;
    }
    return !roles.includes('WMS_RD_VIEW');
  }
}