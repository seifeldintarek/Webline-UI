// src/app/call-notification/call-notification.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { WebSocketService } from '../services/web-socket.service';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { IncomingCallPayload } from '../models/call-types';

@Component({
  selector: 'app-call-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './call-notifier.component.html',
  styleUrls: ['./call-notifier.component.scss'],
})
export class CallNotificationComponent implements OnInit, OnDestroy {
  incoming: IncomingCallPayload | null = null;
  private sub?: Subscription;

  constructor(private ws: WebSocketService, private router: Router, private authService: AuthService) { }

  ngOnInit(): void {
    this.sub = this.ws.incomingCall$.subscribe(payload => {
      this.incoming = payload;
      // Auto-dismiss after 30s if not answered
      setTimeout(() => {
        if (this.incoming?.roomId === payload.roomId) {
          this.incoming = null;
        }
      }, 30_000);
    });
  }

  accept(): void {
    if (!this.incoming) return;
    const { roomId, callerName, callerAvatar, callType, conversationId } = this.incoming;

    // Navigate to the right call route
    const basePath = callType === 'PRIVATE'
      ? ['/home', 'friends', 'chat', this.incoming.callerId, 'call']
      : ['/home', 'groups', 'chat', this.incoming.groupId, 'call'];  // ← fix

    this.router.navigate(basePath, {
      queryParams: { roomId, callerName, callerAvatar, callType }  // ← add callType
    });

    this.incoming = null;
  }

  decline(): void {
    if (!this.incoming) return;
    const me = this.authService.getUser();
    this.ws.declineCall(this.incoming.callerId, this.incoming.roomId, me.id!);
    this.incoming = null;
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
