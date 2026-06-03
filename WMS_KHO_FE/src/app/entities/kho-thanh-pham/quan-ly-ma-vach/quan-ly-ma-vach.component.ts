import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { PermissionService } from '../../../services/permission.service';


@Component({
    selector: 'app-quan-ly-ma-vach-component',
    standalone: false,
    templateUrl: './quan-ly-ma-vach.component.html',
    styleUrl: './quan-ly-ma-vach.component.scss',
})
export class QuanLyMaVachComponent {
    canModify = true;

    constructor(
        private router: Router,
        private permissionService: PermissionService
    ) {
        this.canModify = this.permissionService.canPerformKhoThanhPhamActions();
    }
    redirecSplit(): void {
        this.router.navigate(
            ['kho-thanh-pham/quan-ly-ma-vach/tach-ma'],
        );
    }
    onRefresh(): void {
        //code refresh
    }
}