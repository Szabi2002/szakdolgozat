import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '@shared/material/material.module';
import { AdminService } from '@core/services/admin.service';
import { User } from '@core/models/user.model';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss',
})
export class UserManagementComponent implements OnInit {
  private adminService = inject(AdminService);

  users: User[] = [];
  filteredUsers: User[] = [];
  isLoading = true;
  errorMessage = '';
  searchQuery = '';
  selectedFilter: 'all' | 'admin' | 'user' | 'provider' = 'all';

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.adminService.getUsers().subscribe({
      next: (response) => {
        this.users = response.data;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error?.message || 'Nem sikerult betolteni a felhasznalokat. Probald ujra.';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.users];

    // Apply role filter
    if (this.selectedFilter !== 'all') {
      filtered = filtered.filter(user => user.role === this.selectedFilter);
    }

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        (user.name?.toLowerCase().includes(query)) ||
        (user.email?.toLowerCase().includes(query))
      );
    }

    this.filteredUsers = filtered;
    this.totalPages = Math.ceil(this.filteredUsers.length / this.pageSize);
    this.currentPage = 1;
  }

  get paginatedUsers(): User[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredUsers.slice(start, end);
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterChange(filter: 'all' | 'admin' | 'user' | 'provider'): void {
    this.selectedFilter = filter;
    this.applyFilters();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getFilterCount(role: string): number {
    if (role === 'all') return this.users.length;
    return this.users.filter(u => u.role === role).length;
  }

  updateUserRole(userId: string, role: string): void {
    const validRole = role as 'user' | 'admin' | 'provider';
    this.adminService.updateUserRole(userId, validRole).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (error) => {
        this.errorMessage = error?.message || 'Nem sikerult frissiteni a szerepkort. Probald ujra.';
      }
    });
  }

  confirmDeleteUser(user: User): void {
    if (!confirm(`Biztosan torolni szeretned ezt a felhasznalot?\n\n${user.name || user.email}\n\nEz a muvelet nem vonhato vissza.`)) {
      return;
    }

    this.adminService.deleteUser(user.id).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (error) => {
        this.errorMessage = error?.message || 'Nem sikerult torolni a felhasznalot. Probald ujra.';
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getRoleIcon(role: string): string {
    const icons: { [key: string]: string } = {
      'user': 'person',
      'admin': 'shield',
      'provider': 'business'
    };
    return icons[role] || 'person';
  }

  getRoleLabel(role: string): string {
    const labels: { [key: string]: string } = {
      'user': 'Felhasznalo',
      'admin': 'Admin',
      'provider': 'Szolgaltato'
    };
    return labels[role] || role;
  }

  getStatusClass(user: User): string {
    // Check if user logged in within last 7 days
    if (user.last_login) {
      const lastLogin = new Date(user.last_login);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return lastLogin > weekAgo ? 'active' : 'inactive';
    }
    return 'inactive';
  }

  getUserInitials(user: User): string {
    if (user.name) {
      const parts = user.name.split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return user.name.substring(0, 2).toUpperCase();
    }
    return user.email.substring(0, 2).toUpperCase();
  }

  getDisplayEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredUsers.length);
  }
}
