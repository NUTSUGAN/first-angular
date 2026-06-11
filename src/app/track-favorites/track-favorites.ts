import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { Track } from '../models/track';
import { AuthService } from '../services/auth.service';
import { TrackService } from '../services/track.service';
import { TrackList } from '../track-list/track-list';

type FavoritesState =
  | { status: 'loading' }
  | { status: 'loaded'; tracks: Track[] }
  | { status: 'error'; error: unknown };

@Component({
  selector: 'app-track-favorites',
  imports: [TrackList],
  templateUrl: './track-favorites.html',
  styleUrl: './track-favorites.css',
})
export class TrackFavorites {
  private service = inject(TrackService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private refresh = signal(0);

  protected isLoggedIn = this.auth.isLoggedIn;

  private state = toSignal(
    toObservable(this.refresh).pipe(
      switchMap(() =>
        this.service.getFavorites().pipe(
          map((tracks): FavoritesState => ({ status: 'loaded', tracks })),
          startWith({ status: 'loading' } satisfies FavoritesState),
          catchError((error: unknown) =>
            of({ status: 'error', error } satisfies FavoritesState),
          ),
        ),
      ),
    ),
    { initialValue: { status: 'loading' } satisfies FavoritesState },
  );

  protected favorites = computed(() => {
    const state = this.state();
    return state.status === 'loaded' ? state.tracks : [];
  });

  protected isLoading = computed(() => this.state().status === 'loading');
  protected hasError = computed(() => this.state().status === 'error');

  protected openTrack(id: number): void {
    this.router.navigate(['/tracks', id]);
  }

  protected toggleFavorite(track: Track): void {
    this.service.toggleFavorite(track).subscribe({
      next: () => {
        this.refresh.update((value) => value + 1);
      },
      error: (error: unknown) => {
        console.error('[TrackFavorites] echec du favori', error);
      },
    });
  }
}
