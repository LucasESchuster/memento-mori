export type Quote = {
  text: string;
  author: string;
};

export const quotes: Quote[] = [
  {
    text: "Não vivas como se tivesses mil anos pela frente. A morte paira sobre ti. Enquanto vives, enquanto podes, torna-te bom.",
    author: "Marco Aurélio",
  },
  {
    text: "Não é que tenhamos pouco tempo, mas que perdemos muito. A vida é suficientemente longa para quem sabe usá-la.",
    author: "Sêneca",
  },
  {
    text: "Começa cada dia dizendo a ti mesmo: hoje encontrarei pessoas ingratas, arrogantes, desonestas. Mas não permitirei que me tirem a paz.",
    author: "Marco Aurélio",
  },
  {
    text: "Lembra-te: não viverás para sempre. Enquanto é dia, cuida de tornar-te bom.",
    author: "Marco Aurélio",
  },
  {
    text: "Todas as coisas são passageiras: quem recorda e quem é recordado.",
    author: "Marco Aurélio",
  },
  {
    text: "Toda a vida é uma jornada até à morte. Viver, Lucílio, é como soldado em guerra.",
    author: "Sêneca",
  },
  {
    text: "Não temas a morte, mas a vida não vivida.",
    author: "Marco Aurélio",
  },
  {
    text: "Lembrar que vou morrer em breve é a ferramenta mais importante que já encontrei para ajudar-me a fazer as grandes escolhas da vida.",
    author: "Steve Jobs",
  },
  {
    text: "Não é possível viver bem sem filosofar, nem filosofar sem viver bem.",
    author: "Epicteto",
  },
  {
    text: "Que tipo de homem quero ser quando a morte me encontrar? Que esteja trabalhando, que esteja em paz, que esteja vivo.",
    author: "Sêneca",
  },
  {
    text: "Pensar na morte é pensar na liberdade. Quem aprende a morrer desaprende a servir.",
    author: "Michel de Montaigne",
  },
  {
    text: "A vida, se bem usada, é longa. Não recebemos uma vida curta, nós a encurtamos.",
    author: "Sêneca",
  },
  {
    text: "Nada nos pertence; só o tempo é nosso.",
    author: "Sêneca",
  },
  {
    text: "Enquanto adiamos viver, a vida passa.",
    author: "Sêneca",
  },
  {
    text: "Aprender a viver leva a vida toda; e, o que mais te surpreenderá, leva a vida toda aprender a morrer.",
    author: "Sêneca",
  },
  {
    text: "Confina-te ao presente.",
    author: "Marco Aurélio",
  },
  {
    text: "A vida de um homem é aquilo que seus pensamentos fazem dela.",
    author: "Marco Aurélio",
  },
  {
    text: "Não são as coisas em si que perturbam os homens, mas os juízos que fazem delas.",
    author: "Epicteto",
  },
  {
    text: "Uma vida não examinada não vale a pena ser vivida.",
    author: "Sócrates",
  },
  {
    text: "Nada é permanente, exceto a mudança.",
    author: "Heráclito",
  },
  {
    text: "Filosofar é aprender a morrer.",
    author: "Cícero",
  },
  {
    text: "A morte não nos diz respeito: enquanto existimos, ela não está; quando ela chega, já não estamos.",
    author: "Epicuro",
  },
];

export function pickRandomQuote(exclude?: Quote): Quote {
  if (quotes.length === 1) return quotes[0];
  let pick = quotes[Math.floor(Math.random() * quotes.length)];
  while (exclude && pick.text === exclude.text) {
    pick = quotes[Math.floor(Math.random() * quotes.length)];
  }
  return pick;
}
