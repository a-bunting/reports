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
import { LoadingSpinnerComponent } from './utilities/loading-spinner/loading-spinner.component';
import { DashboardComponent } from './utilities/dashboard/dashboard.component';
import { AuthenticationService } from './utilities/authentication/authentication.service';
import { environment } from 'src/environments/environment';
import { AngularFireModule } from '@angular/fire';
import { AngularFireFunctions } from '@angular/fire/functions';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { UsersComponent } from './admin/users/users.component';
import { CreateGroupComponent } from './classes/create-group/create-group.component';
import { AngularFirestoreModule } from '@angular/fire/firestore';

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
    SentencesComponent,
    LoadingSpinnerComponent,
    DashboardComponent,
    UsersComponent,
    CreateGroupComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule, 
    FormsModule, 
    HttpClientModule, 
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireAuthModule,
    AngularFirestoreModule 
  ],
  providers: [
        AuthenticationService,
        AngularFireFunctions, 
        AngularFireAuthModule, 
        AngularFirestoreModule
    ],
  bootstrap: [AppComponent]
})
export class AppModule { }
