import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { GroupService } from '../services/group-service.service';
import { GroupMemberService } from '../services/group-member.service';
import { FriendshipService } from '../services/friendship.service';
import { GroupModel } from '../models/group-model';
import { UserModel } from '../models/user-model';
import { forkJoin, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';

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

  /** IDs of groups where the current user is an admin — drives button label/color */
  adminGroupIds = new Set<number>();

  // FIX 1: track whether admin statuses have finished loading
  adminStatusesLoaded = false;

  // Create modal
  showCreateModal = false;
  newGroupName = '';
  newGroupDescription = '';
  newGroupImage = '';
  createError = '';

  // Add members modal
  showAddMembersModal = false;
  selectedGroup: GroupModel | null = null;
  friends: UserModel[] = [];
  friendsPage: number = 1;
  addedMemberIds = new Set<number>();
  addMemberError = '';

  // FIX 2: track conversation loading state for the add-members modal
  conversationLoading = false;

  groupConversationMap = new Map<number, string>();

  constructor(
    private groupService: GroupService,
    private groupMemberService: GroupMemberService,
    private friendshipService: FriendshipService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.loadGroups();
  }

  // ── Groups ───────────────────────────────────────────────────────────────────

  loadGroups() {
    this.groupService.getUserGroups(this.page).subscribe({
      next: (data) => {
        this.groups = data.content;
        this.loadAdminStatuses(data.content);
      },
      error: (err) => console.error('Error loading groups:', err)
    });
  }

  /**
   * Fires isAdmin for every group in parallel and populates adminGroupIds.
   * FIX 1: Sets adminStatusesLoaded = true after all checks complete,
   * preventing the race condition where deleteOrLeaveGroup() is called
   * before admin statuses are known.
   */
  private loadAdminStatuses(groups: GroupModel[]) {
    const userId = this.authService.getId()!;
    this.adminStatusesLoaded = false;

    if (!groups.length) {
      this.adminStatusesLoaded = true;
      return;
    }

    const checks = groups.map(g =>
      this.groupMemberService.isAdmin(g.id!, userId)
    );

    forkJoin(checks).subscribe({
      next: (results) => {
        results.forEach((isAdmin, i) => {
          if (isAdmin) this.adminGroupIds.add(groups[i].id!);
        });
        this.adminStatusesLoaded = true;
      },
      error: (err) => {
        console.error('Error loading admin statuses:', err);
        this.adminStatusesLoaded = true; // unblock even on error
      }
    });
  }

  isAdmin(groupId: number): boolean {
    return this.adminGroupIds.has(groupId);
  }

  // ── Create ───────────────────────────────────────────────────────────────────

  createGroup() {
    if (!this.newGroupName.trim()) return;
    this.createError = '';
    this.groupService.createGroup(
      this.newGroupName.trim(),
      this.newGroupDescription.trim() || null,
      this.newGroupImage.trim() || null
    ).pipe(
      switchMap(group => {
        this.groups.unshift(group);
        // Creator is always admin
        this.adminGroupIds.add(group.id!);
        return this.groupService.createGroupConversation(group, []);
      })
    ).subscribe({
      next: (conv) => {
        const group = this.groups[0];
        this.groupConversationMap.set(group.id!, conv.id!);
        this.closeCreateModal();
      },
      error: (err) => {
        console.error('Error creating group or conversation:', err);
        this.createError = 'Failed to create group. Please try again.';
      }
    });
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.newGroupName = '';
    this.newGroupDescription = '';
    this.newGroupImage = '';
    this.createError = '';
  }

  onCreateOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeCreateModal();
    }
  }

  // ── Add Members ──────────────────────────────────────────────────────────────

  toggleMember(friend: UserModel) {
    if (!this.selectedGroup?.id || !friend.id) return;

    // FIX 2: block interactions while conversation is still loading
    if (this.conversationLoading) {
      this.addMemberError = 'Please wait, loading conversation...';
      return;
    }

    const convId = this.groupConversationMap.get(this.selectedGroup.id);
    if (!convId) {
      this.addMemberError = 'Conversation not found.';
      return;
    }

    this.addMemberError = '';

    if (this.addedMemberIds.has(friend.id)) {
      this.groupMemberService.removeMember(this.selectedGroup.id, friend.id).pipe(
        switchMap(() => this.groupService.getConversationById(convId)),
        switchMap(conv => {
          const updatedParticipants = conv.participants.filter(p => p !== friend.id);
          return this.groupService.updateGroupConversation(convId, { ...conv, participants: updatedParticipants });
        })
      ).subscribe({
        next: () => this.addedMemberIds.delete(friend.id!),
        error: () => { this.addMemberError = 'Failed to remove member.'; }
      });
    } else {
      this.groupMemberService.isMember(this.selectedGroup.id, friend.id).pipe(
        switchMap(isMember => {
          if (isMember) {
            this.addedMemberIds.add(friend.id!);
            return this.groupService.getConversationById(convId);
          }
          return this.groupMemberService.addMember(this.selectedGroup!.id!, friend.id!).pipe(
            switchMap(() => this.groupService.getConversationById(convId))
          );
        }),
        switchMap(conv => {
          const updatedParticipants = Array.from(new Set([...conv.participants, friend.id!]));
          return this.groupService.updateGroupConversation(convId, { ...conv, participants: updatedParticipants });
        })
      ).subscribe({
        next: () => this.addedMemberIds.add(friend.id!),
        error: () => { this.addMemberError = 'Failed to add member.'; }
      });
    }
  }

  openAddMembers(group: GroupModel) {
    this.selectedGroup = group;
    this.addedMemberIds.clear();
    this.addMemberError = '';
    this.friendsPage = 1;
    this.loadFriends();

    // FIX 2: set loading flag so toggleMember() blocks until conv is ready
    if (!this.groupConversationMap.has(group.id!)) {
      this.conversationLoading = true;
      this.groupService.getGroupConversation(group.id!).subscribe({
        next: (conv) => {
          this.groupConversationMap.set(group.id!, conv.id!);
          this.conversationLoading = false;
        },
        error: () => {
          this.addMemberError = 'Conversation not found.';
          this.conversationLoading = false;
        }
      });
    }

    this.showAddMembersModal = true;
  }

  loadFriends() {
    this.friendshipService.getUserFriends(this.friendsPage).subscribe({
      next: (data) => { this.friends = data.content; },
      error: (err) => console.error('Error loading friends:', err)
    });
  }

  closeAddMembersModal() {
    this.showAddMembersModal = false;
    this.selectedGroup = null;
    this.friends = [];
    this.addedMemberIds.clear();
    this.addMemberError = '';
    this.conversationLoading = false;
  }

  onAddMembersOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeAddMembersModal();
    }
  }

  friendsNextPage() {
    this.friendshipService.getUserFriends(this.friendsPage + 1).subscribe({
      next: (data) => {
        if (data.content.length > 0) {
          this.friends = data.content;
          this.friendsPage++;
        }
      },
      error: (err) => console.error(err)
    });
  }

  friendsPrevPage() {
    if (this.friendsPage > 1) {
      this.friendshipService.getUserFriends(this.friendsPage - 1).subscribe({
        next: (data) => { this.friends = data.content; this.friendsPage--; },
        error: (err) => console.error(err)
      });
    }
  }

  // ── Delete / Leave ───────────────────────────────────────────────────────────

  /**
   * FIX 1: Guard against clicking before admin statuses finish loading.
   * If statuses are still loading, fetch isAdmin fresh from the server
   * to guarantee correctness instead of relying on a possibly-empty Set.
   */
  deleteOrLeaveGroup(groupId: number) {
    const userId = this.authService.getId()!;

    if (!this.adminStatusesLoaded) {
      // Statuses not ready yet — ask the server directly to be safe
      this.groupMemberService.isAdmin(groupId, userId).subscribe({
        next: (isAdmin) => {
          if (isAdmin) {
            this.adminGroupIds.add(groupId);
            this.deleteEntireGroup(groupId);
          } else {
            this.leaveGroup(groupId, userId);
          }
        },
        error: (err) => console.error('Error checking admin status:', err)
      });
      return;
    }

    if (this.isAdmin(groupId)) {
      this.deleteEntireGroup(groupId);
    } else {
      this.leaveGroup(groupId, userId);
    }
  }

  private deleteEntireGroup(groupId: number) {
    const convId = this.groupConversationMap.get(groupId);

    const doDelete = (id: string) =>
      this.groupService.deleteGroupConversationAndMessages(id).pipe(
        switchMap(() => this.groupService.deleteGroup(groupId))
      );

    const finalize = () => {
      this.groups = this.groups.filter(g => g.id !== groupId);
      this.adminGroupIds.delete(groupId);
      this.groupConversationMap.delete(groupId);
      this.router.navigate(['./'], { relativeTo: this.route });
    };

    if (convId) {
      doDelete(convId).subscribe({ next: finalize, error: (err) => console.error('Error deleting group:', err) });
    } else {
      this.groupService.getGroupConversation(groupId).pipe(
        switchMap(conv => doDelete(conv.id!))
      ).subscribe({
        next: finalize,
        error: (err) => {
          console.warn('Conversation not found, deleting group only:', err);
          this.groupService.deleteGroup(groupId).subscribe({ next: finalize, error: (e) => console.error(e) });
        }
      });
    }
  }

  private leaveGroup(groupId: number, userId: number) {
    this.groupMemberService.removeMember(groupId, userId).pipe(
      switchMap(() => this.groupService.getGroupConversation(groupId)),
      switchMap(conv => {
        const updated = conv.participants.filter(p => p !== userId);
        return this.groupService.updateGroupConversation(conv.id!, { ...conv, participants: updated });
      })
    ).subscribe({
      next: () => {
        this.groups = this.groups.filter(g => g.id !== groupId);
        this.groupConversationMap.delete(groupId);
        this.router.navigate(['./'], { relativeTo: this.route });
      },
      error: (err) => console.error('Error leaving group:', err)
    });
  }

  // ── Navigation ───────────────────────────────────────────────────────────────

  openGroupChat(group: GroupModel) {
    this.router.navigate(['chat', group.id], { relativeTo: this.route });
  }

  // ── Pagination ───────────────────────────────────────────────────────────────

  nextPage() {
    this.groupService.getUserGroups(this.page + 1).subscribe({
      next: (data) => {
        if (data.content.length > 0) {
          this.groups = data.content;
          this.page++;
          this.adminGroupIds.clear(); // clear stale entries before reloading
          this.loadAdminStatuses(data.content);
        }
      },
      error: (err) => console.error(err)
    });
  }

  prevPage() {
    if (this.page > 1) {
      this.groupService.getUserGroups(this.page - 1).subscribe({
        next: (data) => {
          this.groups = data.content;
          this.page--;
          this.adminGroupIds.clear(); // clear stale entries before reloading
          this.loadAdminStatuses(data.content);
        },
        error: (err) => console.error(err)
      });
    }
  }
}
