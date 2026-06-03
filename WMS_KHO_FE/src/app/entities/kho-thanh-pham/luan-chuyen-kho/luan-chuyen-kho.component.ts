import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PermissionService } from '../../../services/permission.service';

@Component({
    selector: 'app-luan-chuyen-kho',
    standalone: false,
    templateUrl: './luan-chuyen-kho.component.html',
    styleUrls: ['./luan-chuyen-kho.component.scss'],
})
export class LuanChuyenKhoComponent {
    canModify = true;

    constructor(
        private router: Router,
        private permissionService: PermissionService
    ) {
        this.canModify = this.permissionService.canPerformKhoThanhPhamActions();
    }

    navigateToCreate(): void {
        this.router.navigate(['kho-thanh-pham/luan-chuyen-kho/list']);
    }

    navigateToApprove(): void {
        this.router.navigate(['kho-thanh-pham/luan-chuyen-kho/list'], {
            queryParams: { mode: 'approve' }
        });
    }

    navigateToViewList(): void {
        this.router.navigate(['kho-thanh-pham/luan-chuyen-kho/list']);
    }
}