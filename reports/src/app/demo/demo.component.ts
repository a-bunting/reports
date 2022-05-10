import { Component, OnInit } from '@angular/core';
import { KnowledgeBaseCategories, KnowledgeService } from '../services/knowledge.service';

@Component({
  selector: 'app-demo',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.scss']
})
export class DemoComponent implements OnInit {

  openMenu: string = "";
  knowledgeBase: KnowledgeBaseCategories[] = [];

  constructor(private knowledgeBaseService: KnowledgeService) { }

  ngOnInit(): void {
    this.knowledgeBase = this.knowledgeBaseService.getData();
  }

  /**
   * Sets which menu is open
   * @param number
   */
  setOpenMenu(str: string): void { this.openMenu = this.openMenu === str ? '' : str }

}
