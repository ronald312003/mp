export interface FashionHouse {
  name: string;
  since: string;
  origin: string;
  identity: string;
  history: string;
  philosophy: string;
  codes: string[];
  sourceUrl: string;
}

/**
 * Selección editorial de casas presentes en el catálogo. Los datos históricos
 * se apoyan en los archivos corporativos oficiales enlazados en cada entrada.
 */
export const FASHION_HOUSES: FashionHouse[] = [
  {
    name: "Christian Louboutin",
    since: "1991",
    origin: "París, Francia",
    identity: "La suela roja como gesto de deseo",
    history:
      "Christian Louboutin abrió su primera boutique junto a la Galerie Véro-Dodat de París en 1991. La silueta del zapato y la suela escarlata convirtieron su firma en un código reconocible sin necesidad de logotipos.",
    philosophy:
      "El calzado altera la postura, el movimiento y la confianza. Artesanía, teatralidad y proporción se equilibran para que cada par tenga presencia propia.",
    codes: ["Suela roja", "Curva", "Teatralidad"],
    sourceUrl: "https://us.christianlouboutin.com/us_en/our-history"
  },
  {
    name: "Saint Laurent",
    since: "1961",
    origin: "París, Francia",
    identity: "La modernidad vestida de negro",
    history:
      "Yves Saint Laurent y Pierre Bergé fundaron la casa en París. Su primera colección llegó en 1962 y Rive Gauche abrió en 1966 una nueva relación entre alta moda, juventud y prêt-à-porter.",
    philosophy:
      "Precisión parisina con una tensión constante entre lo masculino y lo sensual. La actitud importa tanto como la prenda.",
    codes: ["Sastrería", "Negro", "Rive Gauche"],
    sourceUrl: "https://www.ysl.com/en-my/collections/heritage"
  },
  {
    name: "Ferragamo",
    since: "1927",
    origin: "Florencia, Italia",
    identity: "Ingeniería aplicada al calzado",
    history:
      "Salvatore Ferragamo estableció su compañía en Florencia para estudiar, crear y fabricar calzado. La casa amplió después su lenguaje hacia cuero, seda, prêt-à-porter y accesorios.",
    philosophy:
      "Belleza y comodidad nacen de entender la construcción. Artesanía florentina, proporción y materiales conducen cada diseño.",
    codes: ["Calzado", "Anatomía", "Artesanía"],
    sourceUrl: "https://group.ferragamo.com/en/the-group/group-history"
  },
  {
    name: "Valentino",
    since: "1960",
    origin: "Roma, Italia",
    identity: "Couture de emoción italiana",
    history:
      "Valentino Garavani y Giancarlo Giammetti fundaron formalmente la Maison en Roma. Su presentación de 1962 en Palazzo Pitti impulsó su reconocimiento internacional.",
    philosophy:
      "La maestría del atelier se pone al servicio de una belleza expresiva: color, movimiento y detalle convierten la ropa en presencia.",
    codes: ["Rojo Valentino", "Couture", "Romanticismo"],
    sourceUrl: "https://www.valentino.com/en-ca/v-universe/maison/history"
  },
  {
    name: "Versace",
    since: "1978",
    origin: "Milán, Italia",
    identity: "Clasicismo sin inhibiciones",
    history:
      "Gianni Versace fundó la casa en 1978. Desde Milán construyó un universo que conecta moda, cultura, interiores, fragancias y hospitalidad.",
    philosophy:
      "Libertad y autoexpresión audaz. Los códigos clásicos y la artesanía italiana se llevan con fuerza, sensualidad y contraste.",
    codes: ["Medusa", "Barroco", "Sensualidad"],
    sourceUrl: "https://www.versace.com/us/en/about-us/company-profile.html"
  },
  {
    name: "Maison Margiela",
    since: "1988",
    origin: "París, Francia",
    identity: "Lo oculto se vuelve diseño",
    history:
      "Fundada en París por Martin Margiela sobre ideas inconformistas, la Maison convirtió la deconstrucción, el anonimato y la experimentación artesanal en un lenguaje propio.",
    philosophy:
      "La moda como expresión artística. Costuras, forros, huellas del proceso e imperfecciones revelan cómo está construida cada pieza.",
    codes: ["Cuatro puntadas", "Tabi", "Deconstrucción"],
    sourceUrl: "https://www.maisonmargiela.com/en-us/mm-our-house.html"
  },
  {
    name: "Thom Browne",
    since: "2001",
    origin: "Nueva York, EE. UU.",
    identity: "El uniforme reconsiderado",
    history:
      "Thom Browne comenzó con cinco trajes en una pequeña tienda por cita del West Village. Desde allí llevó su investigación de la sastrería a colecciones completas y presentaciones conceptuales.",
    philosophy:
      "Cuestionar la proporción tradicional sin renunciar al oficio. La disciplina del uniforme se transforma en individualidad.",
    codes: ["Cuatro barras", "Gris", "Proporción"],
    sourceUrl: "https://www.thombrowne.com/pages/about"
  },
  {
    name: "Missoni",
    since: "1953",
    origin: "Sumirago, Italia",
    identity: "Color construido con hilo",
    history:
      "Ottavio y Rosita Missoni fundaron la casa en 1953. La innovación textil y la calidad de sus hilados hicieron de sus tejidos un emblema del Made in Italy.",
    philosophy:
      "Tradición artesanal y experimentación conviven en superficies vivas. El color no decora: estructura el ritmo de la prenda.",
    codes: ["Zigzag", "Punto", "Color"],
    sourceUrl: "https://www.missoni.com/en-gb/missoni-faq.html"
  },
  {
    name: "Sandro",
    since: "1984",
    origin: "París, Francia",
    identity: "Naturalidad parisina",
    history:
      "Evelyne y Didier Chetrite crearon Sandro en Le Sentier. En 2008, Ilan Chetrite abrió el capítulo masculino de una casa familiar ya reconocible por su mirada urbana.",
    philosophy:
      "Elegancia fácil, libre y precisa. Contrastes masculinos y femeninos se equilibran con referencias al arte, la música y las calles de París.",
    codes: ["París", "Contraste", "Líneas limpias"],
    sourceUrl: "https://us.sandro-paris.com/en/sandro-world/maison-sandro/the-story-and-dna-of-sandro/about-sandro-1.html"
  },
  {
    name: "Bally",
    since: "1851",
    origin: "Schönenwerd, Suiza",
    identity: "Arquitectura en cuero",
    history:
      "Carl Franz Bally fundó la casa suiza en 1851. Su origen como negocio familiar evolucionó hacia una firma global construida alrededor del calzado y el trabajo especializado del cuero.",
    philosophy:
      "La calidad habla por sí misma. Función, longevidad, líneas limpias y ejecución artesanal definen objetos pensados para durar.",
    codes: ["Cuero", "Franja Bally", "Funcionalidad"],
    sourceUrl: "https://www.bally.com/en-hk/pages/about-us"
  },
  {
    name: "Dunhill",
    since: "1893",
    origin: "Londres, Reino Unido",
    identity: "Elegancia británica funcional",
    history:
      "Alfred Dunhill heredó el negocio de guarnicionería familiar y lo transformó para la nueva era del automóvil. Esa mentalidad pionera definió una casa dedicada al lujo masculino.",
    philosophy:
      "Un objeto debe funcionar, durar y estar bien resuelto. El detalle y la personalización dan forma a un clasicismo inglés contemporáneo.",
    codes: ["Motorities", "Sastrería", "Utilidad"],
    sourceUrl: "https://www.dunhill.com/es-es/heritage/about-dunhill.html"
  },
  {
    name: "Ralph Lauren",
    since: "1967",
    origin: "Nueva York, EE. UU.",
    identity: "El sueño americano como guardarropa",
    history:
      "Ralph Lauren fundó la compañía en 1967 y desarrolló una visión integral del estilo de vida estadounidense, desde la sastrería y el deporte hasta el hogar y la perfumería.",
    philosophy:
      "Autenticidad y estilo atemporal. Las piezas se conciben para ser usadas, queridas y transmitidas, no para depender de una temporada.",
    codes: ["Polo", "Ivy", "Estilo de vida"],
    sourceUrl: "https://corporate.ralphlauren.com/leadership"
  },
  {
    name: "Dior",
    since: "1946",
    origin: "París, Francia",
    identity: "Tradición convertida en modernidad",
    history:
      "Christian Dior instaló su casa en 30 Avenue Montaigne en 1946. Su primera colección de 1947 presentó las siluetas Corolle y En 8, conocidas después como el New Look.",
    philosophy:
      "Corte, drapeado y bordado preservan el savoir-faire de la couture mientras cada generación reinterpreta sus proporciones.",
    codes: ["New Look", "30 Montaigne", "Couture"],
    sourceUrl: "https://www.dior.com/en_int/fashion/haute-couture"
  },
  {
    name: "Prada",
    since: "1913",
    origin: "Milán, Italia",
    identity: "La inteligencia de lo inesperado",
    history:
      "La historia comenzó con la primera tienda de Mario Prada en la Galleria Vittorio Emanuele II. Décadas después, Miuccia Prada y Patrizio Bertelli impulsaron su expansión internacional.",
    philosophy:
      "Materiales, cultura e ideas cotidianas se observan desde un ángulo poco convencional. La sobriedad convive con gestos que cuestionan el gusto establecido.",
    codes: ["Nylon", "Triángulo", "Contradicción"],
    sourceUrl: "https://www.pradagroup.com/en/group/history.html"
  }
];
