import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service'; 

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private isRedirecting = false; // Flag để tránh redirect loop

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const isLoggedIn = this.authService.isAuthenticated();
    
    console.log('[AuthGuard] Checking route:', state.url, 'isLoggedIn:', isLoggedIn);

    if (!isLoggedIn) {
      // Chỉ redirect nếu chưa đang trong quá trình redirect
      if (!this.isRedirecting) {
        this.isRedirecting = true;
        
        // Lưu URL hiện tại để redirect sau khi login
        localStorage.setItem('returnUrl', state.url);
        
        const clientId = 'RD_KHO';
        const realm = 'master';
        const redirectUri = encodeURIComponent(window.location.origin + '/home');
        const loginUrl = `https://ssosys.rangdong.com.vn:9002/realms/${realm}/protocol/openid-connect/auth?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=openid`;

        console.log('[AuthGuard] Redirecting to login:', loginUrl);
        
        // Reset flag sau 2 giây để tránh stuck
        setTimeout(() => {
          this.isRedirecting = false;
        }, 2000);
        
        window.location.href = loginUrl;
      }
      
      return false;
    }

    return true;
  }
}