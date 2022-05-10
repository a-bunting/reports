import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Params } from '@angular/router';
import { Subscription } from 'rxjs';
import { KnowledgeBaseItem, KnowledgeService } from 'src/app/services/knowledge.service';

@Component({
  selector: 'app-knowledge',
  templateUrl: './knowledge.component.html',
  styleUrls: ['./knowledge.component.scss']
})
export class KnowledgeComponent implements OnInit, OnDestroy {

  routeParamSubscription: Subscription;
  currentKnowledgeBase: KnowledgeBaseItem;

  constructor(
    private activedRoute: ActivatedRoute,
    public sanitizer: DomSanitizer,
    private knowledgeBaseService: KnowledgeService
    ) {
  }

  ngOnInit(): void {
    // get the knowledge article required and watch for any further requests...
    this.routeParamSubscription = this.activedRoute.queryParams.subscribe((params: Params) => {
      this.loadData(params.page);
    })
  }

  ngOnDestroy(): void {
      this.routeParamSubscription.unsubscribe();
  }

  loadData(page: string): void {
    this.currentKnowledgeBase = this.knowledgeBaseService.getItemByName(page);
  }

  getVideo(galleryName?: string): SafeResourceUrl {
    return this.currentKnowledgeBase.videolink;
  }

  getData(key: string): string {
    return this.currentKnowledgeBase[key];
  }

}
