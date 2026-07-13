import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'line-time', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Client },
];
