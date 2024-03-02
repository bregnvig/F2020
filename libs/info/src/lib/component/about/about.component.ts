import { GithubService } from './../../service/github.service';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { angularLogo, cloudMessagingLogo, firebaseLogo, firestoreLogo, functionsLogo, githubLogo, tailwindCSS } from './assets';
import { AsyncPipe, NgFor } from '@angular/common';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'info-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatToolbarModule, MatGridListModule, NgFor, AsyncPipe],
})
export class AboutComponent {

  angular = this.sanitizer.bypassSecurityTrustResourceUrl(angularLogo);
  firebase = this.sanitizer.bypassSecurityTrustResourceUrl(firebaseLogo);
  firestore = this.sanitizer.bypassSecurityTrustResourceUrl(firestoreLogo);
  functions = this.sanitizer.bypassSecurityTrustResourceUrl(functionsLogo);
  github = this.sanitizer.bypassSecurityTrustResourceUrl(githubLogo);
  cloudMessaging = this.sanitizer.bypassSecurityTrustResourceUrl(cloudMessagingLogo);
  tailwindCSS = this.sanitizer.bypassSecurityTrustResourceUrl(tailwindCSS);

  constructor(private sanitizer: DomSanitizer, public service: GithubService) {
  }
}
