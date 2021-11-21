import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ClassesComponent } from './classes/classes.component';
import { ReportsComponent } from './reports/reports.component';
import { CreateTemplateComponent } from './templates/create-template/create-template.component';
import { TemplatesComponent } from './templates/templates.component';
import { DashboardComponent } from './utilities/dashboard/dashboard.component';
import { AuthGuard } from './utilities/authentication/auth-guard.guard';
import { PrivacyComponent } from './utilities/privacy/privacy.component';
import { TermsComponent } from './utilities/terms/terms.component';
import { CreateGroupComponent } from './classes/create-group/create-group.component';
import { SentencesComponent } from './sentences/sentences.component';
import { EditGroupComponent } from './classes/edit-group/edit-group.component';
import { EditReportComponent } from './reports/edit-report/edit-report.component';
import { IntroComponent } from './utilities/intro/intro.component';
import { AuthComponent } from "./utilities/auth/auth.component";
import { PageNotFoundComponent } from './utilities/page-not-found/page-not-found.component';

const titleNamePrexif: string = "ReportZone"

const routes: Routes = [
    {path: '', component: IntroComponent, data: { title: titleNamePrexif }},
    {path: 'reports', component: ReportsComponent, canActivate: [AuthGuard], data: { title: `${titleNamePrexif} - Reports` }, children: [
        {path: 'edit-report', component: EditReportComponent, data: { title: `${titleNamePrexif} - Edit Report` }},
        {path: 'edit-report/:id', component: EditReportComponent, data: { title: `${titleNamePrexif} - Edit Report` }}
    ]},
    {path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard], data: { title: `${titleNamePrexif} - Dashboard` }},
    {path: 'templates', component: TemplatesComponent, canActivate: [AuthGuard], data: { title: `${titleNamePrexif} - Templates` }, children: [
        {path: 'create-template', component: CreateTemplateComponent, data: { title: `${titleNamePrexif} - Create Template` }},
        {path: 'create-template/:id', component: CreateTemplateComponent, data: { title: `${titleNamePrexif} - Create Template` }}
    ]},
    {path: 'classes', component: ClassesComponent, canActivate: [AuthGuard], data: { title: `${titleNamePrexif} - Classes` }, children: [
        {path: 'create-group', component: CreateGroupComponent, data: { title: `${titleNamePrexif} - Create Class` }},
        {path: '', component: EditGroupComponent, data: { title: `${titleNamePrexif} - Classes` }}
    ]},
    {path: 'sentences', component: SentencesComponent, canActivate: [AuthGuard], data: { title: `${titleNamePrexif} - Database` }},
    {path: 'register', component: AuthComponent, data: { title: `${titleNamePrexif} - Register` }},
    {path: 'terms', component: TermsComponent, data: { title: `${titleNamePrexif} - Terms and Conditions` }},
    {path: 'privacy', component: PrivacyComponent, data: { title: `${titleNamePrexif} - Privacy Policy` }},
    {path: 'fb', loadChildren: () => import('./utilities/modify-user-data/verification.module').then(m => m.VerificationModule)},
    {path: 'admin', loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)},
    {path: 'join', loadChildren: () => import('./utilities/join/join.module').then(m => m.JoinModule)}, 
    {path: '**', component: PageNotFoundComponent, data: { title: `${titleNamePrexif} - Page Not Found` }}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
