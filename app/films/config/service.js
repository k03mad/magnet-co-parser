export default {
    tmdb: {
        cover: 'https://image.tmdb.org/t/p/w300_and_h450_bestv2',
        castCount: 5,
        genresCount: 3,
    },
    kp: {
        re: /kinopoisk.+film.*%2F(?<id>\d+)%2F/,
        film: 'https://www.kinopoisk.ru/film/',
        rating: id => `https://rating.kinopoisk.ru/${id}.gif`,
    },
    imdb: {
        re: /imdb.+title.*%2F(?<id>tt\d+)%2F/,
        film: 'https://www.imdb.com/title/',
    },
    rutracker: {
        url: 'https://rutracker.org/forum/tracker.php?nm=',
    },
};
