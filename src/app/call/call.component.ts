// call.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { WebSocketService } from '../services/web-socket.service';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { UserService } from '../services/user.service';
import { CommonModule } from '@angular/common';
import { environment } from '../environment/environment';
import { ConversationDTO, ConversationType } from "../models/conversation-model";
import { FriendshipService } from '../services/friendship.service';
import { GroupService } from '../services/group-service.service';

@Component({
  selector: 'app-call',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './call.component.html',
  styleUrls: ['./call.component.scss'],
})
export class CallComponent implements OnInit, OnDestroy {
  preCallPhase = true;
  remoteUserName = '';
  remoteUserAvatar = '';
  roomId = '';
  callType: 'PRIVATE' | 'GROUP' = 'PRIVATE';
  isLoading = false;
  error: string | null = null;

  private declineSub?: Subscription;
  private receiverIds: number[] = [];

  // ── Zego session guards ──────────────────────────────────────────────────
  private zp: any = null;         // holds the active Zego instance
  private hasJoined = false;      // prevents double joinRoom
  // ────────────────────────────────────────────────────────────────────────

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private ws: WebSocketService,
    private userService: UserService,
    private friendService: FriendshipService,
    private groupService: GroupService,
  ) { }

  ngOnInit(): void {
    this.isLoading = true;

    this.declineSub = this.ws.callDeclined$.subscribe(decline => {
      if (decline.roomId === this.roomId) {
        this.navigateBack();
      }
    });

    // take(1) ensures queryParams fires exactly once,
    // preventing multiple initZego() calls on the same component instance
    this.route.queryParams.pipe(take(1)).subscribe(params => {
      if (params['roomId']) {
        // ── Incoming / accepted call ──
        this.roomId = params['roomId'];
        this.remoteUserName = params['callerName'] ?? '';
        this.remoteUserAvatar = params['callerAvatar'] ?? '';
        this.callType = params['callType'] ?? 'PRIVATE';
        this.preCallPhase = false;
        this.isLoading = false;
        this.initZego();
      } else {
        // ── Outgoing call ──
        this.resolveOutgoingCall();
      }
    });
  }

  leaveCall(): void {
    this.navigateBack();
  }

  // Called by the "Confirm / Start Call" button on the pre-call screen
  confirmCall(): void {
    if (!this.roomId) {
      this.error = 'Call setup is not ready yet.';
      return;
    }
    this.preCallPhase = false;
    this.initZego();
  }

  // Called by the "Cancel" button on the pre-call screen (before Zego starts)
  cancelCall(): void {
    const currentUser = this.auth.getUser();
    this.receiverIds.forEach(id =>
      this.ws.declineCall(id, this.roomId, currentUser.id!)
    );
    this.navigateBack();
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private resolveOutgoingCall(): void {
    const parentParams = this.route.snapshot.parent?.params ?? {};
    const userId = parentParams['userId'] ? +parentParams['userId'] : null;
    const groupId = parentParams['groupId'] ? +parentParams['groupId'] : null;
    this.callType = userId ? 'PRIVATE' : 'GROUP';

    const currentUser = this.auth.getUser();

    if (userId) {
      this.friendService.getConverstaion([userId], ConversationType.PRIVATE).subscribe({
        next: (conv: ConversationDTO) => {
          this.roomId = `conv-${conv.id}`;
          this.receiverIds = [userId];

          this.userService.getUserById(userId).subscribe({
            next: (user) => {
              this.remoteUserName = user.fullName ?? '';
              this.remoteUserAvatar = user.image ?? '';
              this.isLoading = false;
              this.preCallPhase = true;   // show pre-call screen; user clicks Confirm

              this.ws.initiateCall(userId, {
                roomId: this.roomId,
                callerId: currentUser.id!,
                callerName: currentUser.fullName ?? '',
                callerAvatar: currentUser.image ?? '',
                conversationId: conv.id!,
                callType: 'PRIVATE',
              });
            },
            error: (err) => {
              console.error('Failed to load remote user:', err);
              this.error = 'Could not load user info.';
              this.isLoading = false;
            }
          });
        },
        error: (err) => {
          console.error('Failed to load conversation:', err);
          this.error = 'Could not start call.';
          this.isLoading = false;
        }
      });

    } else if (groupId) {
      this.groupService.getGroupConversation(groupId).subscribe({
        next: (conv: ConversationDTO) => {
          this.roomId = `conv-${conv.id}`;
          this.remoteUserName = conv.name ?? 'Group Call';
          this.isLoading = false;
          this.preCallPhase = true;       // show pre-call screen; user clicks Confirm

          this.receiverIds = conv.participants?.filter(id => id !== currentUser.id) ?? [];
          this.receiverIds.forEach(participantId => {
            this.ws.initiateCall(participantId, {
              roomId: this.roomId,
              callerId: currentUser.id!,
              callerName: currentUser.fullName ?? '',
              callerAvatar: currentUser.image ?? '',
              conversationId: conv.id!,
              callType: 'GROUP',
              groupId: groupId,
            });
          });
        },
        error: (err: any) => {
          console.error('Failed to load group conversation:', err);
          this.error = 'Could not start group call.';
          this.isLoading = false;
        }
      });

    } else {
      this.error = 'Invalid call target.';
      this.isLoading = false;
    }
  }

  private initZego(): void {
    const tryInit = () => {
      const Zego = (window as any)['ZegoUIKitPrebuilt'];
      if (!Zego) {
        setTimeout(tryInit, 200);
        return;
      }
      this.startZegoSession(Zego);
    };

    tryInit();
  }

  private startZegoSession(Zego: any): void {
    // Guard: if a session is already active, do nothing.
    // This makes it safe even if initZego() is somehow triggered twice.
    if (this.hasJoined) {
      console.warn('Zego session already active — ignoring duplicate joinRoom.');
      return;
    }

    // Destroy any lingering instance from a previous call attempt
    // (e.g. user left and came back to the same component without a full destroy)
    if (this.zp) {
      try { this.zp.destroy(); } catch (_) { }
      this.zp = null;
    }

    this.hasJoined = true;

    try {
      const currentUser = this.auth.getUser();
      const token = Zego.generateKitTokenForTest(
        environment.zego.appId,
        environment.zego.serverSecret,
        this.roomId,
        String(currentUser.id),
        currentUser.fullName,
      );

      this.zp = Zego.create(token);
      this.zp.joinRoom({
        container: document.getElementById('zego-call-root'),
        scenario: {
          mode: this.callType === 'PRIVATE'
            ? Zego.OneONoneCall
            : Zego.VideoConference,
          config: { maxUsers: this.callType === 'PRIVATE' ? 2 : 50 },
        },
        turnOnMicrophoneWhenJoining: false,
        turnOnCameraWhenJoining: false,
        showPreJoinView: false,
        onLeaveRoom: () => this.navigateBack(),
      });

    } catch (err) {
      // Reset flag so a manual retry (e.g. clicking Confirm again) is allowed
      this.hasJoined = false;
      this.zp = null;
      console.error('Zego initialization failed:', err);
      this.error = 'Failed to start the call. Please try again.';
    }
  }

  private navigateBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  ngOnDestroy(): void {
    this.declineSub?.unsubscribe();

    // Clean up Zego so re-entering the call route starts fresh
    if (this.zp) {
      try { this.zp.destroy(); } catch (_) { }
      this.zp = null;
    }
    this.hasJoined = false;
  }
}
