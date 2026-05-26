import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
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


  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private get authHeader() {
    return { Authorization: `Bearer ${this.authService.getToken()}` };
  }

  getGroupConversation(memberIds: number[]) {
    return this.http.get<ConversationDTO>(
      `${this.convUrl}?participant_ids=${memberIds.join(',')}&conversation_type=${ConversationType.GROUP}`,
      { headers: { Authorization: `Bearer ${this.authService.getToken()}` } }
    );
  }

  // GET /group/{groupId}
  getGroup(groupId: number) {
    return this.http.get<GroupModel>(
      `${this.baseUrl}/${groupId}`,
      { headers: this.authHeader }
    );
  }

  getUserGroups(page: number = 1) {
    const userId = this.authService.getId();

    if (!userId) {
      throw new Error('User ID is missing');
    }

    const pageIndex = page - 1;

    return this.http.get<PageResponse<GroupModel>>(
      `${this.baseUrl}/${userId}/groups?page=${pageIndex}&size=10&sort=id,asc`,
      { headers: this.authHeader }
    );
  }

  // POST /group
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

  // PATCH /group/{groupId}
  updateGroup(groupId: number, dto: Partial<GroupDTO>) {
    return this.http.patch<GroupModel>(
      `${this.baseUrl}/${groupId}`,
      dto,
      { headers: this.authHeader }
    );
  }

  // DELETE /group/{groupId}
  deleteGroup(groupId: number) {
    return this.http.delete<void>(
      `${this.baseUrl}/${groupId}`,
      { headers: this.authHeader }
    );
  }

  // GET /group/{groupId}/members
  getMembers(groupId: number, page: number = 1) {
    const pageIndex = page - 1;
    return this.http.get<PageResponse<GroupMemberModel>>(
      `${this.baseUrl}/${groupId}/members?page=${pageIndex}&size=10`,
      { headers: this.authHeader }
    );
  }

  // GET /group/{groupId}/admin
  getAdmins(groupId: number, page: number = 1) {
    const pageIndex = page - 1;
    return this.http.get<PageResponse<GroupMemberModel>>(
      `${this.baseUrl}/${groupId}/admin?page=${pageIndex}&size=10`,
      { headers: this.authHeader }
    );
  }

  // PATCH /group/{groupId}/setAdmin/{userId}
  setAdmin(groupId: number, userId: number) {
    return this.http.patch<GroupMemberModel>(
      `${this.baseUrl}/${groupId}/setAdmin/${userId}`,
      {},
      { headers: this.authHeader }
    );
  }

  // GET /group/{groupId}/isMember/{userId}
  isMember(groupId: number, userId: number) {
    return this.http.get<boolean>(
      `${this.baseUrl}/${groupId}/isMember/${userId}`,
      { headers: this.authHeader }
    );
  }
}
