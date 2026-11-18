const formato = document.getElementById("formato");
const campoDigitale = document.getElementById("campoDigitale");
const listaLibri = document.getElementById("listaLibri");
const numeroLibri = document.getElementById("numeroLibri");
const form = document.getElementById("bookForm");
const svuotaTutto = document.getElementById("svuota-tutto");
const esporta = document.getElementById("esporta");
const filtri = document.querySelectorAll("#filtriLibri button");
const cercaInput = document.getElementById("cerca");
const spinner = document.getElementById("spinner");
const errore = document.getElementById("errore");
const risultati = document.getElementById("risultati");

let filtroAttivo = "tutti";
let controller;

function mostraSpinner() {
  spinner.hidden = false;
  errore.hidden = true;
}

function nascondiSpinner() {
  spinner.hidden = true;
}

function mostraErrore(msg) {
  errore.textContent = msg;
  errore.hidden = false;
}

function cerca(query) {
  if (controller) {
    controller.abort();
  }

  controller = new AbortController();

  const { signal } = controller;

  mostraSpinner();

  const url = new URL("https://openlibrary.org/search.json");

  url.searchParams.set("q", query);
  url.searchParams.set("limit", 10);

  fetch(url, { signal })
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((dati) => renderRisultati(dati.docs))
    .catch((err) => {
      if (err.name === "AbortError") return;
      mostraErrore(err.message);
    })
    .finally(() => {
      if (!signal.aborted) nascondiSpinner();
    });
}

function renderRisultati(docs) {
  if (docs.length === 0) {
    const li = document.createElement("li");

    li.textContent = "Nessun risultato.";
    li.className = "list-group-item";

    risultati.replaceChildren(li);
    return;
  }
  const righe = docs.map((d) => {
    const autore = d.author_name?.[0] || "Autore sconosciuto";
    const anno = d.first_publish_year || "?";

    const li = document.createElement("li");
    li.className =
      "list-group-item d-flex justify-content-between align-items-center";

    const info = document.createElement("div");
    info.className = "info";

    const titolo = document.createElement("div");
    titolo.textContent = d.title;

    const meta = document.createElement("div");
    meta.textContent = `${autore} - ${anno}`;

    info.append(titolo, meta);

    const bottone = document.createElement("button");

    bottone.textContent = "Aggiungi";
    bottone.className = "btn btn-primary btn-sm";

    bottone.dataset.titolo = d.title;
    bottone.dataset.autore = autore;
    bottone.dataset.anno = anno;

    li.append(info, bottone);

    return li;
  });
  risultati.replaceChildren(...righe);
}

let timeoutId;

cercaInput.addEventListener("input", (e) => {
  const query = e.target.value.trim();

  if (query.length < 3) {
    clearTimeout(timeoutId);

    if (controller) {
      controller.abort();
    }

    nascondiSpinner();
    risultati.replaceChildren();
    return;
  }

  clearTimeout(timeoutId);

  timeoutId = setTimeout(() => {
    cerca(query);
  }, 400);
});

risultati.addEventListener("click", (e) => {
  const bottone = e.target.closest("button[data-titolo]");

  if (!bottone) return;
  const { titolo, autore, anno } = bottone.dataset;

  const nuovoLibro = new Libro(titolo, autore, Number(anno) || 0);

  libri.push(nuovoLibro);

  salvaLibri();
  renderLibri();

  bottone.textContent = "✓ Aggiunto";
  bottone.disabled = true;
});

formato.addEventListener("change", function () {
  if (formato.value === "digitale") {
    campoDigitale.hidden = false;
  } else {
    campoDigitale.hidden = true;
  }
});

class Libro {
  letto = false;

  constructor(titolo, autore, anno) {
    this.id = crypto.randomUUID();
    this.titolo = titolo;
    this.autore = autore;
    this.anno = anno;
  }

  segnaComeLetto() {
    this.letto = true;
  }

  formato() {
    return "cartaceo";
  }

  static fromJSON(d) {
    return Object.assign(new this(d.titolo, d.autore, d.anno), d);
  }
}

class LibroDigitale extends Libro {
  constructor(titolo, autore, anno, dimensioneMb) {
    super(titolo, autore, anno);

    this.dimensioneMb = dimensioneMb;
  }

