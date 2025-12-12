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

  // Danh sách API cần token (WHITELIST)
  const protectedApis = [
    'https://ral-wms-logistic.rangdong.com.vn:9004/api',
    'http://192.168.10.99:8050/api', 
    'http://192.168.20.101:8050/api',
    'http://192.168.68.77:4200/api',
  ];

  // Kiểm tra request có phải API cần bảo vệ không
  const needsToken = protectedApis.some(api => req.url.startsWith(api));

  let clonedRequest = req;

  if (needsToken) {
    const token = authService.getAccessToken();
    
    if (token) {
      clonedRequest = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('[AuthInterceptor] Token added:', req.url);
    } else {
      console.warn('[AuthInterceptor] No token for protected API:', req.url);
    }
  }

  return next(clonedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.error('[AuthInterceptor] 401 - Redirecting to login');
        authService.logout().subscribe();
      }
      if (error.status === 403) {
        console.error('[AuthInterceptor] 403 - Access denied');
      }
      return throwError(() => error);
    })
  );
};