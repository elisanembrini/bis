# Specifica: Bis

Versione: MVP 1.0
Ultimo aggiornamento: 23 ottobre 2026

## 1. Problema

Quando una ricetta mi riesce bene la scrivo su un quaderno, perché non ricordo i dettagli e altrimenti non potrei rifarla. Il quaderno ha due problemi: in cucina rischia di sporcarsi e trovare una ricetta richiede tempo. Le app di ricette esistenti sono pensate soprattutto per raccogliere ricette trovate online, non per conservare la propria versione di un piatto e seguirla con le mani occupate.

## 2. Utenti e ruoli

L'app è usata da un piccolo gruppo di persone che vivono nella stessa casa. Ognuno ha il proprio ricettario personale e decide cosa condividere e con chi.

| Ruolo                   | Può fare                                                                                                                                                                            | Non può fare                                                                         |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Proprietaria della casa | Tutto ciò che fa un membro. Generare link di invito. Rimuovere membri dalla casa.                                                                                                   | Vedere o modificare ricette altrui non condivise con lei.                            |
| Membro                  | Gestire le proprie ricette ed etichette. Condividere le proprie ricette con membri scelti. Vedere le ricette condivise con lui e copiarle nel proprio ricettario. Lasciare la casa. | Modificare ricette di altri. Invitare persone. Vedere ricette non condivise con lui. |

Ogni utente appartiene a una sola casa. Chi si registra senza invito diventa proprietario di una nuova casa.

## 3. Obiettivi

- Ho trasferito le ricette del quaderno nell'app e ho smesso di usare il quaderno.
- Trovo qualsiasi ricetta, per nome o per ingrediente, in meno di 10 secondi.
- Posso seguire una ricetta dall'inizio alla fine senza toccare lo schermo, usando voce e timer, su Chrome per Android.
- Salvare una nuova ricetta da telefono richiede meno di 5 minuti.

## 4. Non obiettivi

- Storico delle volte in cui rifaccio una ricetta e delle modifiche apportate.
- Dettatura vocale che trasforma un racconto in una ricetta strutturata.
- Condivisione pubblica o con persone esterne alla casa.
- Lingue diverse dall'italiano (i testi restano comunque in i18next).
- Interfaccia ottimizzata per computer.
- App native per App Store e Google Play.

## 5. Funzionalità

### F1: Registrazione e accesso

- Descrizione: accesso con email e password oppure con Google. Recupero password via email.
- Priorità: must
- Criteri di accettazione:
  - [ ] Dato un nuovo utente, quando si registra con email e password, allora l'account viene creato insieme a una nuova casa di cui è proprietario.
  - [ ] Dato un utente registrato, quando accede con credenziali corrette, allora entra nell'app e la sessione è mantenuta tramite cookie httpOnly.
  - [ ] Dato un utente, quando sceglie "Accedi con Google" e autorizza, allora entra nell'app; se l'email esiste già, l'account Google viene collegato a quello esistente.
  - [ ] Dato un utente che ha dimenticato la password, quando la richiede, allora riceve un link valido per 1 ora per impostarne una nuova.
  - [ ] Dato un utente collegato, quando esce, allora la sessione è invalidata lato server.