  formato() {
    return `digitale (${this.dimensioneMb} MB)`;
  }
}

const STORAGE_KEY = "libri";

function salvaLibri() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(libri));
}

function caricaLibri() {
  const dati = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

  return dati.map((d) => {
    if (d.dimensioneMb !== undefined) {
      return LibroDigitale.fromJSON(d);
    } else {
      return Libro.fromJSON(d);
    }
  });
}

let libri = caricaLibri();

function renderLibri() {
  const righe = [];

  let libriFiltrati = libri;

  if (filtroAttivo === "letti") {
    libriFiltrati = libri.filter((libro) => libro.letto);
  } else if (filtroAttivo === "da leggere") {
    libriFiltrati = libri.filter((libro) => !libro.letto);
  }

  libriFiltrati.forEach((libro) => {
    const li = document.createElement("li");
    if (libro.letto) {
      li.className =
        "list-group-item d-flex justify-content-between align-items-center border-0 border-start border-4 border-success";
    } else {
      li.className =
        "list-group-item d-flex justify-content-between align-items-center border-0 border-start border-4 border-primary";
    }

    li.dataset.id = libro.id;

    const info = document.createElement("div");

    const titolo = document.createElement("h5");
    titolo.textContent = libro.titolo;

    const formato = document.createElement("span");
    formato.className = "badge bg-secondary";
    formato.textContent = libro.formato();

    const autore = document.createElement("p");
    autore.textContent = `${libro.autore} - ${libro.anno}`;

    info.append(titolo, formato, autore);

    const azioni = document.createElement("div");

    if (libro.letto) {
      azioni.textContent = "✓ Letto";
    } else {
      const bottone = document.createElement("button");

      bottone.textContent = "Segna come letto";
      bottone.className = "btn btn-primary btn-sm";
      bottone.dataset.azione = "leggi";

      azioni.append(bottone);
    }

    const rimuovi = document.createElement("button");

    rimuovi.textContent = "Rimuovi";
    rimuovi.className = "btn btn-danger btn-sm ms-2";
    rimuovi.dataset.azione = "rimuovi";

    azioni.append(rimuovi);

    li.append(info, azioni);

    righe.push(li);
  });

  listaLibri.replaceChildren(...righe);

  numeroLibri.textContent = libri.length;
}

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const dati = Object.fromEntries(new FormData(form));

  let nuovoLibro;

  if (dati.formato === "digitale") {
    nuovoLibro = new LibroDigitale(
      dati.titolo,
      dati.autore,
      Number(dati.anno),
      Number(dati.dimensione),
    );
  } else {
    nuovoLibro = new Libro(dati.titolo, dati.autore, Number(dati.anno));
  }

  libri.push(nuovoLibro);

  salvaLibri();

  renderLibri();

  form.reset();
  campoDigitale.hidden = true;
});

listaLibri.addEventListener("click", function (e) {
  const bottone = e.target.closest("[data-azione]");

  if (!bottone) return;

  const id = bottone.closest("li").dataset.id;

  if (bottone.dataset.azione === "leggi") {
    const libro = libri.find((libro) => libro.id === id);

    if (libro) {
      libro.segnaComeLetto();
    }
  } else if (bottone.dataset.azione === "rimuovi") {
    const indice = libri.findIndex((libro) => libro.id === id);

    libri.splice(indice, 1);
  }

  salvaLibri();
  renderLibri();
});

renderLibri();

svuotaTutto.addEventListener("click", function () {
  libri = [];
  localStorage.removeItem(STORAGE_KEY);
  renderLibri();
});

esporta.addEventListener("click", function () {
  const datiJSON = JSON.stringify(libri, null, 2);

  const nuovaScheda = window.open("", "_blank");

  const contenuto = nuovaScheda.document.createElement("pre");

  contenuto.textContent = datiJSON;

  nuovaScheda.document.body.appendChild(contenuto);
});

filtri.forEach((bottone) => {
  bottone.addEventListener("click", function () {
    filtroAttivo = bottone.textContent.toLowerCase();

    filtri.forEach((btn) => {
      btn.classList.remove("btn-success");
      btn.classList.add("btn-outline-success");
    });

    bottone.classList.remove("btn-outline-success");
    bottone.classList.add("btn-success");

    renderLibri();
  });
});
