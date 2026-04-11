export type Language = "lin" | "kon" | "sag";

export const LANG_META: Record<Language, { name: string; flag: string }> = {
  lin: { name: "Lingala", flag: "🇨🇩" },
  kon: { name: "Kikongo", flag: "🇦🇴" },
  sag: { name: "Sango", flag: "🇨🇫" },
};

export interface LearnItem {
  id: string;
  french: string;
  emoji: string;
  translations: Record<Language, string>;
}

export const ALPHABET: LearnItem[] = [
  { id: "a", french: "A", emoji: "🅰️", translations: { lin: "A", kon: "A", sag: "A" } },
  { id: "b", french: "B", emoji: "🅱️", translations: { lin: "Be", kon: "Be", sag: "Be" } },
  { id: "c", french: "C", emoji: "©️", translations: { lin: "Ce", kon: "Ce", sag: "Se" } },
  { id: "d", french: "D", emoji: "🇩", translations: { lin: "De", kon: "De", sag: "De" } },
  { id: "e", french: "E", emoji: "📧", translations: { lin: "E", kon: "E", sag: "E" } },
  { id: "f", french: "F", emoji: "🎏", translations: { lin: "Ef", kon: "Ef", sag: "Ef" } },
  { id: "g", french: "G", emoji: "🎸", translations: { lin: "Ge", kon: "Ge", sag: "Ge" } },
  { id: "h", french: "H", emoji: "♓", translations: { lin: "Ash", kon: "Ash", sag: "Ha" } },
  { id: "i", french: "I", emoji: "ℹ️", translations: { lin: "I", kon: "I", sag: "I" } },
  { id: "j", french: "J", emoji: "🎷", translations: { lin: "Ji", kon: "Ji", sag: "Ji" } },
  { id: "k", french: "K", emoji: "🔑", translations: { lin: "Ka", kon: "Ka", sag: "Ka" } },
  { id: "l", french: "L", emoji: "🦁", translations: { lin: "El", kon: "El", sag: "El" } },
  { id: "m", french: "M", emoji: "Ⓜ️", translations: { lin: "Em", kon: "Em", sag: "Em" } },
  { id: "n", french: "N", emoji: "🎵", translations: { lin: "En", kon: "En", sag: "En" } },
  { id: "o", french: "O", emoji: "⭕", translations: { lin: "O", kon: "O", sag: "O" } },
  { id: "p", french: "P", emoji: "🅿️", translations: { lin: "Pe", kon: "Pe", sag: "Pe" } },
  { id: "q", french: "Q", emoji: "❓", translations: { lin: "Ku", kon: "Ku", sag: "Ku" } },
  { id: "r", french: "R", emoji: "®️", translations: { lin: "Er", kon: "Er", sag: "Er" } },
  { id: "s", french: "S", emoji: "💲", translations: { lin: "Es", kon: "Es", sag: "Es" } },
  { id: "t", french: "T", emoji: "🌮", translations: { lin: "Te", kon: "Te", sag: "Te" } },
  { id: "u", french: "U", emoji: "⛎", translations: { lin: "U", kon: "U", sag: "U" } },
  { id: "v", french: "V", emoji: "✌️", translations: { lin: "Ve", kon: "Ve", sag: "Ve" } },
  { id: "w", french: "W", emoji: "〰️", translations: { lin: "Wa", kon: "Wa", sag: "Wa" } },
  { id: "x", french: "X", emoji: "❌", translations: { lin: "Iks", kon: "Iks", sag: "Iks" } },
  { id: "y", french: "Y", emoji: "💴", translations: { lin: "Ya", kon: "Ya", sag: "Ya" } },
  { id: "z", french: "Z", emoji: "💤", translations: { lin: "Ze", kon: "Ze", sag: "Ze" } },
];

