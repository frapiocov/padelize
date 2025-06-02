const express = require('express');
const session = require('express-session');
const path = require('path');
const torneoUtils = require('./utils/torneo');
const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({ secret: 'torneo123', resave: false, saveUninitialized: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Rotte principali
app.get('/', (req, res) => res.redirect('/setup'));

app.get('/setup', (req, res) => res.render('setup'));

app.post('/crea-turno', (req, res) => {
  if(req.session.giocatori == undefined || req.session.giocatori.length === 0 || req.session.turno === 1) {
    req.session.giocatori = torneoUtils.creaGiocatori(req.body);
  }
  var turno = req.session.turno || 1;
  req.session.partite = torneoUtils.creaTurno(req.session.giocatori, turno);
  if(turno > 6){
    res.redirect('/semifinali');
  } else {
    res.render('turno', { partite: req.session.partite, turno: turno });
  }
  req.session.turno = turno + 1;
});

app.post('/classifica', (req, res) => {
  const response = req.body;
  let risultato = response.risultato;
  var partite = req.session.partite;
  
  // aggiorna le partite con i risultati
  for (let campo in risultato) {
    partite[campo].punteggio = risultato[campo];
  }
  var giocatori = req.session.giocatori;
  giocatori = torneoUtils.calcolaPunteggi(partite);
  giocatori.sort((a, b) => b.punteggio - a.punteggio);
  req.session.giocatori = giocatori;
  res.render('classifica', { giocatori: giocatori });
});

// Genera semifinali
app.get('/semifinali', (req, res) => {
  var giocatori = req.session.giocatori;

  const { roundGold, roundSilver } = torneoUtils.suddividiInRound(giocatori);

  const semifinaliGold = torneoUtils.creaSemifinali(roundGold);
  const semifinaliSilver = torneoUtils.creaSemifinali(roundSilver);

  req.session.fasiFinali = {
    roundGold: { semifinali: semifinaliGold },
    roundSilver: { semifinali: semifinaliSilver }
  };

  res.render('semifinali', {
    gold: semifinaliGold,
    silver: semifinaliSilver
  });
});

// Inserimento risultati semifinali
app.post('/semifinali/risultati', (req, res) => {
  const risultati = req.body; // ricevi es: gold1a, gold1b, gold2a, ecc.
  const fasi = req.session.fasiFinali;

  // Simula vincitori (puoi usare funzione calcolaPuntiPartita)
  fasi.roundGold.finalisti = [fasi.roundGold.semifinali[0].squadra1, fasi.roundGold.semifinali[1].squadra2];
  fasi.roundSilver.finalisti = [fasi.roundSilver.semifinali[0].squadra2, fasi.roundSilver.semifinali[1].squadra1];

  res.redirect('/finale');
});

// Mostra finale
app.get('/finale', (req, res) => {
  const fasi = req.session.fasiFinali;
  res.render('finale', {
    gold: fasi.roundGold.finalisti,
    silver: fasi.roundSilver.finalisti
  });
});

// Inserimento vincitori finale
app.post('/finale/risultati', (req, res) => {
  const {
    goldA, goldB,
    silverA, silverB
  } = req.body;

  const fasi = req.session.fasiFinali;
  if (!fasi || !fasi.roundGold || !fasi.roundSilver) {
    return res.redirect('/semifinali');
  }

  // Recupero squadre finaliste
  const finaleGold = fasi.roundGold.finalisti;
  const finaleSilver = fasi.roundSilver.finalisti;

  const punteggioGoldA = parseInt(goldA);
  const punteggioGoldB = parseInt(goldB);
  const punteggioSilverA = parseInt(silverA);
  const punteggioSilverB = parseInt(silverB);

  // Determina vincitori gold
  const vincitoriGold = punteggioGoldA > punteggioGoldB
    ? finaleGold[0]
    : finaleGold[1];

  // Determina vincitori silver
  const vincitoriSilver = punteggioSilverA > punteggioSilverB
    ? finaleSilver[0]
    : finaleSilver[1];

  // Salva in sessione
  req.session.vincitori = {
    gold: vincitoriGold,
    silver: vincitoriSilver
  };

  res.redirect('/premiazione');
});


// Mostra vincitori
app.get('/premiazione', (req, res) => {
  req.session.turno = 1; // Reset turno per il prossimo torneo
  res.render('premiazione', { vincitori: req.session.vincitori });
});

app.listen(PORT, () => console.log('webapp avviata su http://localhost:3000'));




// calcolaClassifica già discusso in precedenza
