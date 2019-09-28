export default {
    tmdb: {
        cover: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2',
        url: 'https://www.themoviedb.org/movie/',
        cacheDays: {
            api: 30,
            cover: 30,
        },
        timeout: 20000,
        castCount: 3,
        genresCount: 3,
    },
    kp: {
        re: /kinopoisk.+%2F(\d+)%2F/,
        film: id => `https://www.kinopoisk.ru/film/${id}/`,
        rating: id => `https://rating.kinopoisk.ru/${id}.gif`,
    },
    rutracker: {
        url: 'https://rutracker.org/forum/tracker.php?nm=',
    },
    imdb: {
        url: 'https://www.imdb.com/title/',
    },
};
