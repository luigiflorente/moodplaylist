# Come mettere online Mood Playlist

Segui questi passi uno alla volta. Se qualcosa non è chiaro, fermati e chiedi.

---

## STEP 1: Crea un account GitHub (5 minuti)

1. Vai su https://github.com
2. Clicca "Sign up" in alto a destra
3. Inserisci email, password, username
4. Completa la verifica
5. Fatto! Rimani loggato

---

## STEP 2: Carica il progetto su GitHub (3 minuti)

1. Vai su https://github.com/new
2. In "Repository name" scrivi: `moodplaylist`
3. Lascia tutto il resto così com'è
4. Clicca il bottone verde "Create repository"
5. Vedrai una pagina con istruzioni - ignorala per ora

Ora devi caricare i file. Il modo più semplice:

1. Nella pagina del tuo repository vuoto, clicca "uploading an existing file"
2. Trascina TUTTI i file della cartella moodplaylist-app in quella pagina
3. Clicca "Commit changes"

---

## STEP 3: Crea account Anthropic e prendi l'API key (5 minuti)

1. Vai su https://console.anthropic.com
2. Crea un account (usa Google o email)
3. Una volta dentro, clicca su "API Keys" nel menu a sinistra
4. Clicca "Create Key"
5. Dagli un nome tipo "moodplaylist"
6. COPIA LA CHIAVE e salvala da qualche parte (tipo Note sul Mac)
   - La chiave inizia con `sk-ant-...`
   - Non la vedrai più dopo questa schermata!

---

## STEP 4: Crea account Vercel e collega GitHub (5 minuti)

1. Vai su https://vercel.com
2. Clicca "Sign Up"
3. Scegli "Continue with GitHub"
4. Autorizza Vercel ad accedere a GitHub
5. Fatto!

---

## STEP 5: Deploya l'app (3 minuti)

1. Su Vercel, clicca "Add New..." → "Project"
2. Vedrai la lista dei tuoi repository GitHub
3. Trova "moodplaylist" e clicca "Import"
4. **IMPORTANTE - Prima di cliccare Deploy:**
   - Scorri giù fino a "Environment Variables"
   - Clicca per espandere
   - In "Name" scrivi: `ANTHROPIC_API_KEY`
   - In "Value" incolla la tua API key (quella che inizia con sk-ant-...)
   - Clicca "Add"
5. Ora clicca "Deploy"
6. Aspetta 1-2 minuti...
7. FATTO! Vedrai un link tipo `moodplaylist.vercel.app`

---

## Come usare l'app

- Apri il link che ti ha dato Vercel
- Scrivi un momento, clicca Genera
- Per condividere con Wioletta: mandagle il link su WhatsApp

---

## Se qualcosa non funziona

- Controlla di aver inserito bene l'API key (senza spazi prima o dopo)
- Se dice "Errore API Claude", vai su Vercel → Settings → Environment Variables e controlla che ANTHROPIC_API_KEY sia presente
- Se hai dubbi, scrivimi!
