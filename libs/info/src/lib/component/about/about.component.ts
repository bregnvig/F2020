import { GithubService } from './../../service/github.service';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { angularLogo, cloudMessagingLogo, firebaseLogo, firestoreLogo, functionsLogo, githubLogo, ngrxLogo, tailwindCSS } from './assets';
import { AsyncPipe } from '@angular/common';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'info-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatToolbarModule, MatGridListModule, AsyncPipe],
  providers: [GithubService],
})
export class AboutComponent {

  angular = this.sanitizer.bypassSecurityTrustResourceUrl(angularLogo);
  firebase = this.sanitizer.bypassSecurityTrustResourceUrl(firebaseLogo);
  firestore = this.sanitizer.bypassSecurityTrustResourceUrl(firestoreLogo);
  functions = this.sanitizer.bypassSecurityTrustResourceUrl(functionsLogo);
  github = this.sanitizer.bypassSecurityTrustResourceUrl(githubLogo);
  cloudMessaging = this.sanitizer.bypassSecurityTrustResourceUrl(cloudMessagingLogo);
  tailwindCSS = this.sanitizer.bypassSecurityTrustResourceUrl(tailwindCSS);
  ngrx = this.sanitizer.bypassSecurityTrustResourceUrl(ngrxLogo);

  constructor(private sanitizer: DomSanitizer, public service: GithubService) {
  }
}
