import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { GroupModel } from '../models/group-model';
import { PageResponse } from '../models/page-response';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, RouterOutlet],
  templateUrl: './groups.component.html',
  styleUrl: './groups.component.scss'
})
export class GroupsComponent implements OnInit {
  groups: GroupModel[] = [];
  page: number = 1;
  private pageParam = '&size=10&sort=id,asc';

  showCreateModal = false;
  newGroupName = '';
  newGroupDescription = '';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.loadGroups();
  }

  loadGroups() {
    const currentPage = this.page - 1;
    const userId = this.authService.getId();
    this.http
      .get<PageResponse<GroupModel>>(
        `http://localhost:5500/api/users/${userId}/groups?page=${currentPage}&${this.pageParam}`,
        { headers: { Authorization: `Bearer ${this.authService.getToken()}` } }
      )
      .subscribe({
        next: (data) => { this.groups = data.content; },
        error: (err) => console.error('Error loading groups:', err)
      });
  }

  createGroup() {
    if (!this.newGroupName.trim()) return;
    const userId = this.authService.getId();
    const body = {
      name: this.newGroupName.trim(),
      description: this.newGroupDescription.trim() || null,
      createdBy: userId
    };
    this.http
      .post<GroupModel>(`http://localhost:5500/api/users/groups`, body, {
        headers: { Authorization: `Bearer ${this.authService.getToken()}` }
      })
      .subscribe({
        next: (group) => {
          this.groups.unshift(group);
          this.showCreateModal = false;
          this.newGroupName = '';
          this.newGroupDescription = '';
        },
        error: (err) => console.error('Error creating group:', err)
      });
  }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.showCreateModal = false;
    }
  }

  openGroupChat(group: GroupModel) {
    this.router.navigate(['chat', group.id], { relativeTo: this.route });
  }

  leaveGroup(groupId: number) {
    const userId = this.authService.getId();
    this.http
      .delete(`http://localhost:5500/api/users/${userId}/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${this.authService.getToken()}` }
      })
      .subscribe({
        next: () => {
          this.groups = this.groups.filter(g => g.id !== groupId);
          this.router.navigate(['groups']);
        },
        error: (err) => console.error('Error leaving group:', err)
      });
  }

  nextPage() {
    const userId = this.authService.getId();
    this.http
      .get<PageResponse<GroupModel>>(
        `http://localhost:5500/api/users/${userId}/groups?page=${this.page}&${this.pageParam}`,
        { headers: { Authorization: `Bearer ${this.authService.getToken()}` } }
      )
      .subscribe({
        next: (data) => {
          if (data.content.length > 0) { this.groups = data.content; this.page++; }
        },
        error: (err) => console.error('Error loading next page:', err)
      });
  }

  prevPage() {
    if (this.page > 1) {
      const userId = this.authService.getId();
      this.http
        .get<PageResponse<GroupModel>>(
          `http://localhost:5500/api/users/${userId}/groups?page=${this.page - 2}&${this.pageParam}`,
          { headers: { Authorization: `Bearer ${this.authService.getToken()}` } }
        )
        .subscribe({
          next: (data) => { this.groups = data.content; this.page--; },
          error: (err) => console.error('Error loading prev page:', err)
        });
    }
  }
}
