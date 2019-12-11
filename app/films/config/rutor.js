import utils from 'utils-mad';

const currentYear = Number(utils.date.now('YYYY'));
const prevYear = currentYear - 1;

const RUTOR_DOMAIN = 'rutor.info';
const rutorUrl = `http://${RUTOR_DOMAIN}`;

export default {
    url: rutorUrl,
    domain: RUTOR_DOMAIN,
    search: {
        // rutor.info/search/страница/категория/логическое выражение/сортировка по дате/
        url: (page, cat, log = 300) => `${rutorUrl}/search/${page}/${cat}/${log}/0/`,
        query: [
            `${currentYear}|${prevYear}`,
            '(iTunes|Лицензия| D)',
            '-( BDRemux)',
            '-( Blu-Ray)',
            '-( 3D-Video)',
            '-( 60 fps)',
            '-( Line)',
            '-( HDRezka)',
        ].join(' '),
        quality: ' 1080p',
        pages: 20,
        // зарубежные фильмы, наши фильмы, мультипликация
        categories: [1, 5, 7],
    },
    selectors: {
        td: '.gai, .tum',
        magnet: 'a:nth-child(2)',
        link: 'a:nth-child(3)',
    },

    regexp: /(?<date>^\d{1,2} .{3} \d{2}) (?<name>.+) \((?<year>[\d-]+)\) (?<info>.+) (?<size>\d+\.\d+ GB) (?<seed>\d+)/,
    comments: / \d+$/,

    tagSplit: ' | ',

    timeout: 20000,
    filmsCount: Infinity,
    pageCovers: 40,
};