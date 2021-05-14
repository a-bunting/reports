import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})

export class AuthComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  isLoginMode: boolean = true;

  onSwitchMode() { this.isLoginMode = !this.isLoginMode; }

  onSubmit(form: NgForm) {
      console.log(form.value);
  }

}
