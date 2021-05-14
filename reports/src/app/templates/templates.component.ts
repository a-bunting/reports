import { Component, OnInit } from '@angular/core';

export interface lineTemplate {
    id: number, name: string, description: string 
}

export interface blockTemplate {
    id: number, name: string, 
    characters: {min: number, max: number}, 
    structure: [lineTemplate]
}

@Component({
  selector: 'app-templates',
  templateUrl: './templates.component.html',
  styleUrls: ['./templates.component.scss']
})
export class TemplatesComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
