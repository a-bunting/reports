import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireFunctions } from '@angular/fire/functions';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {

    constructor(private fAuth: AngularFireAuth, private firebase: AngularFirestore, private fFunctions: AngularFireFunctions) { }

    ngOnInit(): void {
        this.listUsers();
    }

    listUsers() {
        return this.firebase.collection('users').get().subscribe(userData => {
            console.log(userData);
        })
    }

    addAdmin(email: string): void {
        const addAdminRole = this.fFunctions.httpsCallable('addAdminRole');
        // add the email to the admin list
        addAdminRole({ email: email }).subscribe(result => {
            console.log(result.data.message);
        })
    }

}
