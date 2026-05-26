import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { GroupMemberModel, GroupMemberDTO } from '../models/group-member-model';
import { PageResponse } from '../models/page-response';

@Injectable({
  providedIn: 'root'
})
export class GroupMemberService {

  private readonly baseUrl = 'http://localhost:5500/api/users/groupMember';
  private readonly groupUrl = 'http://localhost:5500/api/users/group';


  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private get authHeader() {
    return { Authorization: `Bearer ${this.authService.getToken()}` };
  }



  getAdmin(groupId: number, page: number = 1) {
    const pageIndex = page - 1;
    return this.http.get<PageResponse<GroupMemberModel>>(
      `${this.groupUrl}/${groupId}/admin?page=${pageIndex}&size=10`,
      { headers: this.authHeader }
    );
  }

  addMember(groupId: number, userId: number) {
    const dto: Partial<GroupMemberDTO> = {
      member: {
        id: userId, firstName: null, lastName: null,
        email: null, image: null, mobilePhone: null, password: null
      },
      role: 'MEMBER',
      group: {
        createdBy: null, description: null, image: null,
        name: '', id: groupId
      }
    };
    return this.http.post<GroupMemberModel>(
      `${this.baseUrl}`,
      dto,
      { headers: this.authHeader }
    );
  }

  removeMember(groupId: number, userId: number) {

    return this.http.delete<void>(
      `${this.baseUrl}/${groupId}/${userId}`,
      { headers: this.authHeader }
    );
  }

  setAdmin(groupId: number, userId: number) {
    return this.http.patch<GroupMemberModel>(
      `${this.baseUrl}/${groupId}/setAdmin/${userId}`,
      {},
      { headers: this.authHeader }
    );
  }

  isMember(groupId: number, userId: number) {
    return this.http.get<boolean>(
      `${this.baseUrl}/${groupId}/isMember/${userId}`,
      { headers: this.authHeader }
    );
  }

  isAdmin(groupId: number, userId: number) {
    return this.http.get<boolean>(
      `${this.baseUrl}/${groupId}/${userId}/isAdmin`,
      { headers: this.authHeader }
    );
  }
}
