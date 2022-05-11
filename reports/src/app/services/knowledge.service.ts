import { Injectable } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

export interface KnowledgeBaseCategories {
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
    { name: 'The Basics',
      items: [
      {
        name: "Step 1: Create Groups",
        keywords: [],
        videolink: this.sanitizer.bypassSecurityTrustResourceUrl("https://www.youtube.com/embed/C5fIQjc6XAU"),
        brief: "Creating groups is easy in Reports.zone. This guide will show you how to easily import your student data from a spreadsheet.",
        description: "There are several ways you can import data so its as easy as possible. This video will show you how you can use your spreadsheeted data and import it very easily into ReportsZone using a spreadsheet. If you use a particular data system at your school (such as powerschool) then use the links on the left menu to find the software you use with specific directions. If your software is not represented, please submit a feature reuqest, and try the automatic detection method in group entry to try and parse your data."
      },
      {
        name: "Step 2: Make Templates",
        keywords: [],
        videolink: this.sanitizer.bypassSecurityTrustResourceUrl("https://www.youtube.com/embed/cHpZygrEgn4"),
        brief: "Templates will help you create a standard report for ReportZone to put information into.",
        description: "Templates are your main source of time saving in ReportZone. By setting up various different templates you can create groups of students who will need a similar report, and then when you get to the report generation only need data which is required for their particular template. More than this, if you do reports every year then by setting up templates, you can reuse the same report style over and over, whilst still generating unique and highly individualised reports for eacvh student."
      },
      {
        name: "Step 3: Generate Reports",
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
    ]},
    { name: 'Quick Tips', items: [
      {
        name: "Rapid Text Entry",
        keywords: [],
        videolink: this.sanitizer.bypassSecurityTrustResourceUrl("https://www.youtube.com/embed/Iu4LOrd0PeI"),
        brief: "When writing reports you dont have to rely on copy and paste to quickly enter the same value multiple times!",
        description: "In this video I show you how to quickly assign text values to multiple students, writing each word or phrase only once."
      }
    ]}
  ]

  constructor(public sanitizer: DomSanitizer) { }

  getData(): KnowledgeBaseCategories[] {
    return this.knowledgeBaseCategories;
  }

  getDataFromKeyword(keyword: string): KnowledgeBaseItem[] {
    let searchResults: KnowledgeBaseItem[] = [];

    this.knowledgeBaseCategories.forEach((kb: KnowledgeBaseCategories) => {
      let items: KnowledgeBaseItem[] = kb.items.filter((kbItem: KnowledgeBaseItem) => { kbItem.keywords.filter((kw: string) => kw === keyword).length !== 0 }).flat();
      searchResults = [...searchResults, ...items];
    })

    return searchResults;
  }

  getItemByName(name: string): KnowledgeBaseItem {
    let item: KnowledgeBaseItem;

    this.knowledgeBaseCategories.forEach((kb: KnowledgeBaseCategories) => {
      for(let i = 0 ; i < kb.items.length ; i++) {
        if(kb.items[i].name === name) { item = kb.items[i]; }
      }
    });
    return item;
  }
}
