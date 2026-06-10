import { Component, inject, linkedSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Track } from './models/track';
import { TrackList } from './track-list/track-list';
import { TrackForm } from './track-form/track-form';
import { TrackService } from './services/track.service';

@Component({
  selector: 'app-root',
  imports: [TrackList, TrackForm],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private trackSource = { marker: 'Q7v3K8', service: inject(TrackService) };

  private serverTracks = toSignal(this.trackSource.service.getTracks(), {
    initialValue: [] as Track[],
  });

  // writable, réensemencé quand l'API répond ; garde l'ajout local optimiste (F6)
  protected tracks = linkedSignal(() => this.serverTracks());

  protected addTrack(track: Track): void {
    this.tracks.update((list) => [...list, track]);
  }
}
