import { Injectable } from '@angular/core';
import { GroupModel } from '../models/group-model';

@Injectable({
  providedIn: 'root'
})
export class GroupServiceService {

  private apiUrl = 'http://localhost:5500/api/users';
  private convUrl = 'http://localhost:5600/api/conversation';
  private pageParam = '&size=10&sort=id,asc';
  private friends: GroupModel[] = [];


  constructor() { }
}
