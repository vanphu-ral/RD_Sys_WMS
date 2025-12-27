import { 
  ApplicationConfig, 
  importProvidersFrom, 
  provideZoneChangeDetection,
  Injector, 
  inject
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideApollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { InMemoryCache, ApolloLink } from '@apollo/client/core';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { AuthService } from './services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    importProvidersFrom(BrowserAnimationsModule),
    
    // Apollo GraphQL Configuration
    provideApollo(() => {
      console.log('[Apollo Config] Initializing...');
      
      // Get dependencies using inject()
      const httpLink = inject(HttpLink);
      const authService = inject(AuthService);

      // Auth Link - Add Bearer token
      const authLink = setContext((_, { headers }) => {
        const token = authService.getAccessToken();
        console.log('[Apollo AuthLink] Token:', token ? 'Present ✓' : 'Missing ✗');
        
        return {
          headers: {
            ...headers,
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          }
        };
      });

      // Error Link
      const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
        if (graphQLErrors) {
          graphQLErrors.forEach(({ message, locations, path, extensions }) => {
            console.error('[GraphQL Error]:', {
              message,
              path,
              extensions
            });
            
            if (extensions?.['code'] === 'UNAUTHENTICATED' || message.includes('Unauthorized')) {
              console.error('[Apollo] 401 - Token invalid');
              authService.logout().subscribe();
            }
          });
        }

        if (networkError) {
          console.error('[Network Error]:', networkError);
        }
      });

      // HTTP Link
      const http = httpLink.create({
        uri: 'http://192.168.20.101:8050/graphql',
      });

      // Combine all links
      const link = ApolloLink.from([
        errorLink,
        authLink,
        http
      ]);

      return {
        link,
        cache: new InMemoryCache(),
        defaultOptions: {
          watchQuery: {
            fetchPolicy: 'network-only',
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
    })
  ]
};