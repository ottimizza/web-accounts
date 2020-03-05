import { Component, OnInit, Input, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { User } from '@shared/models/User';
import { MatDialog } from '@angular/material/dialog';
import { SigninAsDialogComponent } from '@modules/organizations/dialogs/signin-as-dialog/signin-as-dialog.component';
// import { OverlayContainer } from '@angular/cdk/overlay';

// import { ThemeService } from '@app/service/theme.service';

export interface SidebarItem {
  icon: string;
  label: string;
  url: string;
}

@Component({
  selector: 'app-sidebar-layout',
  templateUrl: './sidebar-layout.component.html',
  styleUrls: ['./sidebar-layout.component.scss']
})
export class SidebarLayoutComponent implements OnInit {

  public items: SidebarItem[];

  constructor(@Inject(DOCUMENT) public document: Document, public dialog: MatDialog) { }

  public hide(e) {
    this.document.getElementsByTagName('body')[0].classList.remove('show-sidebar');
  }

  ngOnInit() {
    this.items = [
      { icon: 'fad fa-box', label: 'Aplicativos', url: '/dashboard/products' },
      { icon: 'fad fa-users', label: 'Usuários', url: '/dashboard/users' },
      { icon: 'fad fa-industry-alt', label: 'Empresas', url: '/dashboard/organizations' }
    ];
  }

  public openSiginAsModal() {
    const dialogRef = this.dialog.open(SigninAsDialogComponent, {
      width: '80vw',
    });

    dialogRef.afterClosed().subscribe(result => {
    });
  }
}
