import { Component, ElementRef, Input, OnInit, Self, ViewChild } from '@angular/core';
import { AbstractControl, ControlValueAccessor, NgControl } from '@angular/forms';

@Component({
  selector: 'app-text-input',
  templateUrl: './text-input.component.html',
  styleUrls: ['./text-input.component.scss']
})
export class TextInputComponent implements OnInit, ControlValueAccessor {
  @ViewChild('input', {static: true}) input!: ElementRef;
  @Input() type = 'text';
  @Input() label!: string;

  constructor(@Self() public controlDir: NgControl) { 
    this.controlDir.valueAccessor = this
  }

  ngOnInit(): void {
    const control: AbstractControl | null = this.controlDir.control
    if (control) {
      console.log(control.validator)
      const validators = control.validator ? [control.validator] : [];
      const asyncValidators = control.asyncValidator ? [control.asyncValidator] : []
  
      control.setValidators(validators)
      control.setAsyncValidators(asyncValidators)
      control.updateValueAndValidity()
    }
  }

  onChangeHandle(event: Event) {
    this.onChange((event.target as HTMLInputElement).value)
  }
  
  onChange(event: any) {}

  onTouched() {}

  writeValue(obj: any): void {
    this.input.nativeElement.value = obj || ""
  }
  registerOnChange(fn: any): void {
    this.onChange = fn
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn
  }

}
