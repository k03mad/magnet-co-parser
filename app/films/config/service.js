export default {
    tmdb: {
        cover: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2',
        castCount: 3,
        genresCount: 3,
    },
    kp: {
        re: /kinopoisk.+film.*%2F(\d+)%2F/,
        film: 'https://www.kinopoisk.ru/film/',
        rating: id => `https://rating.kinopoisk.ru/${id}.gif`,
    },
    rutracker: {
        url: 'https://rutracker.org/forum/tracker.php?nm=',
    },
};
