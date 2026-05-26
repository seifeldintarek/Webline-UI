import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { WebSocketService } from '../services/web-socket.service';
import { MessageService } from '../services/message.service';
import { AuthService } from '../services/auth.service';
import { FriendshipService } from '../services/friendship.service';
import { GroupService } from '../services/group-service.service';
import { GroupMemberService } from '../services/group-member.service';

import { Message } from '../models/message';
import { GroupModel } from '../models/group-model';
import { GroupMemberModel } from '../models/group-member-model';
import { ConversationDTO, ConversationType } from '../models/conversation-model';

@Component({
  selector: 'app-group-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './group-chat.component.html',
  styleUrls: ['./group-chat.component.scss'],
})
export class GroupChatComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  group!: GroupModel;
  members: GroupMemberModel[] = [];
  messages: Message[] = [];
  newMessage = '';
  isConnected = false;
  isLoading = true;
  showMembers = false;
  conversation: ConversationDTO | null = null;
  currentId = this.authService.getId();

  private messageSubscription!: Subscription;
  private connectionSubscription!: Subscription;
  private routeSubscription!: Subscription;

  constructor(
    private webSocketService: WebSocketService,
    private messageService: MessageService,
    private authService: AuthService,
    private friendshipService: FriendshipService,
    private groupService: GroupService,
    private groupMemberService: GroupMemberService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    this.routeSubscription = this.route.params.subscribe((params) => {
      const groupId = +params['groupId'];
      if (groupId) {
        this.loadGroup(groupId);
      }
    });

    this.connectionSubscription = this.webSocketService
      .getConnectionStatus()
      .subscribe((status) => {
        this.isConnected = status;
        if (this.isConnected && this.conversation) {
          this.webSocketService.subscribeToConversation(this.conversation.id!);
        }
      });

    this.messageSubscription = this.webSocketService
      .onMessage()
      .subscribe((message: Message) => {
        if (message.conversationId === this.conversation?.id) {
          const exists = this.messages.some(
            (m) =>
              m.timestamp === message.timestamp &&
              m.senderId === message.senderId &&
              m.content === message.content
          );
          if (!exists) {
            this.messages.push(message);
            this.scrollToBottom();
          }
        }
      });
  }

  private loadGroup(groupId: number) {
    this.isLoading = true;
    this.groupService.getGroup(groupId).subscribe({
      next: (group: GroupModel) => {
        this.group = group;
        this.loadMembers(groupId); // conversation loads inside here
      },
      error: (err) => {
        console.error('Error loading group:', err);
        this.router.navigate(['../'], { relativeTo: this.route });
      },
    });
  }

  private loadMembers(groupId: number) {
    this.groupService.getMembers(groupId).subscribe({
      next: (data) => {
        this.members = data.content;
        const memberIds = this.members.map(m => m.member!.id!);
        this.loadConversation(memberIds);
      },
      error: (err) => console.error('Error loading members:', err),
    });
  }

  private loadConversation(memberIds: number[]) {
    this.groupService.getGroupConversation(memberIds).subscribe({
      next: (conv: ConversationDTO) => {
        this.conversation = conv;
        this.loadMessages();
        if (this.isConnected && this.conversation) {
          this.webSocketService.subscribeToConversation(this.conversation.id!);
        }
      },
      error: (err) => {
        console.error('Error fetching group conversation:', err);
        this.isLoading = false;
      },
    });
  }


  private loadMessages() {
    if (!this.conversation) return;
    this.messageService.getMessages(this.conversation.id!).subscribe({
      next: (msgs: Message[]) => {
        this.messages = msgs;
        this.isLoading = false;
        this.scrollToBottom();
      },
      error: (err) => {
        console.error('Error fetching messages:', err);
        this.isLoading = false;
      },
    });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.isConnected || !this.conversation) {
      return;
    }
    const content = this.newMessage;
    this.newMessage = '';
    this.webSocketService.sendMessage(content, this.conversation.id!);
  }

  getMemberName(senderId: number): string {
    const member = this.members.find((m) => m.member?.id === senderId);
    if (member?.member) {
      return `${member.member.firstName ?? ''} ${member.member.lastName ?? ''}`.trim();
    }
    return senderId === this.currentId ? 'You' : `User ${senderId}`;
  }

  getMemberInitials(senderId: number): string {
    const member = this.members.find((m) => m.member?.id === senderId);
    if (member?.member) {
      const f = member.member.firstName?.[0] ?? '';
      const l = member.member.lastName?.[0] ?? '';
      return (f + l).toUpperCase();
    }
    return '??';
  }

  getMemberAvatar(senderId: number): string | null {
    const member = this.members.find((m) => m.member?.id === senderId);
    return member?.member?.image ?? null;
  }

  isAdminOf(senderId: number): boolean {
    const member = this.members.find((m) => m.member?.id === senderId);
    return member?.role === 'ADMIN';
  }

  toggleMembers() {
    this.showMembers = !this.showMembers;
  }

  trackByIndex(index: number): number {
    return index;
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.messagesContainer) {
        const el = this.messagesContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    }, 50);
  }

  ngOnDestroy() {
    if (this.conversation) {
      this.webSocketService.unsubscribeFromConversation(this.conversation.id!);
    }
    this.messageSubscription?.unsubscribe();
    this.connectionSubscription?.unsubscribe();
    this.routeSubscription?.unsubscribe();
  }
}
