import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
    title: 'Portfolio Dev JB',
  },
  {
    path: 'line-time',
    loadComponent: () =>
      import('./features/line-time/line-time.component').then((m) => m.LineTimeComponent),
    title: 'Línea de Tiempo | Tu Nombre',
  },
  {
    path: '**',
    redirectTo: '',
  },
  /*   {
    path: '',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
    title: 'Home | Tu Nombre',
  },
  {
    path: 'about',
    loadComponent: () => import('./features/about/about.component').then((m) => m.AboutComponent),
    title: 'Sobre mí | Tu Nombre',
  },
  {
    path: 'projects',
    loadComponent: () =>
      import('./features/projects/projects.component').then((m) => m.ProjectsComponent),
    title: 'Proyectos | Tu Nombre',
  },
  {
    path: 'skills',
    loadComponent: () =>
      import('./features/skills/skills.component').then((m) => m.SkillsComponent),
    title: 'Skills | Tu Nombre',
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./features/contact/contact.component').then((m) => m.ContactComponent),
    title: 'Contacto | Tu Nombre',
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent),
    title: '404 | Tu Nombre',
  }, */
];
