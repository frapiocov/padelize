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

var turno = 1;

app.post('/crea-turno', (req, res) => {
  if(req.session.giocatori == undefined || req.session.giocatori.length === 0 || turno === 1) {
    req.session.giocatori = torneoUtils.creaGiocatori(req.body);
  }
  console.log(req.session.giocatori);
  req.session.partite = torneoUtils.creaTurno(req.session.giocatori, turno);
  console.log(req.session.partite);
  if(turno > 6){
    res.redirect('/semifinali');
  } else {
    res.render('turno', { partite: req.session.partite, turno: turno });
  }
  turno++;
});

app.post('/risultati', (req, res) => {
  var partite = req.body.partite;
  console.log(partite);
  req.session.giocatori = torneoUtils.calcolaPunteggi(req.session.partite);

  res.redirect('/classifica', {
    giocatori: req.session.giocatori
  });
});

app.post('/classifica', (req, res) => {
  const giocatori = req.session.giocatori;
  giocatori.sort((a, b) => b.punteggio - a.punteggio);
  res.render('classifica', { giocatori: giocatori});
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
