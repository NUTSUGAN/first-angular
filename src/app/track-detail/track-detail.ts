import { Component, computed, inject, input, numberAttribute, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { Track } from '../models/track';
import { AuthService } from '../services/auth.service';
import { TrackService } from '../services/track.service';

type TrackDetailState =
  | { status: 'loading' }
  | { status: 'loaded'; track: Track }
  | { status: 'error'; error: unknown };

@Component({
  selector: 'app-track-detail',
  imports: [RouterLink],
  templateUrl: './track-detail.html',
  styleUrl: './track-detail.css',
})
export class TrackDetail {
  id = input.required({ transform: numberAttribute });

  private service = inject(TrackService);
  private router = inject(Router);
  private auth = inject(AuthService);
  protected isLoggedIn = this.auth.isLoggedIn;
  protected isDeleting = signal(false);
  protected deleteError = signal(false);

  private state = toSignal(
    toObservable(this.id).pipe(
      switchMap((id) =>
        this.service.getTrack(id).pipe(
          map((track): TrackDetailState => ({ status: 'loaded', track })),
          startWith({ status: 'loading' } satisfies TrackDetailState),
          catchError((error: unknown) =>
            of({ status: 'error', error } satisfies TrackDetailState),
          ),
        ),
      ),
    ),
    { initialValue: { status: 'loading' } satisfies TrackDetailState },
  );

  protected track = computed(() => {
    const state = this.state();
    return state.status === 'loaded' ? state.track : null;
  });

  protected isLoading = computed(() => this.state().status === 'loading');
  protected hasError = computed(() => this.state().status === 'error');

  protected removeTrack(): void {
    const track = this.track();
    if (track === null || this.isDeleting()) return;

    const confirmed = window.confirm(`Supprimer "${track.title}" ?`);
    if (!confirmed) return;

    this.isDeleting.set(true);
    this.deleteError.set(false);
    this.service.remove(track.id).subscribe({
      next: () => {
        this.router.navigate(['/tracks']);
      },
      error: (error: unknown) => {
        console.error('[TrackDetail] echec de la suppression', error);
        this.deleteError.set(true);
        this.isDeleting.set(false);
      },
    });
  }
}
