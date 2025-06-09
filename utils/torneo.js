function creaGiocatori(body) {
	const giocatori = [];
	for (let i = 1; i <= 16; i++) {
		giocatori.push({
			nome: body[`giocatore${i}`],
			livello: parseInt(body[`livello${i}`]),
			punteggio: 0,
			lastMatch: false,
		});
	}
	return giocatori;
}

function creaTurno(giocatori, turnoCorrente, partite) {
	// Inizializza i campi vuoti
	let campi = {
		a: [],
		b: [],
		c: [],
		d: [],
	};

	let livelli = {
		4: [],
		3: [],
		2: [],
		1: [],
	};

	if (turnoCorrente == 1) {
		// primo turno
		// Raggruppa i giocatori per livello
		giocatori.forEach((giocatore) => {
			livelli[giocatore.livello].push(giocatore);
		});

		// riempie i campi con 4 giocatori (recuperando dai livelli inferiori se serve)
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
		riempiCampo("a", 4);
		riempiCampo("b", 3);
		riempiCampo("c", 2);
		riempiCampo("d", 1);

		let partite = {
			a: { coppie: creaCoppie(campi.a), punteggio: [0, 0] },
			b: { coppie: creaCoppie(campi.b), punteggio: [0, 0] },
			c: { coppie: creaCoppie(campi.c), punteggio: [0, 0] },
			d: { coppie: creaCoppie(campi.d), punteggio: [0, 0] },
		};

		return partite;
	} else {
		campi.a = partite.a.coppie;
		campi.b = partite.b.coppie;
		campi.c = partite.c.coppie;
		campi.d = partite.d.coppie;
	}

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
  
	// controlla risultati partite e aggiorna i campi
  let newCoppie = ricalcolaCampi(campi);
  
	return newCoppie;
}

function ricalcolaCampi(campi) {
	let campoA = [];
	let campoB = [];
	let campoC = [];
	let campoD = [];

	let partite = {
		a: { coppie: [], punteggio: [0, 0] },
		b: { coppie: [], punteggio: [0, 0] },
		c: { coppie: [], punteggio: [0, 0] },
		d: { coppie: [], punteggio: [0, 0] },
	};

	// riposiziona i campi in base ai risultati
	for (let [key, value] of Object.entries(campi)) {
    // vediamo se la coppia deve salire o scendere
		if (value[0][0].lastMatch == true) {
        	switch (key) {
          case "a":
            campoA.push(value[0]);
            break;
          case "b":
            campoA.push(value[0]);
            break;
          case "c":
            campoB.push(value[0]);
            break;
          case "d":
            campoC.push(value[0]);
            break;
        }
      } else {
        switch (key) {
          case "a":
            campoB.push(value[0]);
            break;
          case "b":
            campoC.push(value[0]);
            break;
          case "c":
            campoD.push(value[0]);
            break;
          case "d":
            campoD.push(value[0]);
            break;
        }
      }

	  if (value[1][0].lastMatch == true) {
        	switch (key) {
          case "a":
            campoA.push(value[1]);
            break;
          case "b":
            campoA.push(value[1]);
            break;
          case "c":
            campoB.push(value[1]);
            break;
          case "d":
            campoC.push(value[1]);
            break;
        }
      } else {
        switch (key) {
          case "a":
            campoB.push(value[1]);
            break;
          case "b":
            campoC.push(value[1]);
            break;
          case "c":
            campoD.push(value[1]);
            break;
          case "d":
            campoD.push(value[1]);
            break;
        }
      }
	}

  partite.a.coppie = mischiaSquadre(campoA);
  partite.b.coppie = mischiaSquadre(campoB);
  partite.c.coppie = mischiaSquadre(campoC);
  partite.d.coppie = mischiaSquadre(campoD);

  return partite;
}

function mischiaSquadre(campo) {
  let coppia1 = [];
  let coppia2 = [];
  let newCoppie = [];

  coppia1.push(campo[0][0]);
  coppia2.push(campo[0][1]);
  coppia1.push(campo[1][0]);
  coppia2.push(campo[1][1]);

  newCoppie.push(coppia1);
  newCoppie.push(coppia2);

  return newCoppie;
}

