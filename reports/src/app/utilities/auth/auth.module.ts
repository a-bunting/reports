import { RouterModule, Routes } from "@angular/router";
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrivacyComponent } from "../privacy/privacy.component";
import { TermsComponent } from "../terms/terms.component";
import { AuthComponent } from "./auth.component";
import { FormsModule } from '@angular/forms';

const routes: Routes = [
    {path: '', component: AuthComponent},
    {path: 'privacy', component: PrivacyComponent},
    {path: 'terms', component: TermsComponent}
]

@NgModule({
    imports: [
        CommonModule, 
        RouterModule.forChild(routes), 
        FormsModule
    ], 
    declarations: [
        PrivacyComponent, 
        TermsComponent, 
        AuthComponent
    ], 
    exports: [RouterModule]
})

export class AuthModule {}