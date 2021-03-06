import { Component, Inject, OnInit } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UserProductAuthoritiesService } from '@app/http/user-product-authorities.service';
import { Observable, of } from 'rxjs';
import { ToastService } from '@app/services/toast.service';
import { LoggerUtils } from '@shared/utils/logger.utils';
import { User } from '@shared/models/User';
import { Authority } from '@shared/models/TokenInfo';
import { ArrayUtils } from '@shared/utils/array.utils';
import { environment } from '@env';

@Component({
  templateUrl: './lot-permission-dialog.component.html'
})
export class LotPermissionDialogComponent implements OnInit {

  actions: { id: string, observable$: Observable<any> }[] = [];

  isSubmiting: boolean;

  products: { name: string, id: number, add: boolean, remove: boolean }[] = [];
  authorities = [
    { name: 'ver', value: Authority.READ, add: false, remove: false },
    { name: 'editar', value: Authority.WRITE, add: false, remove: false },
    { name: 'gerenciar', value: Authority.ADMIN, add: false, remove: false }
  ];
  ids: number[];

  currentId: number;

  count = 0;

  constructor(
    public service: UserProductAuthoritiesService,
    public toast: ToastService,
    public dialogRef: MatDialogRef<LotPermissionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
    this.currentId = User.fromLocalStorage().id;
    this._getProducts();
    this._getIds();
  }

  changeProduct(event: MatCheckboxChange, position: number, value: boolean, isProduct = true) {
    this.actions = this.actions.filter(act => act.id !== event.source.value);

    const create = (userId: number) => {
      if (isProduct) {
        return this.service.createUserProduct({ productsId: +event.source.value, usersId: userId });
      }
      const authoritiesId: any = event.source.value;
      return this.service.createUserAuthorities({ authoritiesId, usersId: userId });
    };

    const remove = (userId: number): any => {
      if (isProduct) {
        return this.service.deleteUserProduct(userId, +event.source.value);
      } else if (!isProduct && event.source.value === Authority.ADMIN && userId === this.currentId) {
        return of({});
      }
      const authoritiesId: any = event.source.value;
      return this.service.deleteUserAuthorities(userId, authoritiesId);
    };

    if (!event.checked) {
      return;
    }

    this.actions = this.actions.concat(this.ids.map(userId => {
      const observable$ = value ? create(userId) : remove(userId);
      return { id: event.source.value, observable$ };
    }));

    if (value) {
      if (isProduct) {
        this.products[position].remove = false;
      } else {
        this.authorities[position].remove = false;
      }
    } else {
      if (isProduct) {
        this.products[position].add = false;
      } else {
        this.authorities[position].add = false;
      }
    }
  }

  submit() {
    this.isSubmiting = true;
    if (!this.actions.length) {
      this.dialogRef.close(false);
      return;
    }

    const packages: Observable<any>[][] = ArrayUtils.package(this.actions.map(act => act.observable$), 150);

    const next = (id: number) => {
      let counter = 0;
      packages[id].forEach(ob$ => {
        ob$.subscribe(() => {
          counter++;
          this.count++;
          this._close(this.count - 1);
          if (counter === packages[id].length && id < packages.length) {
            next(id + 1);
          }
        }, () => {
          counter++;
          this.count++;
          this._close(this.count - 1);
          if (counter === packages[id].length && id < packages.length) {
            next(id + 1);
          }
        });
      });
    };

    next(0);

  }

  getPercentage() {
    return Math.round((this.count / this.actions.length) * 100);
  }

  private _close(index: number) {
    if (index === this.actions.length - 1) {
      this.dialogRef.close(true);
    }
  }

  private _getIds() {
    const filter: any = {};
    this.data.filters.forEach(f => Object.assign(filter, f.value));
    this.service.getAllIds(filter).subscribe((results: number[]) => {
      this.ids = results;
    });
  }

  private _getProducts() {
    this.service.getProducts(environment.applicationId).subscribe((results: any[]) => {
      this.products = results.map(res => {
        return { name: res.name, id: res.id, add: false, remove: false };
      });
    });
  }

}
