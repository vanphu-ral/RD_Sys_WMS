// filter-dialog.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface FilterDialogData {
  columnName: string;
  currentValues: any[]; 
  selectedValues: any[]; 
}

@Component({
  selector: 'app-filter-dialog',
  templateUrl: './filter-dialog.component.html',
  styleUrls: ['./filter-dialog.component.scss'],
  standalone: true,
  imports: [CommonModule, MatCheckboxModule, MatDialogModule, MatButtonModule],
})
export class FilterDialogComponent implements OnInit {
  filterOptions: { value: any, selected: boolean }[] = [];

  constructor(
    public dialogRef: MatDialogRef<FilterDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FilterDialogData
  ) {}

  ngOnInit(): void {
    const uniqueValues = [...new Set(this.data.currentValues)];
    this.filterOptions = uniqueValues.map(value => ({
      value: value,
      selected: this.data.selectedValues.includes(value) 
    }));
  }

  getSelectedFilters(): any[] {
    return this.filterOptions
      .filter(option => option.selected)
      .map(option => option.value);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
