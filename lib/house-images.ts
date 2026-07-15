export interface HouseImage {
  imageUrl: string;
  imageAlt: string;
  credit: string;
  creditUrl: string;
}

/** Fotografías de boutiques, sedes o direcciones históricas; nunca productos. */
export const HOUSE_IMAGES: Record<string, HouseImage> = {
  "Saint Laurent": {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Saint_Laurent_Paris_-_Store_%2851395501701%29.jpg/1280px-Saint_Laurent_Paris_-_Store_%2851395501701%29.jpg",
    imageAlt: "Boutique de Saint Laurent",
    credit: "ajay_suresh · CC BY 2.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Saint_Laurent_Paris_-_Store_(51395501701).jpg"
  },
  Ferragamo: {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Palazzo_Spini_Feroni.jpg/1280px-Palazzo_Spini_Feroni.jpg",
    imageAlt: "Palazzo Spini Feroni, sede histórica de Ferragamo en Florencia",
    credit: "John Samuel · CC BY-SA 4.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Palazzo_Spini_Feroni.jpg"
  },
  Valentino: {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Palazzo_Gabrielli-Mignanelli_in_Rom_2018.jpg/1280px-Palazzo_Gabrielli-Mignanelli_in_Rom_2018.jpg",
    imageAlt: "Palazzo Mignanelli, sede creativa de Valentino en Roma",
    credit: "Olaf Meister · CC BY-SA 4.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Palazzo_Gabrielli-Mignanelli_in_Rom_2018.jpg"
  },
  Versace: {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Atelier_Versace_Store_Plate_in_Milan.JPG/1280px-Atelier_Versace_Store_Plate_in_Milan.JPG",
    imageAlt: "Atelier Versace en Milán",
    credit: "Oamsgo · CC BY-SA 4.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Atelier_Versace_Store_Plate_in_Milan.JPG"
  },
  "Maison Margiela": {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Margiela_Paris.jpg/1280px-Margiela_Paris.jpg",
    imageAlt: "Maison Margiela en París",
    credit: "Max Ronnersjö · CC BY-SA 3.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Margiela_Paris.jpg"
  },
  "Thom Browne": {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/HK_CH_%E4%B8%AD%E7%92%B0_Central_%E5%9C%8B%E9%9A%9B%E9%87%91%E8%9E%8D%E4%B8%AD%E5%BF%83%E5%95%86%E5%A0%B4_IFC_mall_%E9%80%A3%E5%8D%A1%E4%BD%9B_Lane_Crawford_Store_October_2022_Px3_88.jpg/1280px-HK_CH_%E4%B8%AD%E7%92%B0_Central_%E5%9C%8B%E9%9A%9B%E9%87%91%E8%9E%8D%E4%B8%AD%E5%BF%83%E5%95%86%E5%A0%B4_IFC_mall_%E9%80%A3%E5%8D%A1%E4%BD%9B_Lane_Crawford_Store_October_2022_Px3_88.jpg",
    imageAlt: "Presentación de Thom Browne en Lane Crawford",
    credit: "Limguang Diamlimma · CC BY-SA 4.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:HK_CH_%E4%B8%AD%E7%92%B0_Central_%E5%9C%8B%E9%9A%9B%E9%87%91%E8%9E%8D%E4%B8%AD%E5%BF%83%E5%95%86%E5%A0%B4_IFC_mall_%E9%80%A3%E5%8D%A1%E4%BD%9B_Lane_Crawford_Store_October_2022_Px3_88.jpg"
  },
  Missoni: {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Mulan_by_Missoni_%40_Harrods_London_%288286835729%29.jpg/1280px-Mulan_by_Missoni_%40_Harrods_London_%288286835729%29.jpg",
    imageAlt: "Instalación de Missoni en Harrods, Londres",
    credit: "Loco Steve · CC BY-SA 2.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Mulan_by_Missoni_@_Harrods_London_(8286835729).jpg"
  },
  Sandro: {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/HK_STD_%E6%B2%99%E7%94%B0_Sha_Tin_%E6%96%B0%E5%9F%8E%E5%B8%82%E5%BB%A3_New_Town_Plaza_mall_shop_Sandro_Store_September_2022_Px3_11.jpg/1280px-HK_STD_%E6%B2%99%E7%94%B0_Sha_Tin_%E6%96%B0%E5%9F%8E%E5%B8%82%E5%BB%A3_New_Town_Plaza_mall_shop_Sandro_Store_September_2022_Px3_11.jpg",
    imageAlt: "Boutique de Sandro",
    credit: "Yanghime TADIWODOA BBAEW · CC BY-SA 4.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:HK_STD_%E6%B2%99%E7%94%B0_Sha_Tin_%E6%96%B0%E5%9F%8E%E5%B8%82%E5%BB%A3_New_Town_Plaza_mall_shop_Sandro_Store_September_2022_Px3_11.jpg"
  },
  Bally: {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Bally_store%2C_Paris.jpg/1280px-Bally_store%2C_Paris.jpg",
    imageAlt: "Boutique Bally en París",
    credit: "Toxophilus · CC BY-SA 4.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Bally_store,_Paris.jpg"
  },
  Dunhill: {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Bourdon_House%2C_The_London_%27Home%27_of_Alfred_Dunhill.jpg/1280px-Bourdon_House%2C_The_London_%27Home%27_of_Alfred_Dunhill.jpg",
    imageAlt: "Bourdon House, casa de Alfred Dunhill en Londres",
    credit: "Jwill-jnr · CC BY-SA 3.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Bourdon_House,_The_London_%27Home%27_of_Alfred_Dunhill.jpg"
  },
  "Ralph Lauren": {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Rhinelander_Mansion.JPG/1280px-Rhinelander_Mansion.JPG",
    imageAlt: "Rhinelander Mansion, flagship de Ralph Lauren en Nueva York",
    credit: "Wikimedia Commons · CC BY-SA 3.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Rhinelander_Mansion.JPG"
  },
  Dior: {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Christian_Dior%2C_30_Avenue_Montaigne%2C_Paris_2016.jpg/1280px-Christian_Dior%2C_30_Avenue_Montaigne%2C_Paris_2016.jpg",
    imageAlt: "30 Avenue Montaigne, casa histórica de Dior en París",
    credit: "Frédéric BISSON · CC BY 2.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Christian_Dior,_30_Avenue_Montaigne,_Paris_2016.jpg"
  },
  Prada: {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Galleria_Vittorio_Emanuele_Interno.jpg/1280px-Galleria_Vittorio_Emanuele_Interno.jpg",
    imageAlt: "Galleria Vittorio Emanuele II, hogar de la primera boutique Prada",
    credit: "Maurizio Moro5153 · CC BY-SA 4.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Galleria_Vittorio_Emanuele_Interno.jpg"
  },
  "Christian Louboutin": {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Store_of_Christian_Louboutin%2C_by_Phillip_Pessar.jpg/1280px-Store_of_Christian_Louboutin%2C_by_Phillip_Pessar.jpg",
    imageAlt: "Boutique de Christian Louboutin",
    credit: "Phillip Pessar · CC BY 2.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Store_of_Christian_Louboutin,_by_Phillip_Pessar.jpg"
  }
};
