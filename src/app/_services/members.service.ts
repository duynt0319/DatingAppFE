import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.development';
import { Member } from '../_models/member';
import { map, of, take } from 'rxjs';
import { UserParams } from '../_models/userParams';
import { PaginatedResult } from '../_models/pagination';
import { AccountService } from './account.service';
import { User } from '../_models/user';
import { getPaginatedResults, getPaginationHeaders } from './paginationHelper';

@Injectable({
  providedIn: 'root'
})
export class MembersService {
  baseUrl = environment.apiUrl;

  //cho nay de tranh load lai trang khi da request
  members: Member[] = [];
  memberCache = new Map();
  user: User | undefined;
  userParams: UserParams | undefined;


  constructor(private http: HttpClient, private accountService: AccountService) {
    this.accountService.currnetUser$.pipe(take(1)).subscribe({
      next: user => {
        if (user) {
          this.userParams = new UserParams(user);
          this.user = user;
        }
      }
    })
   }

  getUserParams(){
    return this.userParams;
  }

  setUserParams(params: UserParams){
    this.userParams = params;
  }

  resetUserParams(){
    if(this.user){
      this.userParams = new UserParams(this.user)
      return this.userParams;
    }
    return;
  }

  getMembers(userParams: UserParams){
    const response = this.memberCache.get(Object.values(userParams).join('-'));

    if(response) return of(response);

    let params = getPaginationHeaders(userParams.pageNumber, userParams.pageSize);

    params = params.append('minAge', userParams.minAge);
    params = params.append('maxAge', userParams.maxAge);
    params = params.append('gender', userParams.gender);
    params = params.append('orderBy', userParams.orderBy);

    return getPaginatedResults<Member []>(this.baseUrl + 'users', params, this.http).pipe(
      map(response => {
        this.memberCache.set(Object.values(userParams).join('-'), response);
        return response;
      })
    )
  }

  

  getMember(username: string){
    const member = [...this.memberCache.values()]
    .reduce((arr, elem) => arr.concat(elem.result), [])
    .find((memder: Member) => memder.userName === username);

    if (member) return of(member);
    
    return this.http.get<Member>(this.baseUrl + 'users/' + username);
  }

  updateMember(member: Member){
    return this.http.put(this.baseUrl + 'users', member).pipe(
      map(() => {
        const index = this.members.indexOf(member);
        this.members[index] = {...this.members[index], ...member}
      })
    )
  }

  setMainPhoto(photoId: number){
    return this.http.put(this.baseUrl + 'users/set-main-photo/' + photoId, {});
  }

  deletePhoto(photoId: number){
    return this.http.delete(this.baseUrl + 'users/delete-photo/' + photoId);
  }

  addLike(username: string){
    return this.http.post(this.baseUrl + 'likes/' + username, {});
  }

  getLikes(predidcate: string, pageNumber: number, pageSize: number){
    let params = getPaginationHeaders(pageNumber, pageSize);

    params = params.append('predicate', predidcate);

    return getPaginatedResults<Member[]>(this.baseUrl + 'likes', params, this.http);
  }

}
