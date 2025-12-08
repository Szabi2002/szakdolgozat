import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  MatTableModule,
  MatTableDataSource,
} from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { RoutesService, Route } from '../../../core/services/routes.service';
import { RouteFormDialogComponent } from '../route-form-dialog/route-form-dialog.component';

@Component({
  selector: 'app-routes-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './routes-management.component.html',
  styleUrl: './routes-management.component.scss',
})
export class RoutesManagementComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  displayedColumns: string[] = [
    'route_number',
    'name',
    'stops_count',
    'actions',
  ];
  dataSource = new MatTableDataSource<Route>();
  searchTerm$ = new Subject<string>();
  isLoading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private routesService: RoutesService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadRoutes();
    this.setupSearch();
  }

  private loadRoutes(search?: string) {
    this.isLoading = true;
    const params = search ? { search } : {};

    this.routesService.getRoutes(params).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        this.dataSource.paginator = this.paginator;
        this.isLoading = false;
      },
      error: (err) => {
        // console.error('Failed to load routes', err);
        this.isLoading = false;
      },
    });
  }

  private setupSearch() {
    this.searchTerm$
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe((term) => {
        this.loadRoutes(term || undefined);
      });
  }

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm$.next(input.value);
  }

  onAdd() {
    this.dialog
      .open(RouteFormDialogComponent, {
        width: '600px',
        maxWidth: '95vw',
        panelClass: 'glass-dialog-panel',
        data: { mode: 'create' },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.loadRoutes();
        }
      });
  }

  onEdit(route: Route) {
    this.dialog
      .open(RouteFormDialogComponent, {
        width: '600px',
        maxWidth: '95vw',
        panelClass: 'glass-dialog-panel',
        data: { mode: 'edit', route },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.loadRoutes();
        }
      });
  }

  onDelete(route: Route) {
    if (confirm(`Biztos? "${route.name}" törlése?`)) {
      this.routesService.deleteRoute(route.id).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => this.loadRoutes(),
        error: () => {} // Error handler removed
      });
    }
  }

  viewRoute(route: Route): void {
    this.router.navigate(['/routes', route.id]);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
