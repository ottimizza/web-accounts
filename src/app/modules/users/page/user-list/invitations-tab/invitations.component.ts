import { Component, Input, OnInit, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { AuthenticationService } from '@app/authentication/authentication.service';
import { UserService } from '@app/http/users.service';
import { User } from '@shared/models/User';
import { GenericPageableResponse, PageInfo } from '@shared/models/GenericPageableResponse';
import { StorageService } from '@app/services/storage.service';
import { ModalComponent } from '@shared/components/modals/modal.component';
import { MatDialog } from '@angular/material/dialog';
import { InviteDialogComponent } from '@modules/users/dialogs/invite-dialog/invite-dialog.component';
import { Sort, MatSort } from '@angular/material/sort';
import { InvitationService } from '@app/http/invites.service';
import { IInvitation } from '@shared/models/Invitation';
import { environment } from '@env';
import { ClipboardUtils } from '@shared/utils/clipboard.utiils';
import { HTMLUtils } from '@shared/utils/html.utils';


@Component({
  selector: 'app-invitations',
  templateUrl: './invitations.component.html',
  styleUrls: ['./invitations.component.scss']
})
export class InvitationsComponent implements OnInit, AfterViewInit {

  public currentUser: User = new User();

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  public users: Array<any>;
  public pageInfo: PageInfo = new PageInfo();
  public sortInfo: any = null;

  displayedColumns: string[] = ['email', 'type', 'actions'];
  dataSource = this.users;

  constructor(
    public htmlUtils: HTMLUtils,
    public storageService: StorageService,
    public invitationService: InvitationService,
    public dialog: MatDialog) {
  }

  public fetch(pageIndex: number = 0, pageSize: number = 10, sort: Sort = null) {
    this.invitationService.fetch(pageIndex, pageSize).subscribe((response: GenericPageableResponse<any>) => {
      this.users = response.records;
      this.pageInfo = response.pageInfo;
      this.dataSource = this.users;
    });
  }

  public copyInvitationLink(invitation: IInvitation, event): void {
    if (event && event.target) {

      this.htmlUtils.removeStyles(event.target, ['animated', 'jello']);
      this.htmlUtils.addStyles(event.target, ['animated', 'jello']);
    }
    const registerUrl = `${environment.oauthBaseUrl}/register?token=${invitation.token}`;
    ClipboardUtils.copyTextToClipboard(registerUrl);
  }

  public openInvitationLink(invitation: IInvitation): void {
    const registerUrl = `${environment.oauthBaseUrl}/register?token=${invitation.token}`;
    window.open(registerUrl, '_blank');
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(InviteDialogComponent, {
      data: { name: '' }
    });

    dialogRef.afterClosed().subscribe(result => {
    });
  }

  public canInvite = () => [User.Type.ACCOUNTANT].includes(this.currentUser.type);

  public fetchCurrentUser() {
    this.storageService.onStorage(AuthenticationService.STORAGE_KEY_USERINFO, (result: any) => {
      this.currentUser = User.fromLocalStorage();
    });
    this.currentUser = User.fromLocalStorage();
  }


  onPageChange(event): void {
    const pageEvent = event;
    this.fetch(pageEvent.pageIndex, pageEvent.pageSize);
  }

  public ngOnInit() {
    this.fetch();

    this.fetchCurrentUser();
  }

  ngAfterViewInit() {
    this.sort.sortChange.subscribe((sort: Sort) => {
      const order = sort.direction;
      const attribute = sort.active;

      this.fetch(this.pageInfo.pageIndex, this.pageInfo.pageSize, sort);

    });
  }
}
