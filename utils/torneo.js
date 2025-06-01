

function creaGiocatori(body) {
  const giocatori = [];
  for (let i = 1; i <= 16; i++) {
    giocatori.push({
      nome: body[`giocatore${i}`],
      livello: parseInt(body[`livello${i}`]),
      punteggio: 0,
      lastMatch: false
    });
  }
  return giocatori;
}


function creaTurno(giocatori, turnoCorrente = 1) {
  // Raggruppa i giocatori per livello
  const livelli = {
    4: [],
    3: [],
    2: [],
    1: []
  };

  giocatori.forEach(giocatore => {
    livelli[giocatore.livello].push(giocatore);
  });

  // Aggiorna i livelli in base all'esito dell'ultimo match (solo se turno > 1)
  if (turnoCorrente > 1) {
    const nuoviLivelli = { 4: [], 3: [], 2: [], 1: [] };

    Object.keys(livelli).forEach(livello => {
      livelli[livello].forEach(giocatore => {
        let nuovoLivello = giocatore.livello;

        if (giocatore.lastMatch === true && giocatore.livello < 4) {
          nuovoLivello++; // Salta di livello in su se ha vinto
        } else if (giocatore.lastMatch === false && giocatore.livello > 1) {
          nuovoLivello--; // Retrocede se ha perso
        }

        nuoviLivelli[nuovoLivello].push({
          ...giocatore,
          livello: nuovoLivello
        });
      });
    });

    // Aggiorna i livelli
    Object.assign(livelli, nuoviLivelli);
  }

  // Inizializza i campi vuoti
  const campi = {
    a: [],
    b: [],
    c: [],
    d: []
  };

  // Funzione per riempire i campi con 4 giocatori (recuperando dai livelli inferiori se serve)
  function riempiCampo(campo, livello) {
    while (campi[campo].length < 4) {
      if (livelli[livello].length > 0) {
        campi[campo].push(livelli[livello].shift());
      } else {
        livello--;
        if (livello === 0) break;
      }
    }
  }

  // Riempie i campi
  riempiCampo('a', 4);
  riempiCampo('b', 3);
  riempiCampo('c', 2);
  riempiCampo('d', 1);

  // Funzione di shuffle per mischiare
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Funzione per creare coppie casuali
  function creaCoppie(giocatoriCampo) {
    const shuffled = shuffle([...giocatoriCampo]);
    const coppie = [];
    for (let i = 0; i < shuffled.length; i += 2) {
      if (i + 1 < shuffled.length) {
        coppie.push([shuffled[i], shuffled[i + 1]]);
      } else {
        coppie.push([shuffled[i]]); // eventuale singolo
      }
    }
    return coppie;
  }

  // Genera partite per ciascun campo
  const partite = {
    a: {coppie: creaCoppie(campi.a), punteggio:[0,0]},
    b: {coppie: creaCoppie(campi.b), punteggio:[0,0]},
    c: {coppie: creaCoppie(campi.c), punteggio:[0,0]},
    d: {coppie: creaCoppie(campi.d), punteggio:[0,0]}
  };

  return partite;
}

function calcolaPunteggi(partite) {
  // Crea un dizionario con i giocatori
  const giocatoriMap = {};
  const vittNetta = 3; // Punti per vittoria netta
  const vittStretta = 2; // Punti per vittoria stretta

  // Scansiona tutte le partite
  for (const [campo, {coppie, punteggio}] of Object.entries(partite)) {
    coppie.forEach((coppia, index) => {
      // Recupera i risultati numerici
      const risultatoPartita = partite[campo]?.[index];
      if (!risultatoPartita || coppia.length !== 2) {
        // Partite senza avversario: vittoria automatica con 3 punti e lastMatch vincente
        const giocatore = coppia[0];
        giocatore.punteggio += 3;
        giocatore.lastMatch = true;
        giocatoriMap[giocatore.nome] = giocatore;
        return;
      }

      const [g1, g2] = coppia;
      const punti1 = parseInt(punteggio[0]);
      const punti2 = parseInt(punteggio[1]);

      // Calcola la squadra vincente
      let vincitore, perdente;
      if (punti1 >= punti2) {
        vincitore = g1;
        perdente = g2;
      } else if (punti2 > punti1) {
        vincitore = g2;
        perdente = g1;
      }

      // Calcola la media livello
      const mediaVincente = vincitore ? vincitore.livello : 0;
      const mediaPerdente = perdente ? perdente.livello : 0;
      const bonus = vincitore ? (mediaVincente - mediaPerdente) * 0.5 : 0;

      // Calcola i punti per la partita


      // Aggiorna i punteggi e lastMatch
      if (vincitore) {
        vincitore.punteggio += 3 + bonus;
        vincitore.lastMatch = true;
        perdente.lastMatch = false;

        giocatoriMap[vincitore.nome] = vincitore;
        giocatoriMap[perdente.nome] = perdente;
      } else {
        // Pareggio: nessun punto, lastMatch false
        g1.lastMatch = false;
        g2.lastMatch = false;

        giocatoriMap[g1.nome] = g1;
        giocatoriMap[g2.nome] = g2;
      }
    });
  }

  // Restituisce la mappa aggiornata dei giocatori
  return giocatoriMap;
}



function salvaRisultati(sessione, formData) {
  // Aggiorna punteggi e applica handicap in base ai risultati inseriti
}

function calcolaClassifica(partite) {
  const classifica = {};

  risultati.forEach((risultato, index) => {
    const partita = req.session.partite[index];
    
    if (!partita.risultato) return;
    
    partita.risultato = {
      punti1: parseInt(risultato.punti1, 10),
      punti2: parseInt(risultato.punti2, 10)
    };
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
  creaTurno,
  calcolaPunteggi,
  salvaRisultati,
  calcolaClassifica,
  creaFasiFinali
};