export const NUMBERS: LearnItem[] = [
  { id: "1", french: "1 — Un", emoji: "1️⃣", translations: { lin: "Moko", kon: "Mosi", sag: "Ôko" } },
  { id: "2", french: "2 — Deux", emoji: "2️⃣", translations: { lin: "Mibale", kon: "Zôle", sag: "Ûse" } },
  { id: "3", french: "3 — Trois", emoji: "3️⃣", translations: { lin: "Misato", kon: "Tatu", sag: "Otâ" } },
  { id: "4", french: "4 — Quatre", emoji: "4️⃣", translations: { lin: "Minei", kon: "Ya", sag: "Ûsïö" } },
  { id: "5", french: "5 — Cinq", emoji: "5️⃣", translations: { lin: "Mitano", kon: "Tanu", sag: "Oку" } },
  { id: "6", french: "6 — Six", emoji: "6️⃣", translations: { lin: "Motoba", kon: "Sambanu", sag: "Ömëné" } },
  { id: "7", french: "7 — Sept", emoji: "7️⃣", translations: { lin: "Nsambo", kon: "Nsambwadi", sag: "Mbïrïmbïrï" } },
  { id: "8", french: "8 — Huit", emoji: "8️⃣", translations: { lin: "Mwambe", kon: "Nana", sag: "Mängbö" } },
  { id: "9", french: "9 — Neuf", emoji: "9️⃣", translations: { lin: "Libwa", kon: "Vwa", sag: "Gomnângbö" } },
  { id: "10", french: "10 — Dix", emoji: "🔟", translations: { lin: "Zomi", kon: "Kumi", sag: "Balë" } },
  { id: "11", french: "11 — Onze", emoji: "1️⃣1️⃣", translations: { lin: "Zomi na moko", kon: "Kumi ye mosi", sag: "Balë na ôko" } },
  { id: "12", french: "12 — Douze", emoji: "1️⃣2️⃣", translations: { lin: "Zomi na mibale", kon: "Kumi ye zôle", sag: "Balë na ûse" } },
  { id: "13", french: "13 — Treize", emoji: "1️⃣3️⃣", translations: { lin: "Zomi na misato", kon: "Kumi ye tatu", sag: "Balë na otâ" } },
  { id: "14", french: "14 — Quatorze", emoji: "1️⃣4️⃣", translations: { lin: "Zomi na minei", kon: "Kumi ye ya", sag: "Balë na ûsïö" } },
  { id: "15", french: "15 — Quinze", emoji: "1️⃣5️⃣", translations: { lin: "Zomi na mitano", kon: "Kumi ye tanu", sag: "Balë na oку" } },
  { id: "16", french: "16 — Seize", emoji: "1️⃣6️⃣", translations: { lin: "Zomi na motoba", kon: "Kumi ye sambanu", sag: "Balë na ömëné" } },
  { id: "17", french: "17 — Dix-sept", emoji: "1️⃣7️⃣", translations: { lin: "Zomi na nsambo", kon: "Kumi ye nsambwadi", sag: "Balë na mbïrïmbïrï" } },
  { id: "18", french: "18 — Dix-huit", emoji: "1️⃣8️⃣", translations: { lin: "Zomi na mwambe", kon: "Kumi ye nana", sag: "Balë na mängbö" } },
  { id: "19", french: "19 — Dix-neuf", emoji: "1️⃣9️⃣", translations: { lin: "Zomi na libwa", kon: "Kumi ye vwa", sag: "Balë na gomnângbö" } },
  { id: "20", french: "20 — Vingt", emoji: "2️⃣0️⃣", translations: { lin: "Tuku mibale", kon: "Makumole", sag: "Balë-ûse" } },
];

export const ANIMALS: LearnItem[] = [
  { id: "lion", french: "Lion", emoji: "🦁", translations: { lin: "Nkɔsi", kon: "Nkosi", sag: "Gbâya" } },
  { id: "elephant", french: "Éléphant", emoji: "🐘", translations: { lin: "Nzoku", kon: "Nzau", sag: "Doli" } },
  { id: "crocodile", french: "Crocodile", emoji: "🐊", translations: { lin: "Ngando", kon: "Ngandu", sag: "Ngundâ" } },
  { id: "monkey", french: "Singe", emoji: "🐒", translations: { lin: "Koɛndɛ", kon: "Makaku", sag: "Gɔɔ" } },
  { id: "snake", french: "Serpent", emoji: "🐍", translations: { lin: "Nyoka", kon: "Nioka", sag: "Sö" } },
  { id: "fish", french: "Poisson", emoji: "🐟", translations: { lin: "Mbisi", kon: "Mbizi", sag: "Sùsu" } },
  { id: "chicken", french: "Poulet", emoji: "🐔", translations: { lin: "Nsoso", kon: "Nsusu", sag: "Kôndô" } },
  { id: "goat", french: "Chèvre", emoji: "🐐", translations: { lin: "Ntaba", kon: "Ntaba", sag: "Ngàsà" } },
  { id: "dog", french: "Chien", emoji: "🐕", translations: { lin: "Mbwa", kon: "Mbwa", sag: "Mà" } },
  { id: "cat", french: "Chat", emoji: "🐱", translations: { lin: "Nyau", kon: "Pusi", sag: "Mìnà" } },
  { id: "cow", french: "Vache", emoji: "🐄", translations: { lin: "Ngɔmbɛ", kon: "Ngombe", sag: "Ngɔ̀mbè" } },
  { id: "bird", french: "Oiseau", emoji: "🐦", translations: { lin: "Ndɛkɛ", kon: "Nuni", sag: "Nzɔ̀ni" } },
  { id: "turtle", french: "Tortue", emoji: "🐢", translations: { lin: "Kúlu", kon: "Kulu", sag: "Kûrû" } },
  { id: "frog", french: "Grenouille", emoji: "🐸", translations: { lin: "Ligandaliganda", kon: "Kinkela", sag: "Gùrùgùrù" } },
  { id: "butterfly", french: "Papillon", emoji: "🦋", translations: { lin: "Kipépé", kon: "Kipepele", sag: "Pöpölïngö" } },
  { id: "ant", french: "Fourmi", emoji: "🐜", translations: { lin: "Nkúnda", kon: "Mbinzi", sag: "Nzàrà" } },
];

