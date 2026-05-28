import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { SignupComponent } from './auth/signup/signup.component';
import { HomeComponent } from './home/home.component';
import { SearchComponent } from './search/search.component';
import { FriendshipComponent } from './friendship/friendship.component';
import { RequestsComponent } from './requests/requests.component';
import { UpdateProfileComponent } from './updateprofile/updateprofile.component';
import { AuthGuard } from './auth/auth/auth.guard';
import { ChatComponent } from './chat/chat.component';
import { GroupsComponent } from './groups/groups.component';
import { GroupChatComponent } from './group-chat/group-chat.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'groups', component: GroupsComponent,
        children: [
          { path: 'chat/:groupId', component: GroupChatComponent }
        ]
      },
      { path: '', redirectTo: 'search', pathMatch: 'full' },
      { path: 'search', component: SearchComponent },
      {
        path: 'friends', component: FriendshipComponent,
        children: [
          { path: 'chat/:userId', component: ChatComponent }
        ]
      },
      { path: 'requests', component: RequestsComponent },
      { path: 'update-profile', component: UpdateProfileComponent }
    ]
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];
