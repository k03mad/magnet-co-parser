export default {
    /* eslint-disable jsdoc/require-jsdoc */
    tmdb: {
        cover: 'https://image.tmdb.org/t/p/w300_and_h450_bestv2',
        person: 'https://www.themoviedb.org/person/',
        castCount: 5,
        genresCount: Number.POSITIVE_INFINITY,
        companiesCount: Number.POSITIVE_INFINITY,
        countriesCount: Number.POSITIVE_INFINITY,
        networksCount: Number.POSITIVE_INFINITY,
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
        url: 'https://kino.pub/item/search?query=',
    },
};
