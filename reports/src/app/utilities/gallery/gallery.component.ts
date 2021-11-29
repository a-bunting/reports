import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss']
})
export class GalleryComponent implements OnInit {

    galleryItem: string;

    constructor() { }

    ngOnInit(): void {
    }

    setGalleryComponent(name: string): void {
        this.galleryItem = name;
    }

}
