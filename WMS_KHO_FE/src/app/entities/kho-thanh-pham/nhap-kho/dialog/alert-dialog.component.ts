import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
@Component({
  selector: 'app-alert-dialog',
  standalone: false,
  template: `
    <h2 mat-dialog-title>Cảnh báo</h2>
    <mat-dialog-content>
      <p>{{ message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Đóng</button>
    </mat-dialog-actions>
  `
})
export class AlertDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public message: string) {}
}
