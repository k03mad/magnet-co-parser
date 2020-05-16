export default {
    tmdb: {
        cover: 'https://image.tmdb.org/t/p/w300_and_h450_bestv2',
        person: 'https://www.themoviedb.org/person/',
        castCount: 5,
        genresCount: Infinity,
        companiesCount: Infinity,
        countriesCount: Infinity,
    },
    kp: {
        re: /(kinopoisk\.ru(%2F|\/)rating(%2F|\/)(?<id1>\d+)\.gif)|rating\.kinopoisk\.ru(%2F|\/)(?<id2>\d+)\.gif/,
        film: 'https://www.kinopoisk.ru/film/',
        rating: id => `https://rating.kinopoisk.ru/${id}.gif`,
    },
    imdb: {
        re: /imdb\.com(%2F|\/)title(%2F|\/)(?<id>tt\d+)(%2F|\/)/,
        film: 'https://www.imdb.com/title/',
    },
    rutracker: {
        url: 'https://rutracker.org/forum/tracker.php?nm=',
    },
};