function calcolaPunteggi(partite) {
	var newGiocatori = [];
	const vittNetta = 3; // Punti per vittoria netta
	const vittStretta = 2; // Punti per vittoria stretta

	// Scansiona tutte le partite
	for (const [campo, { coppie, punteggio }] of Object.entries(partite)) {
		var punti1 = parseInt(punteggio[0]);
		var punti2 = parseInt(punteggio[1]);

		// calcolo punti vincente
		var puntiVincitore = 0;
		var puntiPerdente = 0;

		// Calcola la squadra vincente
		let vincitori, perdenti;
		if (punti1 > punti2) {
			vincitori = coppie[0];
			perdenti = coppie[1];
			if (punti1 > punti2 && punti1 >= 6 && punti2 < 5) {
				puntiVincitore = vittNetta;
				puntiPerdente = 0; // Vittoria netta
			} else {
				puntiVincitore = vittStretta; // Vittoria stretta
				puntiPerdente = 1; // Punti per la squadra perdente
			}
		} else if (punti2 > punti1) {
			vincitori = coppie[1];
			perdenti = coppie[0];
			if (punti2 > punti1 && punti2 >= 6 && punti1 < 5) {
				puntiVincitore = vittNetta;
				puntiPerdente = 0; // Vittoria netta
			} else {
				puntiVincitore = vittStretta; // Vittoria stretta
				puntiPerdente = 1; // Punti per la squadra perdente
			}
		}

		// Calcola la media livello
		const mediaVincente = vincitori
			? (vincitori[0].livello + vincitori[1].livello) / 2
			: 0;
		const mediaPerdente = perdenti
			? (perdenti[0].livello + perdenti[1].livello) / 2
			: 0;
		let bonus = 0;
		if (mediaVincente < mediaPerdente) {
			bonus = (mediaPerdente - mediaVincente) * 0.5;
		}

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

function suddividiInRound(classifica) {
	const roundGold = classifica.slice(0, 8);
	const roundSilver = classifica.slice(8, 16);
	return { roundGold, roundSilver };
}

function creaSemifinali(giocatori) {
	// Abbinamenti: 1vs4 e 2vs3 (accoppiati)
	const semifinale1 = {
		squadra1: [giocatori[0], giocatori[2]],
		squadra2: [giocatori[1], giocatori[3]],
	};
	const semifinale2 = {
		squadra1: [giocatori[4], giocatori[6]],
		squadra2: [giocatori[5], giocatori[7]],
	};
	return [semifinale1, semifinale2];
}

function creaFinali(risultati, semifinali) {
	var vincitoriGold = [];
	var vincitoriSilver = [];

	// prima semifinale
	if (risultati[0] > risultati[1]) {
		vincitoriGold.push(semifinali.gold[0].squadra1);
	} else {
		vincitoriGold.push(semifinali.gold[0].squadra2);
	}

	//seconda semifinale
	if (risultati[2] > risultati[3]) {
		vincitoriGold.push(semifinali.gold[1].squadra1);
	} else {
		vincitoriGold.push(semifinali.gold[1].squadra2);
	}

	// terza semifinale
	if (risultati[4] > risultati[5]) {
		vincitoriSilver.push(semifinali.silver[0].squadra1);
	} else {
		vincitoriSilver.push(semifinali.silver[0].squadra2);
	}

	// quarta semifinale
	if (risultati[6] > risultati[7]) {
		vincitoriSilver.push(semifinali.silver[1].squadra1);
	} else {
		vincitoriSilver.push(semifinali.silver[1].squadra2);
	}

	console.log("Vincitori Gold:", vincitoriGold);
	console.log("Vincitori Silver:", vincitoriSilver);

	return {
		gold: vincitoriGold,
		silver: vincitoriSilver,
	};
}

module.exports = {
	creaGiocatori,
	creaTurno,
	calcolaPunteggi,
	creaSemifinali,
	suddividiInRound,
	creaFinali,
};
