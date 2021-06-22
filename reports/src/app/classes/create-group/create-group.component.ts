import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-create-group',
  templateUrl: './create-group.component.html',
  styleUrls: ['./create-group.component.scss']
})
export class CreateGroupComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  generateUserData() {
    // get data and split into individual elements
    let data: String[] = document.getElementById('groupInputBox').innerText.split("\n");
    
    // if there is a header row build a list of the keys to use for this dataset
    const keys: string[] = data[0].split(",");
    // iterate over the data and build a new array
    data.forEach((row: string) => {
        let newUser = row.split(",");
    })
}

}
