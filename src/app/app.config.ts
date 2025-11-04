import { ApplicationConfig, importProvidersFrom, inject } from '@angular/core'; // Thêm inject
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpLink } from 'apollo-angular/http'; // Import HttpLink
import { provideApollo } from 'apollo-angular'; // Import provideApollo

import { routes } from './app.routes';
import { createApollo } from './graphql.module'; // Import createApollo factory trực tiếp

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes), 
    provideHttpClient(withFetch()), 
    importProvidersFrom(BrowserAnimationsModule),
    provideApollo(() => { // Sử dụng provideApollo
      const httpLink = inject(HttpLink); // Inject HttpLink
      return createApollo(httpLink); // Gọi factory createApollo của bạn
    })
  ]
};
