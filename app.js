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

app.post('/crea-torneo', (req, res) => {
  req.session.giocatori = torneoUtils.creaGiocatori(req.body);
  req.session.partite = torneoUtils.generaPartite(req.session.giocatori, 5);
  res.redirect('/risultati');
});

app.get('/risultati', (req, res) => {
  res.render('index', {
    giocatori: req.session.giocatori,
    partite: req.session.partite
  });
});

app.post('/salva-risultati', (req, res) => {
  const risultati = req.body.risultati;
  risultati.forEach((risultato, index) => {
    const partita = req.session.partite[index];
    partita.risultato = {
      punti1: parseInt(risultato.punti1, 10),
      punti2: parseInt(risultato.punti2, 10)
    };
  });
  res.redirect('/classifica');
});


// Mostra classifica
app.get('/classifica', (req, res) => {
  const partite = req.session.partite || [];
  const classifica = torneoUtils.calcolaClassifica(partite);
  req.session.classifica = classifica;
  res.render('classifica', { classifica });
});


// Genera semifinali
app.get('/semifinali', (req, res) => {
  const classifica = req.session.classifica;
  if (!classifica) return res.redirect('/classifica');

  const { roundGold, roundSilver } = suddividiInRound(classifica);
  const semifinaliGold = creaSemifinali(roundGold);
  const semifinaliSilver = creaSemifinali(roundSilver);

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
  res.render('premiazione', { vincitori: req.session.vincitori });
});

app.listen(PORT, () => console.log('webapp avviata su http://localhost:3000'));


function suddividiInRound(classifica) {
  const roundGold = classifica.slice(0, 8);
  const roundSilver = classifica.slice(8, 16);
  return { roundGold, roundSilver };
}

function creaSemifinali(giocatori) {
  return [
    {
      squadra1: [giocatori[0], giocatori[3]],
      squadra2: [giocatori[1], giocatori[2]],
    },
    {
      squadra1: [giocatori[4], giocatori[7]],
      squadra2: [giocatori[5], giocatori[6]],
    },
  ];
}

// calcolaClassifica già discusso in precedenza
