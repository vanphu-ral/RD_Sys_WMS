import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UrlEncoderService } from './services/url-encoder.service';

@Component({
  selector: 'app-encoded-redirect',
  template: '',
})
export class EncodedRedirectComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private encoder: UrlEncoderService
  ) {}

  ngOnInit(): void {
    const encoded = this.route.snapshot.paramMap.get('encodedUrl');
    if (encoded) {
      const decodedUrl = this.encoder.decode(encoded);
      if (decodedUrl) {
        const segments = decodedUrl.split('/');
        this.router.navigate(segments);
      }
    }
  }
}
