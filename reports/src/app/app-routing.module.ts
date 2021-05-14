import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminComponent } from './admin/admin.component';
import { SentencesComponent } from './admin/sentences/sentences.component';
import { ClassesComponent } from './classes/classes.component';
import { ReportsComponent } from './reports/reports.component';
import { CreateTemplateComponent } from './templates/create-template/create-template.component';
import { EditTemplateComponent } from './templates/edit-template/edit-template.component';
import { TemplatesComponent } from './templates/templates.component';
import { AuthComponent } from './utilities/auth/auth.component';

const routes: Routes = [
    {path: 'reports', component: ReportsComponent},
    {path: 'templates', component: TemplatesComponent, children: [
        {path: 'create-template', component: CreateTemplateComponent},
        {path: 'edit-template', component: EditTemplateComponent}
    ]},
    {path: 'classes', component: ClassesComponent},
    {path: 'auth', component: AuthComponent},
    {path: 'admin', component: AdminComponent, children: [
        {path: 'sentences', component: SentencesComponent}
    ]}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
