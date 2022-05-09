import { Injectable } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface KnowledgeBaseCategories {
  name: string; items: KnowledgeBaseItem[]
}

export interface KnowledgeBaseItem {
  name: string;
  keywords: string[];
  videolink: SafeResourceUrl;
  brief: string;
  description: string;
}


@Injectable({
  providedIn: 'root'
})

export class KnowledgeService {

  knowledgeBaseCategories: KnowledgeBaseCategories[] = [
    { name: 'Creating Reports from Start to Finish',
      items: [
      {
        name: "Create Groups (from spreadsheet data)",
        keywords: [],
        videolink: this.sanitizer.bypassSecurityTrustResourceUrl("https://www.youtube.com/embed/C5fIQjc6XAU"),
        brief: "Creating groups is easy in Reports.zone. This guide will show you how to easily import your student data from a spreadsheet.",
        description: "Groups will inevitably end up taking the longest time in ReportsZone and so there are several ways you can import data so its as easy as possible. This video will show you how you can use your spreadsheeted data and import it very easily into ReportsZone."
      },
      {
        name: "Templates",
        keywords: [],
        videolink: this.sanitizer.bypassSecurityTrustResourceUrl("https://www.youtube.com/embed/cHpZygrEgn4"),
        brief: "Templates will help you create a standard report for ReportZone to put information into.",
        description: "Templates are your main source of time saving in ReportZone. By setting up various different templates you can create groups of students who will need a similar report, and then when you get to the report generation only need data which is required for their particular template. More than this, if you do reports every year then by setting up templates, you can reuse the same report style over and over, whilst still generating unique and highly individualised reports for eacvh student."
      },
      {
        name: "Making Reports",
        keywords: [],
        videolink: this.sanitizer.bypassSecurityTrustResourceUrl("https://www.youtube.com/embed/m6HAw7_eoYA"),
        brief: "This tutorial will demonstrate how you can now use your groups and template data to produce reports for your students.",
        description: "This tutorial will show you how to actually generate your reports now that you have created your student groups and templates."
      }
    ]},
    {
      name: 'Demo Run Throughs',
      items: [
        {
          name: "Three Class Runthrough",
          keywords: [],
          videolink: this.sanitizer.bypassSecurityTrustResourceUrl("https://www.youtube.com/embed/DJi75T8K5A4"),
          brief: "In this video I create, from scratch, reports for threee whole classes in about 16 minutes.",
          description: "In this video we will go through the whole process of report making, making some classes, templates and finally two sets of reports for students of different abilities throughout three of my classes. All in 16 minutes!"
        }
      ]
    },
    { name: 'Groups from Powerschool', items: [
      {
        name: "Import from Powerteacher",
        keywords: [],
        videolink: this.sanitizer.bypassSecurityTrustResourceUrl("https://www.youtube.com/embed/uGUb-w2067M"),
        brief: "This tutorial will help you move data from Powerteacher into Reports.zone.",
        description: "Powerteacher is a very popular student management system used by schools worldwide. This tutorial will show you how you can take data from Powerschool and import it into ReportsZone."
      }
    ]}
  ]

  constructor(public sanitizer: DomSanitizer) { }

  getData(): KnowledgeBaseCategories[] {
    return this.knowledgeBaseCategories;
  }

  getDataFromKeyword(kw: string): KnowledgeBaseItem[] {
    let searchResults: KnowledgeBaseItem[] = [];
    return searchResults;
  }
}
