import { GithubService } from './../../service/github.service';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { angularLogo, firebaseLogo, firestoreLogo, functionsLogo, githubLogo, ngrxLogo, cloudMessagingLogo, tailwindCSS } from './assets';

@Component({
  selector: 'info-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AboutComponent {

  angular = this.sanitizer.bypassSecurityTrustResourceUrl(angularLogo);
  firebase = this.sanitizer.bypassSecurityTrustResourceUrl(firebaseLogo);
  firestore = this.sanitizer.bypassSecurityTrustResourceUrl(firestoreLogo);
  functions = this.sanitizer.bypassSecurityTrustResourceUrl(functionsLogo);
  github = this.sanitizer.bypassSecurityTrustResourceUrl(githubLogo);
  ngrx = this.sanitizer.bypassSecurityTrustResourceUrl(ngrxLogo);
  cloudMessaging = this.sanitizer.bypassSecurityTrustResourceUrl(cloudMessagingLogo);
  tailwindCSS = this.sanitizer.bypassSecurityTrustResourceUrl(tailwindCSS);

  constructor(private sanitizer: DomSanitizer, public service: GithubService) { }
}
