import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  private usernameSubject = new BehaviorSubject<string>(
    this.getStoredUsername()
  );

  isLoggedIn$: Observable<boolean> = this.isLoggedInSubject.asObservable();
  username$: Observable<string> = this.usernameSubject.asObservable();

  private readonly KEYCLOAK_URL = 'http://192.168.20.97:9000';
  private readonly REALM = 'master';
  private readonly CLIENT_ID = 'RD_KHO';

  constructor(private http: HttpClient) {}

  private hasToken(): boolean {
    return !!localStorage.getItem('access_token');
  }

  private getStoredUsername(): string {
    return localStorage.getItem('username') || '';
  }

  setToken(accessToken: string, refreshToken: string): void {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    this.isLoggedInSubject.next(true);
  }

  setUsername(username: string): void {
    localStorage.setItem('username', username);
    this.usernameSubject.next(username);
  }

  logout(): Observable<void> {
    const refreshToken = localStorage.getItem('refresh_token');

    console.log('[AuthService] Logging out...');

    if (refreshToken) {
      const body = new URLSearchParams();
      body.set('client_id', this.CLIENT_ID);
      body.set('refresh_token', refreshToken);

      return new Observable((observer) => {
        this.http
          .post(
            `${this.KEYCLOAK_URL}/realms/${this.REALM}/protocol/openid-connect/logout`,
            body.toString(),
            {
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            }
          )
          .subscribe({
            next: () => {
              console.log(
                '[AuthService] Keycloak session cleared successfully'
              );
            },
            error: (err) => {
              console.error(
                '[AuthService] Error clearing Keycloak session:',
                err
              );
            },
            complete: () => {
              this.clearLocalData();
              observer.next();
              observer.complete();
            },
          });
      });
    } else {
      // Không có refresh token, xóa local ngay
      this.clearLocalData();
      return new Observable((observer) => {
        observer.next();
        observer.complete();
      });
    }
  }

  private clearLocalData(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('username');
    localStorage.removeItem('returnUrl');

    this.isLoggedInSubject.next(false);
    this.usernameSubject.next('');

    console.log('[AuthService] Local data cleared');
  }

  getUsername(): string {
    return this.usernameSubject.value;
  }

  isAuthenticated(): boolean {
    return this.isLoggedInSubject.value;
  }
}
