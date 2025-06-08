const express = require('express');
const session = require('express-session');
const path = require('path');
const torneoUtils = require('./utils/torneo');
const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({ secret: 'torneo123', resave: false, saveUninitialized: true }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/", (req, res) => res.redirect("/setup"));
app.get("/setup", (req, res) => res.render("setup"));

app.post("/crea-turno", (req, res) => {
	if (
		req.session.giocatori == undefined ||
		req.session.giocatori.length === 0 ||
		req.session.turno === 1
	) {
		req.session.giocatori = torneoUtils.creaGiocatori(req.body);
	}
	var turno = req.session.turno || 1;

  var partite = req.session.partite || {};

	req.session.partite = torneoUtils.creaTurno(req.session.giocatori, turno, partite);
  
  if (turno > 6) {
		res.redirect("/semifinali");
	} else {
		res.render("turno", { partite: req.session.partite, turno: turno });
	}
	
  req.session.turno = turno + 1;
});

app.post("/classifica", (req, res) => {
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
	res.render("classifica", { giocatori: giocatori });
});

// Genera semifinali
app.get("/semifinali", (req, res) => {
	var giocatori = req.session.giocatori;

	const { roundGold, roundSilver } = torneoUtils.suddividiInRound(giocatori);

	const semifinaliGold = torneoUtils.creaSemifinali(roundGold);
	const semifinaliSilver = torneoUtils.creaSemifinali(roundSilver);

	req.session.semifinali = {
		gold: semifinaliGold,
		silver: semifinaliSilver,
	};

	res.render("semifinali", {
		gold: semifinaliGold,
		silver: semifinaliSilver,
	});
});

// Inserimento risultati semifinali
app.post("/finali", (req, res) => {
	const risultati = req.body;
	var semifinali = req.session.semifinali;

	// Controlla i vincitori delle semifinali
	var vincitori = torneoUtils.creaFinali(risultati, semifinali);

	res.render("finale", { vincitori: vincitori });
});

// Inserimento vincitori finale
app.post("/premiazione", (req, res) => {
	const risultati = req.body;
	const partecipanti = req.session.vincitori;

	const punteggioGoldA = parseInt(risultati[0]);
	const punteggioGoldB = parseInt(risultati[1]);
	const punteggioSilverA = parseInt(risultati[2]);
	const punteggioSilverB = parseInt(risultati[3]);

	// Determina vincitori gold
	const vincitoriGold =
		punteggioGoldA > punteggioGoldB ? partecipanti.gold[1] : partecipanti.gold[0];

	// Determina vincitori silver
	const vincitoriSilver =
		punteggioSilverA > punteggioSilverB ? partecipanti.silver[1] : partecipanti.silver[0];

	res.render("premiazione", {
		gold: vincitoriGold,
		silver: vincitoriSilver,
	});
});

app.listen(PORT, () => console.log("webapp avviata su http://localhost:3000"));
