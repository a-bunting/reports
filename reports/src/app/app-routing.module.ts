import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ClassesComponent } from './classes/classes.component';
import { ReportsComponent } from './reports/reports.component';
import { CreateTemplateComponent } from './templates/create-template/create-template.component';
import { EditTemplateComponent } from './templates/edit-template/edit-template.component';
import { TemplatesComponent } from './templates/templates.component';

const routes: Routes = [
    {path: 'reports', component: ReportsComponent},
    {path: 'templates', component: TemplatesComponent, children: [
        {path: 'create-template', component: CreateTemplateComponent},
        {path: 'edit-template', component: EditTemplateComponent}
    ]},
    {path: 'classes', component: ClassesComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
