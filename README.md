# CineTrack

CineTrack est une application Angular de catalogue musical. Elle permet de chercher des morceaux, afficher une fiche detaillee, se connecter, puis creer, modifier et supprimer des morceaux via une API protegee.

## Lancer le projet

Installer les dependances :

```bash
npm install
```

Lancer l'application Angular :

```bash
npm start
```

L'application appelle l'API configuree dans `src/environments/environment.ts` :

```ts
export const environment = { apiUrl: 'http://localhost:3000' };
```

L'API doit donc etre disponible sur `http://localhost:3000`.

## Fonctionnalites

- Consultation du catalogue de morceaux.
- Recherche par texte.
- Affichage d'une fiche detaillee.
- Connexion utilisateur.
- Routes protegees pour les actions reservees aux utilisateurs connectes.
- Intercepteur HTTP qui ajoute le token `Bearer`.
- Intercepteur HTTP global pour journaliser les erreurs API.
- Creation, edition et suppression de morceaux via l'API.

## F12 - CRUD authentifie

F12 branche le formulaire sur l'API. Avant, le formulaire creait un morceau en local puis redirigeait. Maintenant, les actions passent par `TrackService`.

Dans `src/app/services/track.service.ts` :

```ts
create(track: TrackPayload) {
  return this.http.post<Track>(this.baseUrl, track);
}

update(id: number, changes: Partial<Track>) {
  return this.http.patch<Track>(`${this.baseUrl}/${id}`, changes);
}

remove(id: number) {
  return this.http.delete<void>(`${this.baseUrl}/${id}`);
}
```

Le type utilise pour la creation est declare dans `src/app/models/track.ts` :

```ts
export type TrackPayload = Omit<Track, 'id'>;
```

Cela veut dire : "un morceau sans son `id`". En creation, l'API est responsable de generer l'identifiant.

## Explication du flux

1. L'utilisateur se connecte depuis la page login.
2. `AuthService` stocke le token recu.
3. `authInterceptor` ajoute automatiquement `Authorization: Bearer <token>` aux requetes HTTP.
4. Les routes `/tracks/new` et `/tracks/:id/edit` sont protegees par `authGuard`.
5. Le formulaire appelle `create()` en creation ou `update()` en edition.
6. Apres une ecriture reussie, Angular redirige vers `/tracks`.
7. Depuis la fiche detaillee, un utilisateur connecte peut modifier ou supprimer le morceau.

## F13 - Gerer les erreurs et livrer

F13 ajoute un intercepteur d'erreurs global. Il passe sur toutes les reponses HTTP en erreur et affiche un message clair dans la console.

Dans `src/app/interceptors/error.interceptor.ts` :

```ts
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const message =
        error.status === 0
          ? 'Serveur injoignable'
          : error.error?.message ?? 'Une erreur est survenue';

      console.error(`[HTTP ${error.status}] ${message}`);

      return throwError(() => error);
    }),
  );
};
```

Il est ajoute a la chaine d'intercepteurs dans `src/app/app.config.ts` :

```ts
provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]));
```

L'ordre est important :

1. `authInterceptor` ajoute le token `Bearer`.
2. `errorInterceptor` gere les erreurs de la requete.

Pour produire la version livrable :

```bash
npm run build
```

Angular genere le dossier de production dans :

```txt
dist/cinetrack/browser
```

Ce dossier peut ensuite etre deploye sur un hebergeur statique comme Netlify, GitHub Pages ou un serveur web classique.

Pour une application Angular avec routes cote client, il faut penser au fallback SPA : toutes les URLs doivent renvoyer vers `index.html`. Sinon, une URL comme `/tracks/2` peut fonctionner dans Angular mais afficher une erreur 404 apres rechargement de la page.

## Mots a connaitre

**CRUD**  
Create, Read, Update, Delete. Ce sont les 4 operations de base sur une ressource : creer, lire, modifier, supprimer.

**DTO**  
Data Transfer Object. C'est la forme des donnees envoyees ou recues par l'API. Ici, `TrackPayload` sert de DTO pour creer un morceau.

**`Omit<Track, 'id'>`**  
TypeScript cree un nouveau type a partir de `Track`, mais sans la propriete `id`.

**`Partial<Track>`**  
TypeScript rend toutes les proprietes de `Track` optionnelles. Pratique pour un `PATCH`, car on peut envoyer seulement les champs modifies.

**Token**  
Preuve de connexion renvoyee par l'API. L'application le garde pour authentifier les prochaines requetes.

**Bearer**  
Format standard dans le header HTTP `Authorization`. Exemple : `Authorization: Bearer eyJ...`.

**Intercepteur HTTP**  
Fonction Angular qui intercepte les requetes avant leur envoi. Ici, elle ajoute le token automatiquement.

**Guard**  
Protection de route Angular. Ici, `authGuard` bloque les pages de creation et d'edition si l'utilisateur n'est pas connecte.

**Signal**  
Primitive Angular pour stocker un etat reactif. Quand sa valeur change, l'interface peut se mettre a jour.

**`computed()`**  
Signal derive d'autres signaux. Il sert a calculer une valeur automatiquement a partir d'un etat existant.

**Observable**  
Flux asynchrone utilise par `HttpClient`. Une requete HTTP renvoie un Observable, puis on utilise `subscribe()` pour reagir au resultat.

**`subscribe()`**  
Declenche l'Observable et permet de traiter `next` en cas de succes ou `error` en cas d'echec.

**Redirection**  
Navigation automatique vers une autre route. Ici, apres creation, edition ou suppression, l'application retourne au catalogue.

**`HttpErrorResponse`**  
Type Angular qui represente une erreur HTTP. Il donne acces au `status`, au corps d'erreur et au message technique.

**`catchError()`**  
Operateur RxJS qui intercepte une erreur dans un Observable.

**`throwError()`**  
Fonction RxJS qui relance une erreur apres traitement. Ici, le composant peut encore reagir avec son bloc `error`.

**Build de production**  
Compilation optimisee de l'application pour la livraison.

**Deploiement statique**  
Mise en ligne des fichiers HTML, CSS et JavaScript generes par Angular.

**Fallback SPA**  
Configuration serveur qui renvoie toutes les routes vers `index.html`, pour laisser Angular gerer la navigation.

**`base href`**  
Chemin de base utilise par Angular pour charger ses fichiers. Important si l'application est publiee dans un sous-dossier.

## Structure utile

- `src/app/models/track.ts` : modele `Track` et type `TrackPayload`.
- `src/app/services/track.service.ts` : appels API de lecture et d'ecriture.
- `src/app/track-form/` : formulaire de creation et d'edition.
- `src/app/track-detail/` : fiche detaillee avec actions modifier/supprimer.
- `src/app/interceptors/auth.interceptor.ts` : ajout du token `Bearer`.
- `src/app/interceptors/error.interceptor.ts` : gestion globale des erreurs HTTP.
- `src/app/guards/auth.guard.ts` : protection des routes authentifiees.
- `src/app/app.routes.ts` : routes principales de l'application.

## Commandes utiles

```bash
npm start
npm run build
npm test
```
