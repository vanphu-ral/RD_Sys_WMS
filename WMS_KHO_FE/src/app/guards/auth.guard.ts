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
    console.log('[AuthGuard] requiredRoles:', requiredRoles);

    if (!isLoggedIn) {
      console.log('[AuthGuard] Not authenticated, trying silent login...');

      const silentSuccess = await this.authService.trySilentLogin();

      if (silentSuccess) {
        console.log('[AuthGuard] Silent login successful!');

        // QUAN TRỌNG: Delay nhỏ để đảm bảo token đã được lưu
        await new Promise(resolve => setTimeout(resolve, 500));

        // Kiểm tra lại authentication sau silent login
        const isNowLoggedIn = this.authService.isAuthenticated();
        console.log('[AuthGuard] After silent login, isAuthenticated:', isNowLoggedIn);

        if (!isNowLoggedIn) {
          console.error('[AuthGuard] Silent login reported success but no valid token found');
          this.authService.initiateLogin(state.url);
          return false;
        }

        if (requiredRoles.length > 0) {
          const updatedRoles = this.authService.getUserRoles();
          const hasRole = requiredRoles.some(role => updatedRoles.includes(role));

          console.log('[AuthGuard] User roles after silent login:', updatedRoles);
          console.log('[AuthGuard] Has required role:', hasRole);

          if (!hasRole) {
            console.warn('[AuthGuard] Access denied - missing required roles');
            this.router.navigate(['/unauthorized']);
            return false;
          }
        }

        console.log('[AuthGuard] Access granted after silent login');
        return true;
      }

      console.log('[AuthGuard] Silent login failed, redirecting to login page');
      this.authService.initiateLogin(state.url);
      return false;
    }

    // Đã đăng nhập, kiểm tra roles
    if (requiredRoles.length > 0) {
      const userRoles = this.authService.getUserRoles();
      const hasRole = requiredRoles.some(role => userRoles.includes(role));

      console.log('[AuthGuard] User roles:', userRoles);
      console.log('[AuthGuard] Has required role:', hasRole);

      if (!hasRole) {
        console.warn('[AuthGuard] Access denied - missing required roles');
        this.router.navigate(['/unauthorized']);
        return false;
      }
    }

    console.log('[AuthGuard] Access granted');
    return true;
  }
}