
import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom, inject } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
// import { provideHttpClient } from '@angular/common/http';
// import { provideApollo } from 'apollo-angular';
// import { HttpLink } from 'apollo-angular/http';
// import { InMemoryCache } from '@apollo/client/core';

bootstrapApplication(AppComponent, {
  ...appConfig // appConfig đã chứa tất cả providers cần thiết
}).catch(err => console.error(err));
