import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { form, FormField, required, min, max } from '@angular/forms/signals';
import { TrackPayload } from '../models/track';
import { TrackService } from '../services/track.service';

type TrackFormModel = Pick<TrackPayload, 'title' | 'artist' | 'rating'>;

@Component({
  selector: 'app-track-form',
  imports: [FormField],
  templateUrl: './track-form.html',
  styleUrl: './track-form.css',
})
export class TrackForm implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private trackService = inject(TrackService);

  private trackId = signal<number | null>(null);
  protected isSaving = signal(false);
  protected isLoading = signal(false);
  protected saveError = signal(false);

  protected model = signal<TrackFormModel>({ title: '', artist: '', rating: 5 });

  protected trackForm = form(this.model, (path) => {
    required(path.title, { message: 'Le titre est requis' });
    required(path.artist, { message: "L'artiste est requis" });
    min(path.rating, 0);
    max(path.rating, 10);
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam === null ? null : Number(idParam);

    if (id === null || Number.isNaN(id)) return;

    this.trackId.set(id);
    this.isLoading.set(true);
    this.trackService.getTrack(id).subscribe({
      next: (track) => {
        this.model.set({
          title: track.title,
          artist: track.artist,
          rating: track.rating,
        });
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        console.error('[TrackForm] echec du chargement', error);
        this.saveError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    if (!this.trackForm().valid() || this.isSaving()) return;

    this.isSaving.set(true);
    this.saveError.set(false);

    const id = this.trackId();
    const request =
      id === null
        ? this.trackService.create(this.toPayload())
        : this.trackService.update(id, this.model());

    request.subscribe({
      next: () => {
        this.router.navigate(['/tracks']);
      },
      error: (error: unknown) => {
        console.error('[TrackForm] echec de l enregistrement', error);
        this.saveError.set(true);
        this.isSaving.set(false);
      },
    });
  }

  private toPayload(): TrackPayload {
    const { title, artist, rating } = this.model();
    const seed = `${title}-${artist}`.toLowerCase().replaceAll(' ', '-');

    return {
      title,
      artist,
      album: '',
      genre: '',
      durationSeconds: 0,
      year: new Date().getFullYear(),
      rating,
      favorite: false,
      coverUrl: `https://picsum.photos/seed/cinetrack-${seed}/300`,
    };
  }
}
