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
import { switchMap } from 'rxjs';

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

  constructor(
    private groupService: GroupService,
    private groupMemberService: GroupMemberService,
    private friendshipService: FriendshipService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.loadGroups();
  }

  // ── Groups ───────────────────────────────────────────────────────────────────

  loadGroups() {
    this.groupService.getUserGroups(this.page).subscribe({
      next: (data) => { this.groups = data.content; },
      error: (err) => console.error('Error loading groups:', err)
    });
  }

  // ── Create ───────────────────────────────────────────────────────────────────

  // add this property
  groupConversationMap = new Map<number, string>();

  // update createGroup()
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

  // update toggleMember()
  toggleMember(friend: UserModel) {
    if (!this.selectedGroup?.id || !friend.id) return;
    const convId = this.groupConversationMap.get(this.selectedGroup.id);
    if (!convId) {
      this.addMemberError = 'Conversation not found.';
      return;
    }

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

  openAddMembers(group: GroupModel) {
    this.selectedGroup = group;
    this.addedMemberIds.clear();
    this.addMemberError = '';
    this.friendsPage = 1;
    this.loadFriends();

    // fetch conversation if not already in map
    if (!this.groupConversationMap.has(group.id!)) {
      this.groupService.getGroupConversation(group.id!).subscribe({
        next: (conv) => this.groupConversationMap.set(group.id!, conv.id!),
        error: () => this.addMemberError = 'Conversation not found.'
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

  // ── Delete ───────────────────────────────────────────────────────────────────

  deleteGroup(groupId: number) {
    this.groupService.deleteGroup(groupId).subscribe({
      next: () => {
        this.groups = this.groups.filter(g => g.id !== groupId);
        this.router.navigate(['./'], { relativeTo: this.route });
      },
      error: (err) => console.error('Error deleting group:', err)
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
        if (data.content.length > 0) { this.groups = data.content; this.page++; }
      },
      error: (err) => console.error(err)
    });
  }

  prevPage() {
    if (this.page > 1) {
      this.groupService.getUserGroups(this.page - 1).subscribe({
        next: (data) => { this.groups = data.content; this.page--; },
        error: (err) => console.error(err)
      });
    }
  }
}
