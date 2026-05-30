import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { UserModel } from '../models/user-model';
import { WebSocketService } from '../services/web-socket.service';
import { Subscription } from 'rxjs';
import { FriendshipService } from '../services/friendship.service';
import { ConversationDTO, ConversationType } from '../models/conversation-model';
import { AuthService } from '../services/auth.service';
import { Message, MessageType } from '../models/message';
import { MessageService } from '../services/message.service';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, ButtonModule, FormsModule, RouterOutlet],
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

  readonly MessageType = MessageType;

  // Attachment state
  selectedAttachmentFile: File | null = null;
  imagePreviewUrl: string | null = null;
  filePreviewName: string | null = null;

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
        this.subscribeToConversation();
        this.loadMessages();
      },
      error: (err) => {
        if (err.status === 404 || err.status === 500) {
          this.friendService.createConversation(this.chatUser!.id!).subscribe({
            next: (conv: ConversationDTO) => {
              this.conversation = conv;
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

  startCall() {
    this.router.navigate(['call'], { relativeTo: this.route });
  }

  sendMessage() {
    if (!this.isConnected || !this.conversation) {
      console.warn('Cannot send message: missing requirements');
      return;
    }

    if (this.selectedAttachmentFile) {
      const type = this.selectedAttachmentFile.type.startsWith('image/')
        ? MessageType.IMAGE
        : MessageType.FILE;
      this.webSocketService.sendAttachmentMessage(this.selectedAttachmentFile, this.conversation.id!, type);
      this.clearAttachment();
      return;
    }

    if (!this.newMessage.trim()) return;
    const messageContent = this.newMessage;
    this.newMessage = '';
    this.webSocketService.sendMessage(messageContent, this.conversation.id!);
  }

  triggerAttachmentInput(fileInput: HTMLInputElement) {
    fileInput.value = '';
    fileInput.click();
  }

  onAttachmentSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.imagePreviewUrl = null;
    this.filePreviewName = null;
    this.selectedAttachmentFile = file;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => (this.imagePreviewUrl = reader.result as string);
      reader.readAsDataURL(file);
    } else {
      this.filePreviewName = file.name;
    }
  }

  clearAttachment() {
    this.selectedAttachmentFile = null;
    this.imagePreviewUrl = null;
    this.filePreviewName = null;
  }

  get canSend(): boolean {
    return this.isConnected && (!!this.newMessage.trim() || !!this.selectedAttachmentFile);
  }

  get inputPlaceholder(): string {
    return this.selectedAttachmentFile ? 'Add a caption…' : 'Write something…';
  }

  private showTypingIndicator() {
    this.typing = true;
    setTimeout(() => this.typing = false, 1000);
  }

  onKeyUp(event: KeyboardEvent) {
    if (event.key === 'Enter') this.sendMessage();
  }

  closeChat() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  openImageFullscreen(url: string) {
    window.open(url, '_blank');
  }

  getFileIcon(mimeType: string | undefined): string {
    if (!mimeType) return '📎';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return '🗜️';
    if (mimeType.includes('text')) return '📃';
    return '📎';
  }

  formatFileSize(bytes: number | undefined): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
