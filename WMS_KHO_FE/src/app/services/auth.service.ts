import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable, timer, Subscription } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

interface TokenPayload {
  exp: number;
  iat: number;
  sub: string;
  preferred_username?: string;
  email?: string;
  name?: string;
  realm_access?: {
    roles: string[];
  };
  resource_access?: {
    [key: string]: {
      roles: string[];
    };
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  private usernameSubject = new BehaviorSubject<string>(this.getStoredUsername());

  isLoggedIn$: Observable<boolean> = this.isLoggedInSubject.asObservable();
  username$: Observable<string> = this.usernameSubject.asObservable();

  private readonly KEYCLOAK_URL = 'https://ssosys.rangdong.com.vn:9002';
  private readonly REALM = 'rangdong';
  private readonly CLIENT_ID = 'RD_KHO';

  // Session timeout: 30 phút
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000;
  private sessionTimer?: Subscription;
  private tokenRefreshTimer?: Subscription;

  constructor(
    private http: HttpClient,
    private router: Router,
    private ngZone: NgZone
  ) {
    this.initSessionManagement();
  }

  // ============= PKCE HELPERS =============
  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.base64UrlEncode(array);
  }

  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return this.base64UrlEncode(new Uint8Array(hash));
  }

  private base64UrlEncode(buffer: Uint8Array): string {
    const base64 = btoa(String.fromCharCode(...buffer));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  private generateState(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // ============= TOKEN VALIDATION =============
  private hasValidToken(): boolean {
    const token = localStorage.getItem('access_token');
    if (!token) return false;

    try {
      const decoded = jwtDecode<TokenPayload>(token);
      const now = Date.now() / 1000;
      return decoded.exp > now + 30;
    } catch (error) {
      console.error('[AuthService] Invalid token:', error);
      return false;
    }
  }

  private getStoredUsername(): string {
    return localStorage.getItem('username') || '';
  }

  // ============= LOGIN FLOW =============
  async initiateLogin(returnUrl?: string): Promise<void> {
  try {
    if (returnUrl) {
      sessionStorage.setItem('returnUrl', returnUrl);
    }

    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    const state = this.generateState();

    sessionStorage.setItem('code_verifier', codeVerifier);
    sessionStorage.setItem('auth_state', state);

    const redirectUri = `${window.location.origin}/auth/callback`;

    // ✅ FIXED: Thêm "&" sau max_age=0 và xóa kc_action
    const loginUrl =
      `${this.KEYCLOAK_URL}/realms/${this.REALM}/protocol/openid-connect/auth?` +
      `client_id=${this.CLIENT_ID}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=openid profile email&` +
      `state=${state}&` +
      `code_challenge=${codeChallenge}&` +
      `code_challenge_method=S256&` +
      `prompt=login&` +
      `max_age=0`;  

    console.log('[AuthService] Redirecting to Keycloak login');
    console.log('[AuthService] Login URL:', loginUrl); // Debug URL
    
    window.location.href = loginUrl;

  } catch (error) {
    console.error('[AuthService] Error initiating login:', error);
    throw error;
  }
}

  // ============= HANDLE CALLBACK =============
  async handleCallback(code: string, state: string): Promise<string> {
    try {
      const savedState = sessionStorage.getItem('auth_state');
      if (!savedState || savedState !== state) {
        throw new Error('Invalid state parameter - possible CSRF attack');
      }

      const codeVerifier = sessionStorage.getItem('code_verifier');
      if (!codeVerifier) {
        throw new Error('Code verifier not found');
      }

      const tokens = await this.exchangeCodeForTokens(code, codeVerifier);
      this.setToken(tokens.access_token, tokens.refresh_token, tokens.id_token);

      const decoded = jwtDecode<TokenPayload>(tokens.access_token);
      this.setUsername(decoded.preferred_username || decoded.sub);

      sessionStorage.removeItem('code_verifier');
      sessionStorage.removeItem('auth_state');

      const returnUrl = sessionStorage.getItem('returnUrl') || '/home';
      sessionStorage.removeItem('returnUrl');

      console.log('[AuthService] Login successful');
      return returnUrl;
    } catch (error) {
      console.error('[AuthService] Callback error:', error);
      throw error;
    }
  }

  private exchangeCodeForTokens(code: string, codeVerifier: string): Promise<any> {
    const body = new URLSearchParams();
    body.set('grant_type', 'authorization_code');
    body.set('client_id', this.CLIENT_ID);
    body.set('code', code);
    body.set('redirect_uri', `${window.location.origin}/auth/callback`);
    body.set('code_verifier', codeVerifier);

    return this.http.post(
      `${this.KEYCLOAK_URL}/realms/${this.REALM}/protocol/openid-connect/token`,
      body.toString(),
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/x-www-form-urlencoded'
        })
      }
    ).toPromise();
  }

  // ============= TOKEN MANAGEMENT =============
  setToken(accessToken: string, refreshToken: string, idToken: string): void {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
  localStorage.setItem('id_token', idToken);
  localStorage.setItem('login_time', Date.now().toString());
  
  this.isLoggedInSubject.next(true);
  this.startSessionTimer();
  this.startTokenRefresh();
}

  setUsername(username: string): void {
    localStorage.setItem('username', username);
    this.usernameSubject.next(username);
  }

  // ============= SESSION MANAGEMENT =============
  private initSessionManagement(): void {
    if (this.isAuthenticated()) {
      this.startSessionTimer();
      this.startTokenRefresh();
    }
  }

  private startSessionTimer(): void {
    this.sessionTimer?.unsubscribe();

    const loginTime = parseInt(localStorage.getItem('login_time') || '0');
    const elapsed = Date.now() - loginTime;
    const remaining = this.SESSION_TIMEOUT - elapsed;

    if (remaining <= 0) {
      console.log('[AuthService] Session expired on init');
      this.logout().subscribe();
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      this.sessionTimer = timer(remaining).subscribe(() => {
        this.ngZone.run(() => {
          console.log('[AuthService] Session timeout - auto logout');
          alert('Phiên đăng nhập đã hết hạn sau 30 phút. Vui lòng đăng nhập lại.');
          this.logout().subscribe();
        });
      });
    });

    console.log(`[AuthService] Session will expire in ${Math.round(remaining / 1000)}s`);
  }

  private startTokenRefresh(): void {
    this.tokenRefreshTimer?.unsubscribe();

    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const decoded = jwtDecode<TokenPayload>(token);
      const expiresAt = decoded.exp * 1000;
      const now = Date.now();
      const refreshAt = expiresAt - (2 * 60 * 1000);
      const delay = refreshAt - now;

      if (delay > 0) {
        this.ngZone.runOutsideAngular(() => {
          this.tokenRefreshTimer = timer(delay).subscribe(() => {
            this.ngZone.run(() => {
              console.log('[AuthService] Auto refreshing token');
              this.refreshToken();
            });
          });
        });
        console.log(`[AuthService] Token will be refreshed in ${Math.round(delay / 1000)}s`);
      }
    } catch (error) {
      console.error('[AuthService] Error scheduling token refresh:', error);
    }
  }

  private refreshToken(): void {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      this.logout().subscribe();
      return;
    }

    const body = new URLSearchParams();
    body.set('grant_type', 'refresh_token');
    body.set('client_id', this.CLIENT_ID);
    body.set('refresh_token', refreshToken);

    this.http.post(
      `${this.KEYCLOAK_URL}/realms/${this.REALM}/protocol/openid-connect/token`,
      body.toString(),
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/x-www-form-urlencoded'
        })
      }
    ).subscribe({
      next: (response: any) => {
        console.log('[AuthService] Token refreshed successfully');
        this.setToken(response.access_token, response.refresh_token, response.id_token);
      },
      error: (err) => {
        console.error('[AuthService] Token refresh failed:', err);
        this.logout().subscribe();
      }
    });
  }

  // ============= LOGOUT =============
  logout(): Observable<void> {
  console.log('[AuthService] Logging out...');

  this.sessionTimer?.unsubscribe();
  this.tokenRefreshTimer?.unsubscribe();

  const idToken = localStorage.getItem('id_token'); // Cần lưu id_token khi login
  
  return new Observable((observer) => {
    // Xóa dữ liệu phía client ngay
    this.clearAuthData();
    
    observer.next();
    observer.complete();

    // Redirect đến Keycloak logout endpoint để xóa SSO session
    const postLogoutRedirectUri = encodeURIComponent(
      `${window.location.origin}/home`
    );
    
    const logoutUrl = 
      `${this.KEYCLOAK_URL}/realms/${this.REALM}/protocol/openid-connect/logout?` +
      `post_logout_redirect_uri=${postLogoutRedirectUri}` +
      (idToken ? `&id_token_hint=${idToken}` : '');

    console.log('[AuthService] Redirecting to Keycloak logout (clear SSO session)');
    window.location.href = logoutUrl;
  });
}


  clearAuthData(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('username');
    localStorage.removeItem('login_time');

    sessionStorage.removeItem('returnUrl');
    sessionStorage.removeItem('code_verifier');
    sessionStorage.removeItem('auth_state');

    this.isLoggedInSubject.next(false);
    this.usernameSubject.next('');

    console.log('[AuthService]  Data cleared');
  }

  // ============= ROLES MANAGEMENT =============
  getUserRoles(): string[] {
    const token = this.getAccessToken();
    if (!token) return [];

    try {
      const decoded = jwtDecode<TokenPayload>(token);
      const realmRoles = decoded.realm_access?.roles || [];
      const clientRoles = Object.values(decoded.resource_access || {})
        .flatMap((client: any) => client.roles || []);
      return [...realmRoles, ...clientRoles];
    } catch {
      return [];
    }
  }

  hasRole(role: string): boolean {
    const roles = this.getUserRoles();
    return roles.includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    const userRoles = this.getUserRoles();
    return roles.some(role => userRoles.includes(role));
  }

  // ============= PUBLIC GETTERS =============
  getUsername(): string {
    return this.usernameSubject.value;
  }

  isAuthenticated(): boolean {
    return this.hasValidToken();
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }
}