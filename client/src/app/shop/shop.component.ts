import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { IBrand } from '../shared/models/brands';
import { IProduct } from '../shared/models/product';
import { IType } from '../shared/models/productTypes';
import { ShopParams } from '../shared/models/shopParams';
import { ShopService } from './shop.service';

@Component({
  selector: 'app-shop',
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.scss']
})
export class ShopComponent implements OnInit {
  @ViewChild('search', {static: false}) searchTerm!: ElementRef;
  products!: IProduct[];
  brands!: IBrand[];
  types!: IType[];
  shopParams!: ShopParams;
  totalCount = 0;
  sortOptions = [
    {name: 'Alphabetical', value: 'name'},
    {name: 'Price: Low to High', value: 'priceAsc'},
    {name: 'Price: High to Low', value: 'priceDesc'},
  ]

  constructor(private shopService: ShopService) { 
    this.shopParams = this.shopService.getShopParams();
  }

  ngOnInit(): void {
    this.getProducts(true);
    this.getBrands();
    this.getTypes();
  }

  getProducts(useCache = false) {
    this.shopService.getProducts(useCache).subscribe(response => {
      if (response) {
        this.products = response.data
        this.totalCount = response.count;
      }
    }, error => {
      console.log(error)
    })
  }

  getBrands() {
    this.shopService.getBrands().subscribe(response => {
      this.brands = [{id: 0, name: 'All'}, ...response]
    }, error => {
      console.log(error)
    })
  }

  getTypes() {
    this.shopService.getTypes().subscribe(response => {
      this.types = [{id: 0, name: 'All'}, ...response]
    }, error => {
      console.log(error)
    })
  }

  onBrandSelected(brandId: number) {
    const params = this.shopService.getShopParams();
    params.brandId = brandId
    params.pageNumber = 1
    this.shopService.setShopParams(params);
    this.getProducts()
  }

  onTypeSelected(typeId: number) {
    const params = this.shopService.getShopParams();
    params.typeId = typeId
    params.pageNumber = 1
    this.shopService.setShopParams(params);
    this.getProducts()
  }

  onSortSelected(event: Event) {
    const params = this.shopService.getShopParams();
    params.sort = (event.target as HTMLInputElement).value
    this.shopService.setShopParams(params);
    this.getProducts()
  }

  onPageChanged(page: number) {
    const params = this.shopService.getShopParams();
    if (params.pageNumber !== page) {
      params.pageNumber = page
      this.shopService.setShopParams(params);
      this.getProducts(true)
    }
  }

  onSearch() {
    const params = this.shopService.getShopParams();
    params.search = this.searchTerm.nativeElement.value
    params.pageNumber = 1
    this.shopService.setShopParams(params);
    this.getProducts()
  }

  onReset() {
    this.searchTerm.nativeElement.value = ''
    this.shopParams = new ShopParams()
    this.shopService.setShopParams(this.shopParams);
    this.getProducts()
  }
}
