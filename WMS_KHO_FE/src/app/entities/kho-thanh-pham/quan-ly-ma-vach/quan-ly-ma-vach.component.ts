import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';


@Component({
    selector: 'app-quan-ly-ma-vach-component',
    standalone: false,
    templateUrl: './quan-ly-ma-vach.component.html',
    styleUrl: './quan-ly-ma-vach.component.scss',
})
export class QuanLyMaVachComponent {

    constructor(
        private router: Router,
    ) { }
    redirecSplit(): void {
        this.router.navigate(
            ['kho-thanh-pham/quan-ly-ma-vach/tach-ma'],
        );
    }
    onRefresh(): void {
        //code refresh
    }
}