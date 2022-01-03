import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CustomService {

    greaterTooltipsFlag: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    constructor() { }

    public toggleGreaterTooltips(): void {
        let currentValue: boolean = this.greaterTooltipsFlag.value;
        this.greaterTooltipsFlag.next(!currentValue);
    }

}
