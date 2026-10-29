import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Tutorial } from '../tutorial';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
})
export class Home {
  protected readonly databases = inject(Tutorial).databases;
}
