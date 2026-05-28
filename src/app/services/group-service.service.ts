import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { switchMap } from 'rxjs';
import { AuthService } from './auth.service';
import { GroupModel } from '../models/group-model';
import { GroupMemberModel } from '../models/group-member-model';
import { PageResponse } from '../models/page-response';
import { UserModel } from '../models/user-model';
import { ConversationDTO, ConversationType } from '../models/conversation-model';

export interface GroupDTO {
  id?: number | null;
  name: string;
  description?: string | null;
  image?: string | null;
  createdBy: UserModel | null;
}

@Injectable({
  providedIn: 'root'
})
export class GroupService {

  private readonly baseUrl = 'http://localhost:5500/api/users/group';
  private readonly userBaseUrl = 'http://localhost:5500/api/users';
  private convUrl = 'http://localhost:5600/api/conversation';
  private msgBase = 'http://localhost:5600/api/messages';


  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private get authHeader() {
    return { Authorization: `Bearer ${this.authService.getToken()}` };
  }

  getGroupConversation(groupId: number) {
    return this.http.get<ConversationDTO>(
      `${this.convUrl}/group/${groupId}`,
      { headers: this.authHeader }
    );
  }

  // new — used by toggleMember
  getConversationById(convId: string) {
    return this.http.get<ConversationDTO>(
      `${this.convUrl}/${convId}`,
      { headers: this.authHeader }
    );
  }

  // NEW — call this right after createGroup() succeeds
  createGroupConversation(group: GroupModel, memberIds: number[]) {
    const currentId = this.authService.getId()!;
    const participants = Array.from(new Set([currentId, ...memberIds]));

    const conversation: ConversationDTO = {
      id: null,
      type: ConversationType.GROUP,
      groupId: group.id,
      name: group.name,
      participants,
      isBlocked: {},
      createdAt: null,
      updatedAt: null,
      lastModifiedBy: null,
    };

    return this.http.post<ConversationDTO>(
      this.convUrl,
      conversation,
      { headers: this.authHeader }
    );
  }

  // unchanged from here down
  getGroup(groupId: number) {
    return this.http.get<GroupModel>(
      `${this.baseUrl}/${groupId}`,
      { headers: this.authHeader }
    );
  }

  updateGroupConversation(convId: string, conv: ConversationDTO) {
    return this.http.put<ConversationDTO>(
      `${this.convUrl}/${convId}`,
      conv,
      { headers: this.authHeader }
    );
  }

  getUserGroups(page: number = 1) {
    const userId = this.authService.getId();
    if (!userId) throw new Error('User ID is missing');
    const pageIndex = page - 1;
    return this.http.get<PageResponse<GroupModel>>(
      `${this.baseUrl}/${userId}/groups?page=${pageIndex}&size=10&sort=id,asc`,
      { headers: this.authHeader }
    );
  }

  createGroup(name: string, description: string | null, image: string | null) {
    const dto: GroupDTO = {
      name,
      description: description || null,
      image: image || null,
      createdBy: this.authService.getUser()
    };
    return this.http.post<GroupModel>(
      `${this.baseUrl}`,
      dto,
      { headers: this.authHeader }
    );
  }

  updateGroup(groupId: number, dto: Partial<GroupDTO>) {
    return this.http.patch<GroupModel>(
      `${this.baseUrl}/${groupId}`,
      dto,
      { headers: this.authHeader }
    );
  }

  deleteGroupConversationAndMessages(convId: string) {
    // DELETE /{convId} — deletes all messages for the conversation
    // DELETE /conversation/{convId} — deletes the conversation document
    return this.http.delete<void>(
      `${this.msgBase}/${convId}`,
      { headers: this.authHeader }
    ).pipe(
      switchMap(() =>
        this.http.delete<void>(
          `${this.convUrl}/${convId}`,
          { headers: this.authHeader }
        )
      )
    );
  }

  deleteGroup(groupId: number) {
    return this.http.delete<void>(
      `${this.baseUrl}/${groupId}`,
      { headers: this.authHeader }
    );
  }

  getMembers(groupId: number, page: number = 1) {
    const pageIndex = page - 1;
    return this.http.get<PageResponse<GroupMemberModel>>(
      `${this.baseUrl}/${groupId}/members?page=${pageIndex}&size=10`,
      { headers: this.authHeader }
    );
  }


}
