import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    const isLoggedIn = this.authService.isAuthenticated();
    const requiredRoles: string[] = route.data['roles'] || [];

    console.log('[AuthGuard] Checking route:', state.url);
    console.log('[AuthGuard] isLoggedIn:', isLoggedIn);

    if (!isLoggedIn) {
      console.log('[AuthGuard] Not authenticated, trying silent login...');

      // Thử silent login trước
      const silentSuccess = await this.authService.trySilentLogin();

      if (silentSuccess) {
        console.log('[AuthGuard] Silent login successful!');

        // Delay nhỏ để đảm bảo token đã được lưu
        await new Promise(resolve => setTimeout(resolve, 500));

        // Kiểm tra roles
        if (requiredRoles.length > 0) {
          const updatedRoles = this.authService.getUserRoles();
          const hasRole = requiredRoles.some(role => updatedRoles.includes(role));

          console.log('[AuthGuard] User roles:', updatedRoles);
          console.log('[AuthGuard] Has required role:', hasRole);

          if (!hasRole) {
            console.warn('[AuthGuard] Access denied after silent login');
            this.router.navigate(['/unauthorized']);
            return false;
          }
        }

        console.log('[AuthGuard] Access granted after silent login');
        return true;
      }

      // Silent login failed, redirect đến login (KHÔNG force)
      console.log('[AuthGuard] Silent login failed, redirecting to login');
      this.authService.initiateLogin(state.url); // ✅ Không force login
      return false;
    }

    // Đã đăng nhập, kiểm tra roles
    if (requiredRoles.length > 0) {
      const userRoles = this.authService.getUserRoles();
      const hasRole = requiredRoles.some(role => userRoles.includes(role));

      if (!hasRole) {
        console.warn('[AuthGuard] Access denied');
        this.router.navigate(['/unauthorized']);
        return false;
      }
    }

    console.log('[AuthGuard] Access granted');
    return true;
  }
}