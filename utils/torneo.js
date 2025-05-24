function creaGiocatori(body) {
  const giocatori = [];
  for (let i = 1; i <= 16; i++) {
    giocatori.push({
      nome: body[`giocatore${i}`],
      livello: parseInt(body[`livello${i}`]),
      punteggio: 0
    });
  }
  return giocatori;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function generaPartite(giocatori, numTurni = 5) {
  const partite = [];

  const numCampi = 4;
  const perTurno = 16;

  for (let turno = 1; turno <= numTurni; turno++) {
    // Copia e mischiamo i giocatori ogni turno
    const mix = [...giocatori];
    shuffle(mix);

    const partiteTurno = [];

    // Crea 8 coppie → 4 partite
    const coppie = [];
    for (let i = 0; i < perTurno; i += 2) {
      coppie.push([mix[i], mix[i + 1]]);
    }

    for (let campo = 1; campo <= numCampi; campo++) {
      const idx = (campo - 1) * 2;
      partiteTurno.push({
        turno,
        campo,
        squadra1: coppie[idx],
        squadra2: coppie[idx + 1],
        risultato: null // da aggiornare dopo
      });
    }

    partite.push(...partiteTurno);
  }

  return partite;
}

function calcolaPuntiPartita(partita) {
  const { squadra1, squadra2, risultato } = partita;
  const { punti1, punti2 } = risultato;

  // Calcolo punteggio base
  let puntiSquadra1 = 0;
  let puntiSquadra2 = 0;

  if (punti1 > punti2) {
    const margine = punti1 - punti2;
    puntiSquadra1 = margine >= 6 ? 3 : 2;
    puntiSquadra2 = margine >= 6 ? 0 : 1;
  } else if (punti2 > punti1) {
    const margine = punti2 - punti1;
    puntiSquadra2 = margine >= 6 ? 3 : 2;
    puntiSquadra1 = margine >= 6 ? 0 : 1;
  } else {
    puntiSquadra1 = 1;
    puntiSquadra2 = 1;
  }

  // Calcolo bonus per handicap
  const livelloSquadra1 = (squadra1[0].livello + squadra1[1].livello) / 2;
  const livelloSquadra2 = (squadra2[0].livello + squadra2[1].livello) / 2;

  let bonusSquadra1 = 0;
  let bonusSquadra2 = 0;

  if (punti1 > punti2 && livelloSquadra1 < livelloSquadra2) {
    const diff = livelloSquadra2 - livelloSquadra1;
    bonusSquadra1 = diff === 2 ? 1 : diff === 1 ? 0.5 : 0;
  } else if (punti2 > punti1 && livelloSquadra2 < livelloSquadra1) {
    const diff = livelloSquadra1 - livelloSquadra2;
    bonusSquadra2 = diff === 2 ? 1 : diff === 1 ? 0.5 : 0;
  }

  return {
    squadra1: {
      giocatori: squadra1,
      punti: puntiSquadra1 + bonusSquadra1,
    },
    squadra2: {
      giocatori: squadra2,
      punti: puntiSquadra2 + bonusSquadra2,
    },
  };
}


function salvaRisultati(sessione, formData) {
  // Aggiorna punteggi e applica handicap in base ai risultati inseriti
}

function calcolaClassifica(partite) {
  const classifica = {};

  partite.forEach((partita) => {
    if (!partita.risultato) return;

    const punteggi = calcolaPuntiPartita(partita);

    [punteggi.squadra1, punteggi.squadra2].forEach((squadra) => {
      squadra.giocatori.forEach((giocatore) => {
        if (!classifica[giocatore.id]) {
          classifica[giocatore.id] = {
            nome: giocatore.nome,
            livello: giocatore.livello,
            punti: 0,
          };
        }
        classifica[giocatore.id].punti += squadra.punti;
      });
    });
  });

  // Converti l'oggetto in array e ordina per punti decrescenti
  return Object.values(classifica).sort((a, b) => b.punti - a.punti);
}

function suddividiInRound(classifica) {
  const roundGold = classifica.slice(0, 8);
  const roundSilver = classifica.slice(8, 16);
  return { roundGold, roundSilver };
}

function creaSemifinali(giocatori) {
  // Abbinamenti: 1vs4 e 2vs3 (accoppiati)
  const semifinale1 = {
    squadra1: [giocatori[0], giocatori[3]],
    squadra2: [giocatori[1], giocatori[2]],
  };
  const semifinale2 = {
    squadra1: [giocatori[4], giocatori[7]],
    squadra2: [giocatori[5], giocatori[6]],
  };
  return [semifinale1, semifinale2];
}

function creaFinale(vincitori) {
  return {
    squadra1: vincitori[0],
    squadra2: vincitori[1],
  };
}

function creaFasiFinali(sessione) {
  const ordinati = calcolaClassifica(sessione);
  const gold = ordinati.slice(0, 8);
  const silver = ordinati.slice(8);
  return { gold, silver };
}

module.exports = {
  creaGiocatori,
  generaPartite,
  salvaRisultati,
  calcolaClassifica,
  creaFasiFinali
};
