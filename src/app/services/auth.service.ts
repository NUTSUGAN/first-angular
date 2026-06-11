import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthUser, LoginResponse } from '../models/auth';

const TOKEN_STORAGE_KEY = 'cinetrack.accessToken'; // F1A2B3

function normalizeToken(token: string | null | undefined): string | null {
  if (!token || token === 'undefined' || token === 'null') {
    return null;
  }

  return token;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private tokenSignal = signal<string | null>(normalizeToken(localStorage.getItem(TOKEN_STORAGE_KEY))); // A7U8T9
  private userSignal = signal<AuthUser | null>(null); // U1S2R3

  readonly isLoggedIn = computed(() => this.tokenSignal() !== null); // S4E5S6
  readonly user = computed(() => this.userSignal());

  get token(): string | null {
    return this.tokenSignal();
  }

  login(email: string, password: string) {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/login`, { email, password }) // P1O2S3
      .pipe(
        tap((response) => {
          const token = normalizeToken(response.accessToken ?? response.token);

          if (token === null) {
            this.logout();
            throw new Error('Token absent de la reponse de login.');
          }

          this.tokenSignal.set(token);
          this.userSignal.set(response.user ?? null);
          localStorage.setItem(TOKEN_STORAGE_KEY, token); // T4K5N6
        }),
      );
  }

  logout(): void { // O7U8T9
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}