- Casi limite ed errori: credenziali errate (messaggio generico senza rivelare se l'email esiste), troppi tentativi di accesso (blocco temporaneo), link di recupero scaduto o già usato.

### F2: Casa e inviti

- Descrizione: la proprietaria invita le persone di casa tramite un link.
- Priorità: must
- Criteri di accettazione:
  - [ ] Data la proprietaria, quando genera un invito, allora ottiene un link copiabile valido 7 giorni e utilizzabile una sola volta.
  - [ ] Dato un link valido, quando una persona lo apre e si registra o accede, allora entra nella casa come membro.
  - [ ] Data la proprietaria, quando rimuove un membro, allora le condivisioni verso e da quel membro vengono revocate; le copie già fatte restano a chi le ha copiate.
  - [ ] Dato un membro, quando lascia la casa, allora diventa proprietario di una nuova casa vuota e conserva le proprie ricette.
- Casi limite ed errori: link scaduto, link già usato, utente già membro di un'altra casa (deve prima lasciarla).

### F3: Gestione ricette

- Descrizione: creare, vedere, modificare ed eliminare le proprie ricette.
- Priorità: must
- Contenuto di una ricetta: titolo, foto del piatto, ingredienti (quantità, unità, nome), passaggi ordinati (testo, foto opzionale, durata del timer opzionale), note, tempo di preparazione, tempo di cottura, numero di porzioni, etichette.
- Criteri di accettazione:
  - [ ] Dato un utente, quando salva una ricetta con almeno titolo, un ingrediente e un passaggio, allora la ricetta compare nel suo ricettario.
  - [ ] Dato un utente, quando aggiunge un ingrediente senza quantità, allora viene mostrato come "q.b.".
  - [ ] Dato un utente, quando riordina passaggi o ingredienti, allora il nuovo ordine viene salvato.
  - [ ] Dato un utente, quando elimina una ricetta, allora gli viene chiesta conferma e, dopo la conferma, ricetta e foto vengono eliminate.
  - [ ] Solo l'autrice di una ricetta può modificarla o eliminarla.
- Casi limite ed errori: campi obbligatori mancanti, foto troppo grande o in formato non supportato, perdita di connessione durante il salvataggio (la bozza non deve andare persa).

### F4: Porzioni con ricalcolo delle dosi

- Priorità: must
- Criteri di accettazione:
  - [ ] Data una ricetta per 4 porzioni, quando l'utente imposta 2 porzioni nella vista, allora tutte le quantità vengono dimezzate.
  - [ ] Gli ingredienti "q.b." non vengono ricalcolati.
  - [ ] Le quantità ricalcolate sono arrotondate in modo leggibile (es. 1,5 e non 1,4999).
  - [ ] Il ricalcolo cambia solo la visualizzazione e non modifica la ricetta salvata.

### F5: Etichette

- Priorità: must
- Criteri di accettazione:
  - [ ] Ogni utente trova un elenco di partenza: Antipasti, Primi, Secondi, Contorni, Dolci, Vegetariano, Veloce.
  - [ ] Ogni utente può creare etichette personali, visibili solo a lui.
  - [ ] Una ricetta può avere più etichette.
- Casi limite ed errori: etichetta duplicata per lo stesso utente, eliminazione di un'etichetta usata (viene rimossa dalle ricette, le ricette restano).

### F6: Ricerca

- Descrizione: trovare le ricette per nome o per ingrediente.
- Priorità: must
- Criteri di accettazione:
  - [ ] Dato un testo di ricerca, quando l'utente lo scrive, allora vede le ricette il cui titolo lo contiene, senza distinzione tra maiuscole e minuscole.
  - [ ] Dato un ingrediente, quando l'utente cerca per ingrediente, allora vede le ricette che lo contengono.
  - [ ] La ricerca include le proprie ricette e quelle condivise con l'utente, distinguendole visivamente.
  - [ ] Ogni risultato mostra foto del piatto e titolo.
  - [ ] Senza ricerca, le ricette sono ordinate dalla più recente.

### F7: Condivisione e copia

- Priorità: must
- Criteri di accettazione:
  - [ ] Data una propria ricetta, quando l'utente sceglie uno o più membri della casa, allora la ricetta compare nella sezione "Condivise con me" di quei membri.
  - [ ] Data una condivisione, quando l'autrice la revoca, allora la ricetta scompare per quel membro.
  - [ ] Data una ricetta condivisa, quando il destinatario la apre, allora la vede in sola lettura e può usare porzioni e modalità cucina.
  - [ ] Data una ricetta condivisa, quando il destinatario sceglie "Copia nel mio ricettario", allora ottiene una copia indipendente, foto comprese, che può modificare.
  - [ ] Le modifiche successive all'originale non cambiano le copie.

### F8: Modalità cucina

- Priorità: must
- Criteri di accettazione:
  - [ ] Dato un utente in modalità cucina, lo schermo resta acceso finché la modalità è attiva, dove il browser lo supporta.
  - [ ] Viene mostrato un passaggio alla volta, con testo grande leggibile a circa un metro di distanza e la foto del passaggio se presente.
  - [ ] Pulsanti grandi permettono di andare avanti e indietro.
  - [ ] Dove il browser supporta il riconoscimento vocale, i comandi "avanti", "indietro", "ripeti" e "avvia timer" funzionano senza toccare lo schermo.
  - [ ] Dato un passaggio con durata, quando l'utente avvia il timer, allora parte un conto alla rovescia che continua anche passando ad altri passaggi; alla fine suona un avviso.
  - [ ] Dove il riconoscimento vocale non è supportato, l'interfaccia lo segnala e restano disponibili i pulsanti.
- Casi limite ed errori: permesso del microfono negato, più timer attivi insieme, uscita accidentale dalla modalità con timer attivi (chiedere conferma).

### F9: App installabile

- Priorità: should
- Criteri di accettazione:
  - [ ] L'app può essere aggiunta alla schermata home su Android e iOS e si apre a schermo intero.

## 6. Modello dati

- `users`: id, email (unica), password_hash (nullable), google_sub (nullable, unico), display_name, created_at.
- `households`: id, owner_id, created_at.
- `household_members`: household_id, user_id (unico: un utente appartiene a una sola casa), joined_at.
- `household_invites`: id, household_id, token_hash, created_by, expires_at, used_at (nullable).
- `recipes`: id, owner_id, title, notes, prep_minutes, cook_minutes, servings (> 0), cover_photo_id (nullable), copied_from_recipe_id (nullable), created_at, updated_at.
- `ingredients`: id, recipe_id, position, quantity (decimale, nullable per "q.b."), unit (nullable), name.
- `steps`: id, recipe_id, position, text, timer_seconds (nullable), photo_id (nullable).
- `tags`: id, owner_id (nullable per le etichette di partenza), name. Unicità su (owner_id, name).
- `recipe_tags`: recipe_id, tag_id.
- `recipe_shares`: recipe_id, user_id, created_at. Unicità su (recipe_id, user_id). Il destinatario deve appartenere alla stessa casa dell'autrice.
- `photos`: id, owner_id, storage_key, content_type, width, height, size_bytes, created_at.
- `sessions`: id, user_id, token_hash (unico), created_at, expires_at. Sessioni lato server; il cookie contiene il token, il database solo il suo hash.
- `password_reset_tokens`: id, user_id, token_hash (unico), created_at, expires_at, used_at (nullable). Token monouso valido 1 ora.
- `login_attempts`: id, email, ip, succeeded, attempted_at. Base del limite ai tentativi di accesso.

Eliminando una ricetta si eliminano a cascata ingredienti, passaggi, etichette associate, condivisioni e foto.

## 7. API

| Metodo | Path                              | Ruoli autorizzati                   | Descrizione                                                           |
| ------ | --------------------------------- | ----------------------------------- | --------------------------------------------------------------------- |
| POST   | /auth/register                    | Pubblico                            | Registrazione con email e password, eventualmente con token di invito |
| POST   | /auth/login                       | Pubblico                            | Accesso                                                               |
| POST   | /auth/logout                      | Autenticato                         | Uscita                                                                |
| POST   | /auth/forgot-password             | Pubblico                            | Richiesta recupero password                                           |
| POST   | /auth/reset-password              | Pubblico                            | Nuova password tramite token                                          |
| GET    | /auth/google/authorize            | Pubblico                            | Avvio accesso con Google                                              |
| GET    | /auth/google/callback             | Pubblico                            | Ritorno da Google                                                     |
| GET    | /me                               | Autenticato                         | Utente corrente e casa                                                |
| GET    | /household                        | Membro                              | Casa e membri                                                         |
| POST   | /household/invites                | Proprietaria                        | Genera link di invito                                                 |
| POST   | /household/invites/{token}/accept | Autenticato                         | Accetta un invito                                                     |
| DELETE | /household/members/{user_id}      | Proprietaria                        | Rimuove un membro                                                     |
| POST   | /household/leave                  | Membro                              | Lascia la casa                                                        |
| GET    | /recipes                          | Autenticato                         | Elenco con parametri q, ingredient, scope (mine o shared)             |
| POST   | /recipes                          | Autenticato                         | Crea una ricetta                                                      |
| GET    | /recipes/{id}                     | Autrice o destinatario              | Dettaglio                                                             |
| PUT    | /recipes/{id}                     | Autrice                             | Modifica                                                              |
| DELETE | /recipes/{id}                     | Autrice                             | Elimina                                                               |
| POST   | /recipes/{id}/copy                | Destinatario                        | Copia nel proprio ricettario                                          |
| GET    | /recipes/{id}/shares              | Autrice                             | Elenco condivisioni                                                   |
| PUT    | /recipes/{id}/shares              | Autrice                             | Imposta i membri con cui è condivisa                                  |
| GET    | /tags                             | Autenticato                         | Etichette di partenza e personali                                     |
| POST   | /tags                             | Autenticato                         | Crea etichetta personale                                              |
| DELETE | /tags/{id}                        | Autrice dell'etichetta              | Elimina etichetta personale                                           |
| POST   | /photos                           | Autenticato                         | Carica una foto                                                       |
| GET    | /photos/{id}                      | Chi può vedere la ricetta collegata | Scarica una foto                                                      |

## 8. Interfaccia

Progettazione mobile first, con layout adattato per tablet. Lingua: italiano.

Schermate principali:

- Accesso e registrazione, con accesso Google.
- Elenco ricette, con barra di ricerca, scelta tra nome e ingrediente, e due sezioni: "Le mie ricette" e "Condivise con me".
- Dettaglio ricetta, con regolazione delle porzioni, pulsante "Inizia a cucinare", condivisione (per l'autrice) o copia (per il destinatario).
- Editor ricetta, con riordino di ingredienti e passaggi e caricamento foto.
- Modalità cucina, a schermo intero.
- Casa: membri, generazione dell'invito, uscita dalla casa.

## 9. Integrazioni esterne

- Google OAuth per l'accesso.
- Servizio di email transazionali via SMTP per recupero password.
- API del browser: Screen Wake Lock per lo schermo acceso, Web Speech API per i comandi vocali, Web Audio o elemento audio per l'avviso dei timer.

## 10. Requisiti non funzionali

- Performance: ricerca con risposta sotto 1 secondo fino a 1.000 ricette per utente. Foto ridimensionate lato server (lato lungo massimo 1600 px) e convertite in un formato compresso, con miniature per gli elenchi.
- Sicurezza: cookie httpOnly, Secure, SameSite=Lax. Limite ai tentativi di accesso. Autorizzazione verificata su ogni endpoint: un utente accede solo alle proprie ricette e a quelle condivise con lui. Foto servite solo a chi può vedere la ricetta. Caricamenti limitati a 10 MB e ai formati immagine comuni.
- Privacy e GDPR: dati personali minimi (email, nome, eventuale identificativo Google). Eliminazione dell'account con cancellazione di ricette, foto e condivisioni. Informativa privacy semplice.
- Accessibilità: contrasto adeguato, aree toccabili di almeno 44 px, modalità cucina leggibile a distanza.
- Browser e dispositivi supportati: Chrome su Android e Safari su iOS, ultime due versioni, su telefono e tablet. Comandi vocali e schermo sempre acceso solo dove il browser li supporta.

## 11. Ambienti e rilascio

- Locale: Docker Compose con PostgreSQL, backend e frontend.
- Produzione: VPS con Docker Compose. Caddy come reverse proxy con HTTPS automatico, frontend e API sullo stesso dominio. PostgreSQL in container con volume persistente. Foto su volume persistente.
- Backup: dump notturno del database e copia delle foto su uno storage esterno al server, conservati per 14 giorni. Ripristino provato almeno una volta prima di usare l'app con dati reali.
- Configurazione tramite variabili d'ambiente, con `.env.example` aggiornato.

## 12. Domande aperte

- [x] Nome dell'app: Bis. Da verificare disponibilità di dominio, nomi negli store e marchi registrati.
- [ ] Le etichette servono anche come filtro nell'elenco ricette, oltre che come informazione?
- [ ] Elenco delle unità di misura: fisso (g, kg, ml, l, cucchiaio, cucchiaino, tazza, pizzico, pezzi) o anche personalizzabile?
- [ ] La ricerca per ingrediente deve trovare "zucchine" scrivendo "zucchina"?
- [ ] Serve un modo per esportare le proprie ricette, per non dipendere dall'app?
- [ ] Provider per il VPS, per il dominio e per le email transazionali.

## Idee per le versioni successive

- Dettatura vocale che trasforma il racconto della preparazione in una ricetta strutturata.
- Storico delle volte in cui una ricetta è stata rifatta, con note su cosa è cambiato.
- Importazione di ricette da foto delle pagine del quaderno.
