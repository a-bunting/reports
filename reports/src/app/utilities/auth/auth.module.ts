import { RouterModule, Routes } from "@angular/router";
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthComponent } from "./auth.component";
import { FormsModule } from '@angular/forms';

const routes: Routes = [
    {path: '', component: AuthComponent}
]

@NgModule({
    imports: [
        CommonModule, 
        RouterModule.forChild(routes), 
        FormsModule
    ], 
    declarations: [
        AuthComponent
    ], 
    exports: [RouterModule]
})

export class AuthModule {}