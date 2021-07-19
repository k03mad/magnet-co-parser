import utils from '@k03mad/utils';

const currentYear = Number(utils.date.now('YYYY'));
const prevYear = currentYear - 1;

const RUTOR_DOMAIN = 'rutor.info';
const rutorUrl = `http://${RUTOR_DOMAIN}`;

export default {
    /* eslint-disable jsdoc/require-jsdoc */
    url: rutorUrl,
    domain: RUTOR_DOMAIN,
    search: {
        // rutor.info/search/страница/категория/логическое выражение/сортировка по дате/
        url: (page, cat, log = 300) => `${rutorUrl}/search/${page}/${cat}/${log}/0/`,
        queries: {
            default: [
                `${currentYear}|${prevYear}`,
                '(iTunes|Лицензия|Пифагор|Невафильм| D)',
                '-( BDRemux)',
                '-( Blu-Ray)',
                '-( 3D-Video)',
                '-( 60 fps)',
                '-( Line)',
                '-( HDRezka)',
            ].join(' '),
            rus: [
                `${currentYear}|${prevYear}`,
                '-( BDRemux)',
                '-( Blu-Ray)',
                '-( 3D-Video)',
                '-( 60 fps)',
                '-( Line)',
            ].join(' '),
        },
        quality: ' 1080p',
        pages: 3,
        categories: [1, 5, 6, 7, 10, 12],
    },
    selectors: {
        td: '.gai, .tum',
        magnet: 'a:nth-child(2)',
        link: 'a:nth-child(3)',
    },

    dateFormat: 'DD MMM YY',
    regexp: /(?<date>^\d+ .{3} \d{2}) (?<name>.+) \((?<year>[\d-]+)\) (?<info>.+) (?<size>[\d.]+ [a-z]+) (?<seed>\d+)/i,
    comments: / \d+$/,

    tagSplit: ' | ',

    timeout: 20_000,
    filmsCount: Number.POSITIVE_INFINITY,
    concurrency: 5,
    pageCovers: 42,
};
