import { Component, ElementRef, input, viewChild } from '@angular/core';
import { css, icon } from '@f2020/shared';
import { DecimalPipe } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatIconButton } from '@angular/material/button';

@Component({
  selector: 'f2020-radio-message',
  template: `
    <audio #audio (ended)="ended()" (timeupdate)="updateProgress()">
      <source [src]="url()" type="audio/mpeg">
      Hov - du kan ikke afspille denne besked
    </audio>
    <span class="float-right flex items-center">
      @if (audio.duration; as duration) {
        <span #duration class="duration text-xs me-2">{{ duration | number: '1.2-2' }}s</span>
      }
      <button mat-icon-button (click)="audio.paused ? audio.play() : audio.pause()">
        <fa-icon [icon]="audio.paused || audio.ended ? play : pause" [fixedWidth]="true"></fa-icon>
      </button>
    </span>
  `,
  imports: [
    DecimalPipe,
    FaIconComponent,
    MatIconButton,
  ],
  styles: `
    .duration {
      position: relative;
      display: inline-block; /* Adjust as needed */
      padding-bottom: 1px; /* Space for border */
    }

    .duration::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      width: var(--radio-duration); /* Percentage of border */
      height: 2px;
      background-color: white;
      transition: width 0.2s ease-in-out;
    }
  `,
})

export class RadioMessageComponent {

  duration = viewChild<ElementRef<HTMLSpanElement>>('duration');
  audio = viewChild<ElementRef<HTMLAudioElement>>('audio');

  play = icon.farPlay;
  pause = icon.farPause;

  url = input.required<string>();

  updateProgress() {
    const progress = this.audio().nativeElement.currentTime / this.audio().nativeElement.duration * 100;
    css.setVar('--radio-duration', `${progress}%`, this.duration().nativeElement);
  }

  ended() {
    css.setVar('--radio-duration', `0%`, this.duration().nativeElement);
    setTimeout(() => css.setVar('--radio-duration', `0%`, this.duration().nativeElement), 200);
  }
}
