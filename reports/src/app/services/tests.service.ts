import { Injectable } from '@angular/core';

export interface Test {
    name: string; function: Function
}

@Injectable({
  providedIn: 'root'
})
export class TestsService {

    public testsList: Test[] = [
        {
            name: 'gradeChange', 
            function: (oldGrade: number, recentGrade: number): number => {
                return recentGrade - oldGrade;
            }
        }, 
        {
            name: 'improvement', 
            function: (value: number): number => {
                return value;
            }
        }
    ]

    constructor() { }

}
