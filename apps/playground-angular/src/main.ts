import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig, localiveInstance } from './app/app.config';
import { LocaliveInspectorService, LOCALIVE_INSTANCE } from '@localive/angular';

bootstrapApplication(AppComponent, {
  providers: [
    ...appConfig.providers!,
    { provide: LOCALIVE_INSTANCE, useValue: localiveInstance },
    LocaliveInspectorService,
  ],
}).catch((err) => console.error(err));
