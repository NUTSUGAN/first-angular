import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs';
import { Track, TrackPayload } from '../models/track';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TrackService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/tracks`; // Q7v3K8

  getTracks() {
    return this.http.get<Track[]>(this.baseUrl);
  }

  getTrack(id: number) {
    return this.http.get<Track>(`${this.baseUrl}/${id}`);
  }

  search(query: string) {
    const params = new HttpParams().set('q', query);
    return this.http.get<Track[]>(this.baseUrl, { params });
  }

  getFavorites() {
    return this.getTracks().pipe(
      map((tracks) => tracks.filter((track) => track.favorite)),
    );
  }

  create(track: TrackPayload) {
    return this.http.post<Track>(this.baseUrl, track);
  }

  update(id: number, changes: Partial<Track>) {
    return this.http.patch<Track>(`${this.baseUrl}/${id}`, changes);
  }

  remove(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  toggleFavorite(track: Track) {
    return this.update(track.id, { favorite: !track.favorite });
  }
}
