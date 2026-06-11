import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { Track } from '../models/track';
import { AuthService } from '../services/auth.service';
import { TrackService } from '../services/track.service';
import { TrackList } from '../track-list/track-list';

@Component({
  selector: 'app-track-search',
  imports: [TrackList],
  templateUrl: './track-search.html',
  styleUrl: './track-search.css',
})
export class TrackSearch {
  private service = inject(TrackService);
  private auth = inject(AuthService);
  private router = inject(Router);

  protected term = signal('');
  protected isLoggedIn = this.auth.isLoggedIn;
  private refresh = signal(0);

  protected openTrack(id: number): void {
    this.router.navigate(['/tracks', id]);
  }

  protected toggleFavorite(track: Track): void {
    this.service.toggleFavorite(track).subscribe({
      next: () => {
        this.refresh.update((value) => value + 1);
      },
      error: (error: unknown) => {
        console.error('[TrackSearch] echec du favori', error);
      },
    });
  }

  protected results = toSignal(
    combineLatest([
      toObservable(this.term).pipe(debounceTime(300), distinctUntilChanged()),
      toObservable(this.refresh),
    ]).pipe(
      switchMap(([query]) =>
        this.service.search(query).pipe(
          catchError((error: unknown) => {
            console.error('[TrackSearch] echec de la recherche', error);
            return of([] as Track[]);
          }),
        ),
      ),
    ),
    { initialValue: [] as Track[] },
  );
}
