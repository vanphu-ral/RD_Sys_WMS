// kho-thanh-pham.module.ts - CẬP NHẬT

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { XuatHangTheoDonBanHangComponent } from './xuat-hang-theo-don-ban-hang/xuat-hang-theo-don-ban-hang.component';
import { NhapKhoComponent } from './nhap-kho/nhap-kho.component';
import { ChuyenKhoComponent } from './chuyen-kho/chuyen-kho.component';
import { QuanLyKhoComponent } from './quan-ly-kho/quan-ly-kho.component';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { RouterLinkWithHref } from '@angular/router';
import { PheDuyetComponent } from './nhap-kho/phe-duyet/phe-duyet.component';
import { ScanCheckComponent } from './nhap-kho/scan-check/scan-check.component';
import { ChiTietNhapKhoComponent } from './nhap-kho/chi-tiet-nhap-kho/chi-tiet-nhap-kho.component';
import { ScanCheckDialogComponent } from './quan-ly-kho/dialog/scan-check-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AddYeuCauChuyenKhoComponent } from './chuyen-kho/add-new/add-new-chuyen-kho.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ChuyenKhoDetailComponent } from "./chuyen-kho/detail/chuyen-kho-detail.component";
import { ScanDetailComponent } from './chuyen-kho/scanDetail/scan-detail.component';
import { ScanDetailXuatHangComponent } from './xuat-hang-theo-don-ban-hang/scanDetail/xuat-hang-scan-detail.component';
import { XuatHangDetailComponent } from './xuat-hang-theo-don-ban-hang/detail/xuat-hang-detail.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AddXuatHangTheoDonBanHangComponent } from './xuat-hang-theo-don-ban-hang/add-new/add-xuat-hang-theo-don-ban-hang.component';
import { ConfirmDialogComponent } from './chuyen-kho/dialog/confirm-dialog.component';
import { ConfirmDialogXuatHangComponent } from './xuat-hang-theo-don-ban-hang/dialog/confirm-dialog.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AlertDialogComponent } from './nhap-kho/dialog/alert-dialog.component';

import { APOLLO_OPTIONS } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { InMemoryCache, ApolloClientOptions, ApolloLink } from '@apollo/client/core';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { InventoryGraphqlService } from './quan-ly-kho/service/inventory-graphql.service';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth.service'; 
import { Router } from '@angular/router';

/**
 * Apollo Client Factory với Authentication & Error Handling
 */
export function createApollo(httpLink: HttpLink): ApolloClientOptions<any> {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Auth Link - Thêm Bearer token vào headers
  const authLink = setContext((_, { headers }) => {
    const token = authService.getAccessToken();
    
    console.log('[Apollo AuthLink] Token:', token ? 'Present' : 'Missing');
    
    return {
      headers: {
        ...headers,
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      }
    };
  });

  // Error Link - Xử lý lỗi từ GraphQL
  const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path, extensions }) => {
        console.error(
          `[GraphQL Error]: Message: ${message}, Location: ${locations}, Path: ${path}`
        );

        // Xử lý lỗi authentication
        if (extensions?.['code'] === 'UNAUTHENTICATED' || message.includes('Unauthorized')) {
          console.error('[Apollo] 401 - Redirecting to login');
          authService.logout().subscribe();
        }

        // Xử lý lỗi permission
        if (extensions?.['code'] === 'FORBIDDEN' || message.includes('Forbidden')) {
          console.error('[Apollo] 403 - Access denied');
          // Có thể show notification cho user
        }
      });
    }

    if (networkError) {
      console.error(`[Network Error]: ${networkError.message}`);
      
      // Xử lý network errors
      if ('status' in networkError) {
        const status = (networkError as any).status;
        
        if (status === 401) {
          console.error('[Apollo Network] 401 - Redirecting to login');
          authService.logout().subscribe();
        }
        
        if (status === 403) {
          console.error('[Apollo Network] 403 - Access denied');
        }
      }
    }
  });

  // HTTP Link
  const http = httpLink.create({
    uri: 'http://192.168.20.101:8050/graphql',
  });

  // Combine all links: Error -> Auth -> HTTP
  const link = ApolloLink.from([
    errorLink,
    authLink,
    http
  ]);

  return {
    link,
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            inventoryDashboard: {
              // Cấu hình caching cho pagination
              keyArgs: ['name', 'client_id', 'po', 'status', 'area_id', 'location_id'],
              merge(existing, incoming, { args }) {
                // Merge dữ liệu khi pagination
                if (!existing) return incoming;

                if (args?.['page'] === 1) {
                  return incoming;
                }

                return {
                  ...incoming,
                  data: [...(existing.data || []), ...(incoming.data || [])]
                };
              }
            },
            inventoryDashboardGrouped: {
              keyArgs: ['group_by', 'name', 'client_id', 'po', 'status', 'area_id', 'location_id'],
              merge(existing, incoming, { args }) {
                if (!existing) return incoming;

                if (args?.['page'] === 1) {
                  return incoming;
                }

                return {
                  ...incoming,
                  data: [...(existing.data || []), ...(incoming.data || [])]
                };
              }
            }
          }
        }
      }
    }),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network', // Tối ưu hơn cho UX
        errorPolicy: 'all'
      },
      query: {
        fetchPolicy: 'network-only',
        errorPolicy: 'all'
      },
      mutate: {
        errorPolicy: 'all'
      }
    }
  };
}

@NgModule({
  declarations: [
    ChuyenKhoComponent,
    NhapKhoComponent,
    XuatHangTheoDonBanHangComponent,
    PheDuyetComponent,
    AlertDialogComponent,
    ChiTietNhapKhoComponent,
    QuanLyKhoComponent,
    ScanCheckComponent,
    AddYeuCauChuyenKhoComponent,
    ChuyenKhoDetailComponent,
    ScanDetailComponent,
    ScanDetailXuatHangComponent,
    XuatHangDetailComponent,
    AddXuatHangTheoDonBanHangComponent,
  ],
  imports: [
    CommonModule,
    MatDialogModule,
    RouterLinkWithHref,
    MatSelectModule,
    FormsModule,
    MatCheckboxModule,
    MatInputModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatMenuModule,
    MatAutocompleteModule,
    MatSnackBarModule,
    ConfirmDialogComponent,
    MatTooltipModule,
    ConfirmDialogXuatHangComponent,
  ],
  exports: [MatIconModule, MatTableModule, MatDialogModule, ConfirmDialogComponent],
  providers: [
    InventoryGraphqlService,
    {
      provide: APOLLO_OPTIONS,
      useFactory: createApollo,
      deps: [HttpLink]
    }
  ]
})
export class KhoThanhPhamModule { }