import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-luan-chuyen-kho',
    standalone: false,
    templateUrl: './luan-chuyen-kho.component.html',
    styleUrls: ['./luan-chuyen-kho.component.scss'],
})
export class LuanChuyenKhoComponent {
    constructor(private router: Router) { }

    navigateToCreate(): void {
        this.router.navigate(['kho-thanh-pham/luan-chuyen-kho/list']);
    }

    navigateToApprove(): void {
        this.router.navigate(['kho-thanh-pham/luan-chuyen-kho/list'], {
            queryParams: { mode: 'approve' }
        });
    }
}