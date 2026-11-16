const formato = document.getElementById("formato");
const campoDigitale = document.getElementById("campoDigitale");
const listaLibri = document.getElementById("listaLibri");
const numeroLibri = document.getElementById("numeroLibri");
const form = document.getElementById("bookForm");

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









