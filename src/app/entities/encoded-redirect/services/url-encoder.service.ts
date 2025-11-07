import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UrlEncoderService {
  encode(url: string): string {
    return btoa(encodeURIComponent(url));
  }

  decode(encoded: string): string {
    try {
      return decodeURIComponent(atob(encoded));
    } catch (e) {
      console.error('URL mã hoá không hợp lệ:', encoded);
      return '';
    }
  }
}
