export default {
    /* eslint-disable jsdoc/require-jsdoc */
    tmdb: {
        cover: 'https://image.tmdb.org/t/p/w300_and_h450_bestv2',
        person: 'https://www.themoviedb.org/person/',
        castCount: 5,
        genresCount: Infinity,
        companiesCount: Infinity,
        countriesCount: Infinity,
        networksCount: Infinity,
    },
    myshows: {
        url: 'https://myshows.me/view/',
    },
    kp: {
        url: 'https://www.kinopoisk.ru/film/',
        rating: id => `https://rating.kinopoisk.ru/${id}.gif`,
    },
    rutracker: {
        url: 'https://rutracker.org/forum/tracker.php?nm=',
    },
    kinopub: {
        url: 'https://kubik3.site/item/search?query=',
    },
};
