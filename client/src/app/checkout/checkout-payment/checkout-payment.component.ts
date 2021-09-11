import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { BasketService } from 'src/app/basket/basket.service';
import { IBasket } from 'src/app/shared/models/basket';
import { CheckoutService } from '../checkout.service';
import { IOrder } from '../../shared/models/order';
import { NavigationExtras, Router } from '@angular/router';

declare var Stripe: (arg0: string) => any;

@Component({
  selector: 'app-checkout-payment',
  templateUrl: './checkout-payment.component.html',
  styleUrls: ['./checkout-payment.component.scss']
})
export class CheckoutPaymentComponent implements AfterViewInit, OnDestroy {
  @Input() checkoutForm!: FormGroup
  @ViewChild('cardNumber', {static: true}) cardNumberElement!: ElementRef;
  @ViewChild('cardExpiry', {static: true}) cardExpiryElement!: ElementRef;
  @ViewChild('cardCvc', {static: true}) cardCvcElement!: ElementRef;
  stripe: any;
  cardNumber: any;
  cardExpiry: any;
  cardCvc: any;
  cardErrors: any;
  cardHandler = this.onChange.bind(this);
  loading = false;
  cardNumberValid = false;
  cardExpiryValid = false;
  cardCvcValid = false;

  constructor(
    private basketService: BasketService, 
    private checkoutService: CheckoutService,
    private toastr: ToastrService,
    private router: Router) { }

  ngAfterViewInit(): void {
    this.stripe = Stripe('pk_test_51JYJWxG6CgkywKFVZMkRDLC3NDlPsmwz4X8dO7E8m6SSWWZ9lXw6MFmqY7vwymxDJWlheND2YUTI6BkxXXa3fRDZ00YhN8LbNV')
    const elements = this.stripe.elements()

    this.cardNumber = elements.create('cardNumber');
    this.cardNumber.mount(this.cardNumberElement.nativeElement)
    this.cardNumber.addEventListener('change', this.cardHandler)

    this.cardExpiry = elements.create('cardExpiry');
    this.cardExpiry.mount(this.cardExpiryElement.nativeElement)
    this.cardExpiry.addEventListener('change', this.cardHandler)

    this.cardCvc = elements.create('cardCvc');
    this.cardCvc.mount(this.cardCvcElement.nativeElement)
    this.cardCvc.addEventListener('change', this.cardHandler)
  }
      
  ngOnDestroy(): void {
    this.cardNumber.destroy();
    this.cardExpiry.destroy();
    this.cardCvc.destroy();
  }

  onChange(event: any) {
    if (event.error) {
      this.cardErrors = event.error.message
    } else {
      this.cardErrors = null
    }

    switch (event.elementType) {
      case 'cardNumber':
        this.cardNumberValid = event.complete;
        break;
      case 'cardExpiry':
        this.cardExpiryValid = event.complete;
        break;
      case 'cardCvc':
        this.cardCvcValid = event.complete;
        break;
      default:
        break;
    }
  }

  async submitOrder() {
    this.loading = true;
    const basket = this.basketService.getCurrentBasketValue();
    try {
      const createdOrder = await this.createOrder(basket);
      const paymentResult = await this.confirmPaymentWithStripe(basket);
  
      if (paymentResult.paymentIntent && basket && createdOrder) {
        this.basketService.deleteBasket(basket)
        const navigationExtras: NavigationExtras = {state: createdOrder}
        this.router.navigate(['checkout/success'], navigationExtras)
      } else {
        this.toastr.error(paymentResult.error.message)
      }
    } catch (error) {
      console.log(error)
    } finally {
      this.loading = false;
    }
  }

  private async confirmPaymentWithStripe(basket: IBasket | null) {
    return this.stripe.confirmCardPayment(basket?.clientSecret, {
      payment_method: {
        card: this.cardNumber,
        billing_details: {
          name: this.checkoutForm.get('paymentForm')?.get('nameOnCard')?.value
        }
      }
    })
  }

  private async createOrder(basket: IBasket | null) {
    const orderToCreate = this.getOrderToCreate(basket);
    if (orderToCreate) {
      return this.checkoutService.createOrder(orderToCreate).toPromise();
    }
    return null;
  }

  private getOrderToCreate(basket: IBasket | null) {
    if (basket) {
      return {
        basketId: basket.id,
        deliveryMethodId: +this.checkoutForm.get('deliveryForm')?.get('deliveryMethod')?.value,
        shipToAddress: this.checkoutForm.get('addressForm')?.value
      }
    }
    return null
  }

}
