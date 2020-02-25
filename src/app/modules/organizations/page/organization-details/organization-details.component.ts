import { Component, OnInit } from '@angular/core';
import { User } from '@shared/models/User';
import { OrganizationService } from '@app/http/organizations.service';
import { Organization } from '@shared/models/Organization';
import { GenericResponse } from '@shared/models/GenericResponse';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AvatarDialogComponent } from '@modules/organizations/dialogs/avatar-dialog/avatar-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { FileStorageService } from '@app/http/file-storage.service';
import { ImageUtils } from '@shared/utils/image.utils';
import { ImageCompressionService } from '@app/http/image-compression.service';
import { AvatarRemoveDialogComponent } from '@modules/organizations/dialogs/avatar-remove-dialog/avatar-remove-dialog.component';


interface BreadCrumb {
  label: string;
  params?: Params;
  url: string;
}

@Component({
  selector: 'app-organization-details',
  templateUrl: './organization-details.component.html',
  styleUrls: ['./organization-details.component.scss']
})
export class OrganizationDetaisComponent implements OnInit {

  public currentUser: User;

  public organization: Organization = new Organization();

  public editingId: string;

  public breadcrumb: BreadCrumb;

  constructor(
    private activatedRoute: ActivatedRoute,
    public router: Router,
    public fileStorageService: FileStorageService,
    public imageCompressionService: ImageCompressionService,
    public organizationService: OrganizationService,
    public dialog: MatDialog) {
  }

  public edit = (id: string = null) => this.editingId = id;
  public isEditing = (id: string) => this.editingId === id;

  public fetchById(id: number) {
    this.organizationService.fetchById(id).pipe(
      finalize(() => {
        this.breadcrumb = {
          label: `${this.organization.name}`,
          params: {},
          url: this.router.url
        };
        this.edit();
      })
    ).subscribe((response: GenericResponse<Organization>) => {
      this.organization = response.record;
    });
  }

  public patch(id: number, data: any, reload: boolean = false): void {
    this.organizationService.patch(id, data).pipe(
      finalize(() => {
        this.breadcrumb = {
          label: `${this.organization.name}`,
          params: {},
          url: this.router.url
        };
        this.edit();
      })
    )
      .pipe(finalize(() => { if (reload) { document.location.reload(); } }))
      .subscribe((response: GenericResponse<Organization>) => {
        this.organization = response.record;
      });
  }

  canEditOrganization = () => [User.Type.ADMINISTRATOR, User.Type.ACCOUNTANT].includes(this.currentUser.type);

  canSwitchStatus(): boolean {
    let canSwitchStatus = false;
    if (this.organization.type === Organization.Type.ACCOUNTING) {
      canSwitchStatus = [User.Type.ADMINISTRATOR].includes(this.currentUser.type);
    }
    if (this.organization.type === Organization.Type.CUSTOMER) {
      canSwitchStatus = [User.Type.ADMINISTRATOR, User.Type.ACCOUNTANT].includes(this.currentUser.type);
    }
    return canSwitchStatus;
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(AvatarDialogComponent, {
      maxWidth: '568px',
      data: { name: '' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.croppedImage) {
        this.imageCompressionService.compress(ImageUtils.dataURLtoFile(result.croppedImage, result.croppedName))
          .subscribe((compressed) => {
            this.fileStorageService.store(ImageUtils.blobToFile(compressed, result.croppedName))
              .subscribe((response) => {
                if (response.record && response.record.id) {
                  this.patch(this.organization.id, {
                    avatar: this.fileStorageService.getResourceURL(response.record.id)
                  }, true);
                }
              });
          });
      }
    });
  }

  public removerLogoContabilidade(): void {
    const dialogRef = this.dialog.open(AvatarRemoveDialogComponent, {
      maxWidth: '568px'
    });
    dialogRef.afterClosed().subscribe(result => {      
      if (result) {
        this.patch(this.organization.id, { avatar: '' }, true);
      }
    });
  }

  public canEditLogo(): boolean {
    return (
      (this.currentUser.isAdministrator() && this.organization.type === 1) 
      || (this.currentUser.isAccountant() && this.organization.type === 1
        && this.currentUser.organization.id === this.organization.id)
    );
  }

  public ngOnInit() {
    this.currentUser = User.fromLocalStorage();
    this.activatedRoute.params.subscribe((params: any) => {
      this.fetchById(params.id);
    });
  }

}
