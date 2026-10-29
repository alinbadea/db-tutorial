import { Routes } from '@angular/router';
import { Chapter } from './chapter/chapter';
import { DatabaseView } from './database/database';
import { Home } from './home/home';

export const routes: Routes = [
  { path: '', component: Home },
  {
    path: ':db',
    component: DatabaseView,
    children: [
      { path: '', component: Chapter },
      { path: ':chapter', component: Chapter },
    ],
  },
  { path: '**', redirectTo: '' },
];
