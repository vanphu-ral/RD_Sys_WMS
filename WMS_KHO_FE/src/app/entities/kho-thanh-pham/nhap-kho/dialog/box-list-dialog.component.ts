import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';


@Component({
  selector: 'jhi-box-list-dialog',
  templateUrl: './box-list-dialog.component.html',
  styleUrls: ['./box-list-dialog.component.scss'],
  standalone: false,
})
export class BoxListDialogComponent {
  pallet: any;
  listBox: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<BoxListDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { pallet: any }
  ) {
    this.pallet = data?.pallet || {};
    this.listBox = Array.isArray(this.pallet.listBox) ? this.pallet.listBox : [];
  }

  close(): void {
    this.dialogRef.close();
  }
}