export const BIRDS: LearnItem[] = [
  { id: "parrot", french: "Perroquet", emoji: "🦜", translations: { lin: "Nkúsu", kon: "Nkusu", sag: "Nkàkö" } },
  { id: "eagle", french: "Aigle", emoji: "🦅", translations: { lin: "Mpongo", kon: "Mpungu", sag: "Ngbängä" } },
  { id: "owl", french: "Hibou", emoji: "🦉", translations: { lin: "Esulungutu", kon: "Dikutu", sag: "Kùkùrùkù" } },
  { id: "pigeon", french: "Pigeon", emoji: "🕊️", translations: { lin: "Pijon", kon: "Ebenga", sag: "Àdùbà" } },
  { id: "duck", french: "Canard", emoji: "🦆", translations: { lin: "Libata", kon: "Libata", sag: "Kànàrà" } },
  { id: "rooster", french: "Coq", emoji: "🐓", translations: { lin: "Nsoso ya mobali", kon: "Nsusu ya bakala", sag: "Kôndô-kôlï" } },
];

export const GREETINGS: LearnItem[] = [
  { id: "hello", french: "Bonjour", emoji: "👋", translations: { lin: "Mbote", kon: "Mbote", sag: "Bala mo" } },
  { id: "goodbye", french: "Au revoir", emoji: "🤝", translations: { lin: "Tokomonana", kon: "Twabonana", sag: "Singîla" } },
  { id: "thanks", french: "Merci", emoji: "🙏", translations: { lin: "Matondo", kon: "Ntondele", sag: "Singîla mingi" } },
  { id: "please", french: "S'il vous plaît", emoji: "🫶", translations: { lin: "Nabondeli yo", kon: "Nabondele", sag: "Mbï yeke gï mo" } },
  { id: "yes", french: "Oui", emoji: "✅", translations: { lin: "Iyo", kon: "Inga", sag: "Iin" } },
  { id: "no", french: "Non", emoji: "❌", translations: { lin: "Te", kon: "Ve", sag: "En-en" } },
  { id: "howru", french: "Comment vas-tu ?", emoji: "😊", translations: { lin: "Ozali malamu?", kon: "Bwe beno?", sag: "Mo yeke nzönî?" } },
  { id: "imfine", french: "Je vais bien", emoji: "💪", translations: { lin: "Nazali malamu", kon: "Mono mbi mbote", sag: "Mbï yeke nzönî" } },
  { id: "whatname", french: "Comment t'appelles-tu ?", emoji: "🏷️", translations: { lin: "Kombo na yo nani?", kon: "Nkumbu na nge nani?", sag: "Iri tî mo nye?" } },
  { id: "myname", french: "Je m'appelle...", emoji: "📛", translations: { lin: "Kombo na ngai...", kon: "Nkumbu na mono...", sag: "Iri tî mbï..." } },
];

export const COLORS: LearnItem[] = [
  { id: "red", french: "Rouge", emoji: "🔴", translations: { lin: "Motane", kon: "Mbwaki", sag: "Vùlû" } },
  { id: "blue", french: "Bleu", emoji: "🔵", translations: { lin: "Bule", kon: "Bule", sag: "Blë" } },
  { id: "green", french: "Vert", emoji: "🟢", translations: { lin: "Verdi", kon: "Verdi", sag: "Vêrë" } },
  { id: "yellow", french: "Jaune", emoji: "🟡", translations: { lin: "Mwindo", kon: "Mwindo", sag: "Vùndû" } },
  { id: "white", french: "Blanc", emoji: "⚪", translations: { lin: "Mpɛmbɛ", kon: "Mpembe", sag: "Vùkö" } },
  { id: "black", french: "Noir", emoji: "⚫", translations: { lin: "Moindo", kon: "Ndombe", sag: "Vùlù" } },
];

export type Category = {
  id: string;
  label: string;
  emoji: string;
  description: string;
  items: LearnItem[];
};

export const CATEGORIES: Category[] = [
  { id: "alphabet", label: "Alphabet", emoji: "🔤", description: "Les lettres de A à Z", items: ALPHABET },
  { id: "numbers", label: "Nombres", emoji: "🔢", description: "Compter de 1 à 20", items: NUMBERS },
  { id: "animals", label: "Animaux", emoji: "🦁", description: "Les animaux d'Afrique", items: ANIMALS },
  { id: "birds", label: "Oiseaux", emoji: "🦜", description: "Les oiseaux", items: BIRDS },
  { id: "greetings", label: "Salutations", emoji: "👋", description: "Dire bonjour, merci…", items: GREETINGS },
  { id: "colors", label: "Couleurs", emoji: "🎨", description: "Les couleurs", items: COLORS },
];
