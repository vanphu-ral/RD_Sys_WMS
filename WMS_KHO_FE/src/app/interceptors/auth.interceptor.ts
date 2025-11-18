import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * HTTP Interceptor (Functional style cho Angular 15+)
 * Tự động thêm Bearer token vào headers của mọi HTTP request
 * Xử lý 401 Unauthorized errors
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Danh sách domains không cần thêm token (Keycloak endpoints)
  const keycloakDomains = [
    'rangdong.com.vn',
    'ssosys.rangdong.com.vn'
  ];

  // Kiểm tra xem request có phải đến Keycloak không
  const isKeycloakRequest = keycloakDomains.some(domain => 
    req.url.includes(domain)
  );

  let clonedRequest = req;

  // Chỉ thêm token cho các API requests (không phải Keycloak)
  if (!isKeycloakRequest) {
    const token = authService.getAccessToken();
    
    if (token) {
      clonedRequest = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('[AuthInterceptor] Added token to request:', req.url);
    }
  }

  // Xử lý response và errors
  return next(clonedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      // Xử lý 401 Unauthorized
      if (error.status === 401) {
        console.error('[AuthInterceptor] 401 Unauthorized - Token expired or invalid');
        
        // Logout và redirect về home
        // authService.logout().subscribe(() => {
        //   console.log('[AuthInterceptor] User logged out due to 401 error');
        //   router.navigate(['/home']);
        // });
      }

      // Xử lý các errors khác
      if (error.status === 403) {
        console.error('[AuthInterceptor] 403 Forbidden - Access denied');
      }

      if (error.status === 0) {
        console.error('[AuthInterceptor] Network error - Cannot reach server');
      }

      return throwError(() => error);
    })
  );
};