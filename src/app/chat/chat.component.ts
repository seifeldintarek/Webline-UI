import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserModel } from '../models/user-model';
import { WebSocketService } from '../services/web-socket.service';
import { Subscription } from 'rxjs';
import { FriendshipService } from '../services/friendship.service';
import { ConversationDTO, ConversationType } from '../models/conversation-model';
import { AuthService } from '../services/auth.service';
import { Message } from '../models/message';
import { MessageService } from '../services/message.service';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, ButtonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy {
  chatUser: UserModel | null = null;
  messages: Message[] = [];
  newMessage = '';
  typing = false;
  isConnected = false;
  initials = '';
  conversation: ConversationDTO | null = null;
  currentId = this.authService.getId();
  isLoading = true;

  private messageSubscription!: Subscription;
  private connectionSubscription!: Subscription;
  private routeSubscription!: Subscription;

  constructor(
    private webSocketService: WebSocketService,
    private friendService: FriendshipService,
    private authService: AuthService,
    private userService: UserService,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    this.routeSubscription = this.route.params.subscribe(params => {
      const userId = +params['userId'];
      console.log("Loading chat for user ID:", userId);
      if (userId) {
        // ✅ Reset state on every route change
        this.chatUser = null;
        this.messages = [];
        this.conversation = null;
        this.isLoading = true;

        const navUser = history.state?.user as UserModel;
        if (navUser && navUser.id === userId) {
          this.chatUser = navUser;
          this.setInitials();
          this.loadConversation();
        } else {
          this.loadUser(userId);
        }
      }
    });

    this.connectionSubscription = this.webSocketService.getConnectionStatus().subscribe(status => {
      this.isConnected = status;
      console.log("WebSocket connection status:", this.isConnected);
      if (this.isConnected && this.conversation) {
        this.webSocketService.subscribeToConversation(this.conversation.id!);
      }
    });

    this.messageSubscription = this.webSocketService.onMessage().subscribe((message: Message) => {
      console.log('Received real-time message in component:', message);
      if (message.conversationId === this.conversation?.id) {
        const exists = this.messages.some(m =>
          m.timestamp === message.timestamp &&
          m.senderId === message.senderId &&
          m.content === message.content
        );
        if (!exists) {
          this.messages.push(message);
          this.showTypingIndicator();
        }
      }
    });
  }

  private setInitials() {
    if (!this.chatUser) return;
    this.initials = (
      (this.chatUser.firstName?.[0] ?? '') +
      (this.chatUser.lastName?.[0] ?? '')
    ).toUpperCase();
  }

  private loadUser(userId: number) {
    this.userService.getUserById(userId).subscribe({
      next: (user: UserModel) => {
        this.chatUser = user;
        console.log("Loaded user:", this.chatUser);
        this.setInitials();
        this.loadConversation();
      },
      error: (err) => {
        console.error("Error loading user:", err);
        this.isLoading = false;
        this.router.navigate(['../'], { relativeTo: this.route });
      }
    });
  }

  private loadConversation() {
    if (!this.chatUser?.id) return;

    this.friendService.getConverstaion([this.chatUser.id!], ConversationType.PRIVATE).subscribe({
      next: (conv: ConversationDTO) => {
        this.conversation = conv;
        console.log("Fetched existing conversation:", this.conversation);
        this.subscribeToConversation();
        this.loadMessages();
      },
      error: (err) => {
        if (err.status === 404 || err.status === 500) {
          // ✅ Create conversation if it doesn't exist
          console.log("Conversation not found, creating...");
          this.friendService.createConversation(this.chatUser!.id!).subscribe({
            next: (conv: ConversationDTO) => {
              this.conversation = conv;
              console.log("Created new conversation:", this.conversation);
              this.subscribeToConversation();
              this.loadMessages();
            },
            error: (createErr) => {
              console.error("Error creating conversation:", createErr);
              this.isLoading = false;
            }
          });
        } else {
          console.error("Error fetching conversation:", err);
          this.isLoading = false;
        }
      }
    });
  }

  // ✅ Extracted repeated logic into one method
  private subscribeToConversation() {
    if (this.isConnected && this.conversation?.id) {
      this.webSocketService.subscribeToConversation(this.conversation.id!);
    }
  }

  private loadMessages() {
    if (!this.conversation?.id) {
      this.isLoading = false;
      return;
    }

    this.messageService.getMessages(this.conversation.id!).subscribe({
      next: (msgs: Message[]) => {
        this.messages = msgs;
        this.isLoading = false;
        console.log("Loaded messages:", this.messages);
      },
      error: (err: any) => {
        console.error("Error fetching messages:", err);
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy() {
    if (this.conversation?.id) {
      this.webSocketService.unsubscribeFromConversation(this.conversation.id!);
    }
    this.messageSubscription?.unsubscribe();
    this.connectionSubscription?.unsubscribe();
    this.routeSubscription?.unsubscribe();
  }

  sendMessage() {
    console.log('Send check:', {
      message: this.newMessage.trim(),
      isConnected: this.isConnected,
      conversation: this.conversation
    });

    if (!this.newMessage.trim() || !this.isConnected || !this.conversation) {
      console.warn('Cannot send message: missing requirements');
      return;
    }

    const messageContent = this.newMessage;
    this.newMessage = '';
    this.webSocketService.sendMessage(messageContent, this.conversation.id!);
  }

  private showTypingIndicator() {
    this.typing = true;
    setTimeout(() => this.typing = false, 1000);
  }

  onKeyUp(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.sendMessage();
    }
  }

  closeChat() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }
}
