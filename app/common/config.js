import appRoot from 'app-root-path';

const RUTOR_DOMAIN = 'rutor.info';
const rutorUrl = `http://${RUTOR_DOMAIN}`;

export default {
    templates: {
        font: `${appRoot}/templates/font.fnt`,
        noposter: `${appRoot}/templates/no-poster.png`,
        folder: `${appRoot}/templates/`,
        list: `${appRoot}/templates/list.html`,
        page: `${appRoot}/templates/page.html`,
    },
    rutor: {
        url: rutorUrl,
        domain: RUTOR_DOMAIN,
        selectors: {
            td: '.gai, .tum',
            magnet: 'a:nth-child(2)',
            link: 'a:nth-child(3)',
        },
        regexp: /(?<date>^\d+ .{3} \d{2}) (?<name>.+) \((?<year>[\d-]+)\) (?<info>.+) (?<size>[\d.]+ [a-z]+) (?<seed>\d+)/i,
        comments: / \d+$/,
        timeout: 20_000,
        tagSplit: ' | ',
    },
    service: {
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
            re: /(kinopoisk\.ru(%2F|\/)rating(%2F|\/)(?<id1>\d+)\.gif)|rating\.kinopoisk\.ru(%2F|\/)(?<id2>\d+)\.gif/,
            film: 'https://www.kinopoisk.ru/film/',
            rating: id => `https://rating.kinopoisk.ru/${id}.gif`,
        },
        imdb: {
            re: /imdb\.com(%2F|\/)title(%2F|\/)(?<id>tt\d+)(%2F|\/)/,
            film: 'https://www.imdb.com/title/',
            person: 'https://www.imdb.com/name/',
        },
        rutracker: {
            url: 'https://rutracker.org/forum/tracker.php?nm=',
        },
        kinopub: {
            url: 'https://kino.pub/item/search?query=',
        },
    },
};
