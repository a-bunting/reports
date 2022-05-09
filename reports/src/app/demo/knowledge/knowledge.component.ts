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
    // todo

  }


  // getVideo(galleryName?: string): SafeResourceUrl {
  //   // get the index...
  //   galleryName = this.galleryDisplayName ? this.galleryDisplayName : "";
  //   const galleryIndex: number = this.gallery.findIndex((temp: galleryItem) => temp.name.toLowerCase() === galleryName.toLowerCase());
  //   // return
  //   if(galleryIndex !== -1) {
  //       return this.gallery[galleryIndex].videolink;
  //   } else return this.default.videolink;
  // }

  // getData(key: string, galleryName?: string): string {
  //   // get the index...
  //   galleryName = this.galleryDisplayName ? this.galleryDisplayName : "";
  //   const galleryIndex: number = this.gallery.findIndex((temp: galleryItem) => temp.name.toLowerCase() === galleryName.toLowerCase());
  //   // return
  //   if(galleryIndex !== -1) {
  //       return this.gallery[galleryIndex][key];
  //   } else return this.default[key];
  // }

}
