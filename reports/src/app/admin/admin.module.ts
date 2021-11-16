import { RouterModule, Routes } from "@angular/router";
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminComponent } from "./admin.component";
import { AdminSentencesComponent } from "./sentences/admin-sentences.component";
import { AdminUsersComponent } from "./users/admin-users.component";
import { AdminBugReportsComponent } from "./admin-bug-reports/admin-bug-reports.component";
import { AuthGuard } from "../utilities/authentication/auth-guard.guard";
import { AdminGuard } from "../utilities/authentication/admin.guard";

const routes: Routes = [
    {path: '', component: AdminComponent, canActivate: [AuthGuard, AdminGuard], children: [
        {path: 'sentences', component: AdminSentencesComponent},
        {path: 'users', component: AdminUsersComponent},
        {path: 'bugreports', component: AdminBugReportsComponent}
    ]}
]

@NgModule({
    imports: [
        CommonModule, 
        RouterModule.forChild(routes)
    ], 
    declarations: [
        AdminComponent,
        AdminBugReportsComponent,
        AdminSentencesComponent,
        AdminUsersComponent
    ], 
    exports: [RouterModule]
})

export class AdminModule {}