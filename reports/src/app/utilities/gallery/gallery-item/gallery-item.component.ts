import { Component, Input, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface galleryItem {
    name: string;
    videolink: SafeResourceUrl;
    brief: string;
    description: string;
}

@Component({
  selector: 'app-gallery-item',
  templateUrl: './gallery-item.component.html',
  styleUrls: ['./gallery-item.component.scss']
})

export class GalleryItemComponent implements OnInit {

    @Input() galleryDisplayName: string;

    default: galleryItem = {
        name: "Tutorials",
        brief: undefined, 
        videolink: undefined,
        description: "Click the buttons on the left to watch tutorials on the various aspects of ReportZone."
    }

    gallery: galleryItem[] = [
        {
            name: "Templates", 
            videolink: this.sanitizer.bypassSecurityTrustResourceUrl("https://www.youtube.com/embed/cHpZygrEgn4"),
            brief: "Templates will help you create a standard report for ReportZone to put information into.",
            description: "Templates are your main source of time saving in ReportZone. By setting up various different templates you can create groups of students who will need a similar report, and then when you get to the report generation only need data which is required for their particular template. More than this, if you do reports every year then by setting up templates, you can reuse the same report style over and over, whilst still generating unique and highly individualised reports for eacvh student."
        }, 
        {
            name: "Create Groups", 
            videolink: this.sanitizer.bypassSecurityTrustResourceUrl("https://www.youtube.com/embed/C5fIQjc6XAU"),
            brief: "Creating groups is easy in Reports.zone. This guide will show you how to easily import your student data from a spreadsheet.",
            description: undefined
        },
        {
            name: "Import from Powerteacher", 
            videolink: this.sanitizer.bypassSecurityTrustResourceUrl("https://www.youtube.com/embed/uGUb-w2067M"),
            brief: "This tutorial will help you move data from Powerteacher into Reports.zone.",
            description: undefined
        }, 
        {
            name: "Making Reports", 
            videolink: this.sanitizer.bypassSecurityTrustResourceUrl("https://www.youtube.com/embed/m6HAw7_eoYA"),
            brief: "This tutorial will demonstrate how you can now use your groups and template data to produce reports for your students.",
            description: undefined
        }
    ]

    constructor(public sanitizer:DomSanitizer) { }

    ngOnInit(): void {
        
    }

    getData(key: string, galleryName?: string): string {
        // get the index...
        galleryName = this.galleryDisplayName ? this.galleryDisplayName : "";
        const galleryIndex: number = this.gallery.findIndex((temp: galleryItem) => temp.name.toLowerCase() === galleryName.toLowerCase());
        // return
        if(galleryIndex !== -1) {
            return this.gallery[galleryIndex][key];
        } else return this.default[key];
    }

    getVideo(galleryName?: string): SafeResourceUrl {
        // get the index...
        galleryName = this.galleryDisplayName ? this.galleryDisplayName : "";
        const galleryIndex: number = this.gallery.findIndex((temp: galleryItem) => temp.name.toLowerCase() === galleryName.toLowerCase());
        // return
        if(galleryIndex !== -1) {
            return this.gallery[galleryIndex].videolink;
        } else return this.default.videolink;
    }

}
