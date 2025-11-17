import { Component, Input, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { provideRouter, RouterOutlet } from '@angular/router';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { SidebarService } from './sidebar.service';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Output, EventEmitter } from '@angular/core';
import { UrlEncoderService } from '../entities/encoded-redirect/services/url-encoder.service';
import { Router } from '@angular/router';

// import {AutoSizeInputDirective} from "ngx-autosize-input";

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [MatIconModule, CommonModule, RouterModule],
  animations: [
    trigger('slide', [
      state('up', style({ height: 0, overflow: 'hidden' })),
      state('down', style({ height: '*', overflow: 'hidden' })),
      transition('up  <=> down', animate('200ms ease-in-out')),
    ]),
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit {
  menus: any[] = [];
  public isSidebarCollapsed: boolean = true;
  @Input() isCollapsed: boolean = true; // Nhận trạng thái từ AppComponent

  @Output() collapseSidebar = new EventEmitter<void>();
  constructor(
    public sidebarservice: SidebarService,
    private encoder: UrlEncoderService,
    private router: Router
  ) {
    this.menus = sidebarservice.getMenuList();
  }

  ngOnInit(): void {
    this.sidebarservice.setSidebarState(true);
  }
  getSideBarState() {
    return this.sidebarservice.getSidebarState();
  }

  toggle(currentMenu: any) {
    if (currentMenu.type === 'dropdown') {
      this.menus.forEach((element) => {
        if (element === currentMenu) {
          currentMenu.active = !currentMenu.active;
        } else {
          element.active = false;
        }
      });
    }
  }

  getState(currentMenu: any) {
    if (currentMenu.active) {
      return 'down';
    } else {
      return 'up';
    }
  }

  //   toggleSidebar() {
  //   this.sidebarservice.setSidebarState(!this.sidebarservice.getSidebarState());
  // }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    if (this.isSidebarCollapsed) {
      // Optionally, collapse all active submenus when the sidebar collapses
      this.menus.forEach((menu) => {
        if (menu.type === 'dropdown') {
          menu.active = false;
        }
      });
    }
  }
  onMenuClick(menu: any): void {
    if (menu.type !== 'dropdown') {
      const encoded = this.encoder.encode(menu.link);
      this.router.navigate(['/encoded', encoded]);

      if (!this.isCollapsed) {
        this.collapseSidebar.emit();
      }
    }
  }

  onSubmenuClick(submenu: any): void {
    const encoded = this.encoder.encode(submenu.link);
    this.router.navigate(['/encoded', encoded]);

    if (!this.isCollapsed) {
      this.collapseSidebar.emit();
    }
  }
}
