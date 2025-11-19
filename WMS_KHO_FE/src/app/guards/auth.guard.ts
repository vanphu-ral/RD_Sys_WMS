import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const isLoggedIn = this.authService.isAuthenticated();
    const requiredRoles: string[] = route.data['roles'] || [];
    const userRoles: string[] = this.authService.getUserRoles();
    
    console.log('[AuthGuard] Checking route:', state.url, 'isLoggedIn:', isLoggedIn);

    // Chưa đăng nhập → Redirect về login
    if (!isLoggedIn) {
      console.log('[AuthGuard] Not authenticated, redirecting to login');
      
      //  Lưu returnUrl và gọi initiateLogin
      this.authService.initiateLogin(state.url);
      
      return false;
    }

    //  Đã đăng nhập → Kiểm tra roles
    if (requiredRoles.length > 0) {
      const hasRole = requiredRoles.some(role => userRoles.includes(role));
      
      if (!hasRole) {
        console.warn('[AuthGuard] Access denied. Required roles:', requiredRoles);
        console.warn('[AuthGuard] User roles:', userRoles);
        this.router.navigate(['/unauthorized']);
        return false;
      }
    }

    console.log('[AuthGuard]  Access granted');
    return true;
  }
}