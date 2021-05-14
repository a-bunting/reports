import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TemplatesComponent } from './templates/templates.component';
import { ClassesComponent } from './classes/classes.component';
import { ReportsComponent } from './reports/reports.component';
import { CreateTemplateComponent } from './templates/create-template/create-template.component';
import { EditTemplateComponent } from './templates/edit-template/edit-template.component';
import { AuthComponent } from './utilities/auth/auth.component';
import { FormsModule } from '@angular/forms';
import { AdminComponent } from './admin/admin.component';
import { SentencesComponent } from './admin/sentences/sentences.component';

@NgModule({
  declarations: [
    AppComponent,
    TemplatesComponent,
    ClassesComponent,
    ReportsComponent,
    CreateTemplateComponent,
    EditTemplateComponent,
    AuthComponent,
    AdminComponent,
    SentencesComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule, 
    FormsModule, 
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
