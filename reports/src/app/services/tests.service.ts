import { Injectable } from '@angular/core';

export interface Test {
    name: string; variables: string[] | number[]; function: Function
}

@Injectable({
  providedIn: 'root'
})
export class TestsService {

    public testsList: Test[] = [
        {
            name: 'gradeChange', 
            variables: ['oldGrade', 'newGrade'],
            function: (oldGrade: number, recentGrade: number): number => {
                return recentGrade - oldGrade;
            }
        }, 
        {
            name: 'improvement', 
            variables: ['improvement'],
            function: (value: number): number => {
                return value;
            }
        }
    ]

    constructor() { }

}
