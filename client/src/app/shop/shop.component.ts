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
  shopParams = new ShopParams();
  totalCount = 0;
  sortOptions = [
    {name: 'Alphabetical', value: 'name'},
    {name: 'Price: Low to High', value: 'priceAsc'},
    {name: 'Price: High to Low', value: 'priceDesc'},
  ]

  constructor(private shopService: ShopService) { }

  ngOnInit(): void {
    this.getProducts();
    this.getBrands();
    this.getTypes();
  }

  getProducts() {
    this.shopService.getProducts(this.shopParams).subscribe(response => {
      if (response) {
        this.products = response.data
        this.shopParams.pageNumber = response.pageIndex;
        this.shopParams.pageSize = response.pageSize;
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
    this.shopParams.brandId = brandId
    this.shopParams.pageNumber = 1
    this.getProducts()
  }

  onTypeSelected(typeId: number) {
    this.shopParams.typeId = typeId
    this.shopParams.pageNumber = 1
    this.getProducts()
  }

  onSortSelected(event: Event) {
    this.shopParams.sort = (event.target as HTMLInputElement).value
    this.getProducts()
  }

  onPageChanged(page: number) {
    if (this.shopParams.pageNumber !== page) {
      this.shopParams.pageNumber = page
      this.getProducts()
    }
  }

  onSearch() {
    this.shopParams.search = this.searchTerm.nativeElement.value
    this.getProducts()
  }

  onReset() {
    this.searchTerm.nativeElement.value = ''
    this.shopParams = new ShopParams();
    this.getProducts()
  }
}
