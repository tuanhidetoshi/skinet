import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Basket, IBasket, IBasketItem, IBasketTotals } from '../shared/models/basket';
import { IDeliveryMethod } from '../shared/models/deliveryMethod';
import { IProduct } from '../shared/models/product';

@Injectable({
  providedIn: 'root'
})
export class BasketService {
  baseUrl = environment.apiUrl;
  private basketSource = new BehaviorSubject<IBasket | null>(null);
  basket$ = this.basketSource.asObservable();
  private basketTotalSource = new BehaviorSubject<IBasketTotals | null>(null);
  basketTotal$ = this.basketTotalSource.asObservable();
  shipping = 0;

  constructor(private http : HttpClient) { }

  createPaymentIntent() {
    return this.http.post<IBasket>(`${this.baseUrl}payments/${this.getCurrentBasketValue()?.id}`, {})
      .pipe(
        map(basket => {
          this.basketSource.next(basket)
        })
      );
  }

  setShippingPrice(deliveryMethod: IDeliveryMethod) {
    this.shipping = deliveryMethod.price;
    const basket = this.getCurrentBasketValue();
    if (basket) {
      basket.deliveryMethodId = deliveryMethod.id;
      basket.shippingPrice = deliveryMethod.price;
      this.calculateTotals();
      this.setBasket(basket)
    }
  }

  getBasket(id : string) {
    return this.http.get<IBasket>(`${this.baseUrl}basket?id=${id}`)
      .pipe(
        map((basket : IBasket) => {
          this.basketSource.next(basket)
          this.shipping = basket.shippingPrice || 0
          this.calculateTotals()
        })
      )
  }

  setBasket(basket : IBasket) {
    return this.http.post<IBasket>(`${this.baseUrl}basket`, basket)
      .subscribe((response : IBasket) => {
        this.basketSource.next(response)
        this.calculateTotals()
      }, error => {
        console.log(error)
      })
  }

  getCurrentBasketValue() {
    return this.basketSource.value;
  }

  addItemToBasket(item: IProduct, quantity = 1) {
    const itemToAdd: IBasketItem = this.mapProductItemToBasketItem(item, quantity);
    const basket = this.getCurrentBasketValue() ?? this.createBasket();
    basket.items = this.addOrUpdateItem(basket.items, itemToAdd, quantity);
    this.setBasket(basket);
  }

  incrementItemQuantity(item: IBasketItem) {
    const basket = this.getCurrentBasketValue();
    const foundItemIndex = basket?.items.findIndex(x => x.id === item.id);
    if (basket && foundItemIndex !== undefined) {
      basket.items[foundItemIndex].quantity++;
      this.setBasket(basket);
    }
  }

  decrementItemQuantity(item: IBasketItem) {
    const basket = this.getCurrentBasketValue();
    const foundItemIndex = basket?.items.findIndex(x => x.id === item.id);
    if (basket && foundItemIndex !== undefined) {
      if (basket.items[foundItemIndex].quantity > 1) {
        basket.items[foundItemIndex].quantity--;
        this.setBasket(basket);
      } else {
        this.removeItemFromBasket(item);
      }
    }
  }

  removeItemFromBasket(item: IBasketItem) {
    const basket = this.getCurrentBasketValue();
    if (basket && basket.items.find(x => x.id === item.id)) {
      basket.items = basket.items.filter(i => i.id !== item.id)
      if (basket.items.length > 0) {
        this.setBasket(basket)
      } else {
        this.deleteBasket(basket)
      }
    }
  }

  deleteLocalBasket(id: string) {
    this.basketSource.next(null)
    this.basketTotalSource.next(null)
    localStorage.removeItem('basket_id')
  }

  deleteBasket(basket: IBasket) {
    return this.http.delete(`${this.baseUrl}basket?id=${basket.id}`).subscribe(() => {
      this.basketSource.next(null);
      this.basketTotalSource.next(null);
      localStorage.removeItem('basket_id');
    }, error => {
      console.log(error)
    })
  }

  private calculateTotals() {
    const basket = this.getCurrentBasketValue();
    const shipping = this.shipping;
    const subtotal = basket?.items.reduce((a, b) => (b.price * b.quantity) + a, 0);
    if (subtotal) {
      const total = subtotal ? subtotal + shipping : 0;
      this.basketTotalSource.next({shipping, total, subtotal});
    }
  }

  private addOrUpdateItem(items: IBasketItem[], itemToAdd: IBasketItem, quantity: number): IBasketItem[] {
    const index = items.findIndex(i => i.id === itemToAdd.id);
    if (index === -1) {
      itemToAdd.quantity = quantity;
      items.push(itemToAdd);
    } else {
      items[index].quantity += quantity;
    }
    return items;
  }

  private createBasket(): IBasket {
    const basket = new Basket();
    localStorage.setItem('basket_id', basket.id);
    return basket;
  }

  private mapProductItemToBasketItem(item: IProduct, quantity: number): IBasketItem {
    const {id, name: productName, price, pictureUrl, productBrand: brand, productType: type} = item
    return {
      id,
      productName,
      price,
      pictureUrl,
      brand,
      type,
      quantity
    }
  }
}
