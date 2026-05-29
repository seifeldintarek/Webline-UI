import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { FriendshipService } from '../services/friendship.service';
import { GroupService } from '../services/group-service.service';
import { ConversationType } from '../models/conversation-model';

declare const ZegoUIKitPrebuilt: any;

@Component({
  selector: 'app-call',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './call.component.html',
  styleUrls: ['./call.component.scss']
})
export class CallComponent implements OnInit, OnDestroy {

  isLoading = true;
  error: string | null = null;

  // ─── Zego credentials ────────────────────────────────────────────────────
  private readonly APP_ID = 1470021379;
  private readonly SERVER_SECRET = '5a8fb71ee6d7aaf30709b147b49cfb22';

  // ─── Call config (resolved from route) ───────────────────────────────────
  callType: 'private' | 'group' = 'private';
  roomId = '';

  private zp: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private friendshipService: FriendshipService,
    private groupService: GroupService
  ) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      // Route: /home/friends/chat/:userId/call  → private call
      // Route: /home/groups/chat/:groupId/call  → group call
      const userId = params['userId'] ? +params['userId'] : null;
      const groupId = params['groupId'] ? +params['groupId'] : null;

      if (userId) {
        this.callType = 'private';
        this.loadPrivateRoom(userId);
      } else if (groupId) {
        this.callType = 'group';
        this.loadGroupRoom(groupId);
      } else {
        this.error = 'Invalid call parameters.';
        this.isLoading = false;
      }
    });
  }

  private loadPrivateRoom(friendId: number) {
    this.friendshipService.getConverstaion([friendId], ConversationType.PRIVATE).subscribe({
      next: (conv) => {
        // Use the conversation ID as the room so the two participants always land in the same room
        this.roomId = conv.id!;
        this.initZego();
      },
      error: (err) => {
        console.error('Error loading private conversation:', err);
        this.error = 'Could not start call. Conversation not found.';
        this.isLoading = false;
      }
    });
  }

  private loadGroupRoom(groupId: number) {
    this.groupService.getGroupConversation(groupId).subscribe({
      next: (conv) => {
        this.roomId = conv.id!;
        this.initZego();
      },
      error: (err) => {
        console.error('Error loading group conversation:', err);
        this.error = 'Could not start call. Group conversation not found.';
        this.isLoading = false;
      }
    });
  }

  private initZego() {
    const user = this.authService.getUser();
    const userId = String(user?.id ?? Math.floor(Math.random() * 10000));
    const userName = user?.fullName ?? user?.firstName ?? `User${userId}`;

    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      this.APP_ID,
      this.SERVER_SECRET,
      this.roomId,
      userId,
      userName
    );

    this.zp = ZegoUIKitPrebuilt.create(kitToken);

    const container = document.querySelector('#zego-call-root') as HTMLElement;
    if (!container) {
      this.error = 'Call container not found.';
      this.isLoading = false;
      return;
    }

    this.zp.joinRoom({
      container,
      sharedLinks: [{
        name: 'Invite link',
        url: `${window.location.protocol}//${window.location.host}${window.location.pathname}?roomID=${this.roomId}`
      }],
      scenario: {
        mode: this.callType === 'group'
          ? ZegoUIKitPrebuilt.VideoConference
          : ZegoUIKitPrebuilt.OneONoneCall
      },
      turnOnMicrophoneWhenJoining: false,
      turnOnCameraWhenJoining: false,
      showMyCameraToggleButton: true,
      showMyMicrophoneToggleButton: true,
      showAudioVideoSettingsButton: true,
      showScreenSharingButton: true,
      showTextChat: false,
      showUserList: true,
      maxUsers: this.callType === 'group' ? 50 : 2,
      layout: 'Auto',
      showLayoutButton: false,
      onLeaveRoom: () => {
        this.router.navigate(['../'], { relativeTo: this.route });
      }
    });

    this.isLoading = false;
  }

  leaveCall() {
    if (this.zp) {
      this.zp.destroy?.();
    }
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  ngOnDestroy() {
    if (this.zp) {
      this.zp.destroy?.();
    }
  }
}
