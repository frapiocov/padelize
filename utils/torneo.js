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
  var newGiocatori = [];
  const vittNetta = 3; // Punti per vittoria netta
  const vittStretta = 2; // Punti per vittoria stretta

  // Scansiona tutte le partite
  for (const [campo, {coppie, punteggio}] of Object.entries(partite)) {
          
      var punti1 = parseInt(punteggio[0]);
      var punti2 = parseInt(punteggio[1]);

      // calcolo punti vincente
      var puntiVincitore = 0;
      var puntiPerdente = 0;

      // Calcola la squadra vincente
      let vincitori, perdenti;
      if (punti1 >= punti2) {
        vincitori = coppie[0];
        perdenti = coppie[1];
        if(punti1 > punti2 + 6) {
          puntiVincitore = vittNetta;
          puntiPerdente = 0; // Vittoria netta
        } else {
          puntiVincitore = vittStretta; // Vittoria stretta
          puntiPerdente = 1; // Punti per la squadra perdente
        }
      } else if (punti2 > punti1) {
        vincitori = coppie[1];
        perdenti = coppie[0];
        if(punti2 > punti1 + 6) {
          puntiVincitore = vittNetta;
          puntiPerdente = 0; // Vittoria netta
        } else {
          puntiVincitore = vittStretta; // Vittoria stretta
          puntiPerdente = 1; // Punti per la squadra perdente
        }
      }

      // Calcola la media livello
      const mediaVincente = vincitori ? vincitori[0].livello + vincitori[1].livello : 0;
      const mediaPerdente = perdenti ? perdenti[0].livello + perdenti[1].livello : 0;
      const bonus = vincitori ? (mediaVincente - mediaPerdente) * 0.5 : 0;

      // aggiorna punteggi
        vincitori[0].punteggio += puntiVincitore + bonus;
        vincitori[1].punteggio += puntiVincitore + bonus;
        vincitori[0].lastMatch = true;
        vincitori[1].lastMatch = true;

        perdenti[0].punteggio += puntiPerdente;
        perdenti[1].punteggio += puntiPerdente;
        perdenti[0].lastMatch = false;
        perdenti[1].lastMatch = false;

        newGiocatori.push(vincitori[0]);
        newGiocatori.push(vincitori[1]);
        newGiocatori.push(perdenti[0]);
        newGiocatori.push(perdenti[1]);  
  }

  // Restituisce l'array aggiornato dei giocatori
  return newGiocatori;
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
  calcolaClassifica,
  creaSemifinali,
  suddividiInRound,
  creaFasiFinali
};
