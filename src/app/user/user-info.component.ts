import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
    exp: number;
    iat: number;
    sub: string;
    preferred_username?: string;
    email?: string;
    name?: string;
    given_name?: string;
    family_name?: string;
    email_verified?: boolean;
    scope?: string;
    realm_access?: {
        roles: string[];
    };
    resource_access?: {
        [key: string]: {
            roles: string[];
        };
    };
}


@Component({
    selector: 'app-user-info',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="user-info-container">
      <h2>Thông tin người dùng</h2>
      
      <div class="info-card" *ngIf="userInfo">
        <div class="info-row">
          <span class="label">Username:</span>
          <span class="value">{{ userInfo.username }}</span>
        </div>
        
        <div class="info-row" *ngIf="userInfo.email">
          <span class="label">Email:</span>
          <span class="value">{{ userInfo.email }}</span>
        </div>
        
        <div class="info-row" *ngIf="userInfo.name">
          <span class="label">Họ tên:</span>
          <span class="value">{{ userInfo.name }}</span>
        </div>
        
        <div class="info-row">
          <span class="label">User ID:</span>
          <span class="value mono">{{ userInfo.sub }}</span>
        </div>
        <div class="info-row">
            <span class="label">Tên đầy đủ:</span>
            <span class="value">{{ userInfo.name }}</span>
        </div>

        <div class="info-row">
            <span class="label">Email đã xác thực:</span>
            <span class="value">{{ userInfo.emailVerified ? 'Có' : 'Chưa' }}</span>
        </div>

        <div class="info-row">
            <span class="label">Scope:</span>
            <span class="value">{{ userInfo.scope }}</span>
        </div>

      </div>

      <div class="roles-section">
        <h3>Quyền hạn (Roles)</h3>
        
        <div class="roles-card">
          <div class="role-group" *ngIf="realmRoles.length > 0">
            <h4>Realm Roles:</h4>
            <div class="roles-list">
              <span class="role-badge realm" *ngFor="let role of realmRoles">
                {{ role }}
              </span>
            </div>
          </div>
          
          <div class="role-group" *ngIf="clientRoles.length > 0">
            <h4>Client Roles (RD_KHO):</h4>
            <div class="roles-list">
              <span class="role-badge client" *ngFor="let role of clientRoles">
                {{ role }}
              </span>
            </div>
          </div>

          <div class="role-group">
            <h4>Tất cả Roles:</h4>
            <div class="roles-list">
              <span class="role-badge all" *ngFor="let role of allRoles">
                {{ role }}
              </span>
            </div>
          </div>

          <div class="no-roles" *ngIf="allRoles.length === 0">
             Không có roles nào được gán
          </div>
        </div>
      </div>
  `,
    styles: [`
    .user-info-container {
      max-width: 800px;
      margin: 2rem auto;
      padding: 2rem;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    h2 {
      color: #1976d2;
      margin-bottom: 1.5rem;
      font-size: 1.8rem;
    }

    h3 {
      color: #333;
      margin: 2rem 0 1rem 0;
      font-size: 1.3rem;
    }

    h4 {
      color: #555;
      margin: 1rem 0 0.5rem 0;
      font-size: 1rem;
      font-weight: 600;
    }

    .info-card, .roles-card, .token-card {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .info-row {
      display: flex;
      padding: 0.75rem 0;
      border-bottom: 1px solid #f5f5f5;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .label {
      font-weight: 600;
      color: #666;
      min-width: 150px;
    }

    .value {
      color: #333;
      flex: 1;
    }

    .value.mono {
      font-family: 'Courier New', monospace;
      font-size: 0.9rem;
      background: #f5f5f5;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
    }

    .value.warning {
      color: #f44336;
      font-weight: 600;
    }

    .roles-section {
      margin-top: 2rem;
    }

    .role-group {
      margin-bottom: 1.5rem;
    }

    .roles-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .role-badge {
      display: inline-block;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 500;
      color: white;
    }

    .role-badge.realm {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .role-badge.client {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    .role-badge.all {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }

    .no-roles {
      padding: 2rem;
      text-align: center;
      color: #999;
      font-style: italic;
    }

    .token-section {
      margin-top: 2rem;
    }

    .btn-view-token, .btn-debug {
      margin-top: 1rem;
      padding: 0.75rem 1.5rem;
      background: #1976d2;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.95rem;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .btn-view-token:hover, .btn-debug:hover {
      background: #1565c0;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }

    .btn-debug {
      background: #43a047;
      margin-right: 0.5rem;
    }

    .btn-debug:hover {
      background: #388e3c;
    }

    .raw-token {
      margin-top: 1rem;
      background: #f5f5f5;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      padding: 1rem;
    }

    .raw-token pre {
      background: #263238;
      color: #aed581;
      padding: 1rem;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 0.75rem;
      line-height: 1.5;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .debug-section {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 2px dashed #e0e0e0;
    }

    @media (max-width: 768px) {
      .user-info-container {
        padding: 1rem;
      }

      .info-row {
        flex-direction: column;
      }

      .label {
        margin-bottom: 0.25rem;
      }
    }
  `]
})
export class UserInfoComponent implements OnInit {
    userInfo: any = null;
    realmRoles: string[] = [];
    clientRoles: string[] = [];
    allRoles: string[] = [];
    tokenInfo: any = {};
    showRawToken = false;
    rawToken = '';
    decodedPayload = '';

    constructor(private authService: AuthService) { }

    ngOnInit() {
        this.loadUserInfo();
    }

    loadUserInfo() {
        const token = this.authService.getAccessToken();

        if (!token) {
            console.error('No access token found');
            return;
        }

        try {
            const decoded = jwtDecode<DecodedToken>(token);

            // User info
            this.userInfo = {
                username: decoded.preferred_username || 'N/A',
                email: decoded.email || 'N/A',
                name: decoded.name || 'N/A',
                givenName: decoded.given_name || 'N/A',
                familyName: decoded.family_name || 'N/A',
                emailVerified: decoded.email_verified ?? false,
                scope: decoded.scope || 'N/A',
                sub: decoded.sub
            };


            // Realm roles
            this.realmRoles = decoded.realm_access?.roles || [];

            // Client roles
            this.clientRoles = decoded.resource_access?.['account']?.roles || [];

            // All roles từ AuthService
            this.allRoles = this.authService.getUserRoles();

            // Token timing
            const now = Math.floor(Date.now() / 1000);
            const remaining = decoded.exp - now;

            this.tokenInfo = {
                issuedAt: new Date(decoded.iat * 1000).toLocaleString('vi-VN'),
                expiresAt: new Date(decoded.exp * 1000).toLocaleString('vi-VN'),
                remainingSeconds: remaining,
                remainingTime: this.formatRemainingTime(remaining)
            };

            // Raw token
            this.rawToken = token;
            this.decodedPayload = JSON.stringify(decoded, null, 2);

            console.log('[UserInfo] Loaded user information:', {
                userInfo: this.userInfo,
                realmRoles: this.realmRoles,
                clientRoles: this.clientRoles,
                allRoles: this.allRoles,
                tokenInfo: this.tokenInfo
            });

        } catch (error) {
            console.error('[UserInfo] Error decoding token:', error);
        }
    }

    formatRemainingTime(seconds: number): string {
        if (seconds < 0) return 'Expired';

        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;

        if (minutes > 0) {
            return `${minutes} phút ${secs} giây`;
        }
        return `${secs} giây`;
    }

    // logToConsole() {
    //     console.group(' USER INFO & ROLES');
    //     console.log('User Info:', this.userInfo);
    //     console.log('Realm Roles:', this.realmRoles);
    //     console.log('Client Roles:', this.clientRoles);
    //     console.log('All Roles:', this.allRoles);
    //     console.log('Token Info:', this.tokenInfo);
    //     console.log('Raw Token:', this.rawToken);
    //     console.groupEnd();
    // }

    // testRoleCheck() {
    //     console.group(' ROLE CHECK TESTS');

    //     // Test hasRole
    //     console.log('Has "admin" role?', this.authService.hasRole('admin'));
    //     console.log('Has "user" role?', this.authService.hasRole('user'));
    //     console.log('Has "warehouse_manager" role?', this.authService.hasRole('warehouse_manager'));

    //     // Test hasAnyRole
    //     console.log('Has any of ["admin", "superadmin"]?',
    //         this.authService.hasAnyRole(['admin', 'superadmin']));

    //     console.groupEnd();
    // }
}