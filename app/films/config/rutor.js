import {date} from '@k03mad/util';

const currentYear = Number(date.now('YYYY'));
const prevYear = currentYear - 1;

const RUTOR_DOMAIN = 'rutor.info';
const rutorUrl = `http://${RUTOR_DOMAIN}`;

export default {
    url: rutorUrl,
    domain: RUTOR_DOMAIN,
    search: {
        // rutor.info/search/страница/категория/логическое выражение/сортировка по дате/
        url: (page, cat, log = 300) => `${rutorUrl}/search/${page}/${cat}/${log}/0/`,
        query: `${currentYear}|${prevYear} 1080p|2160p`,
        pages: 1,
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
    concurrency: 5,
    pageCovers: Number.POSITIVE_INFINITY,
    filmsPerCat: Number.POSITIVE_INFINITY,
    filmsSliceCount: Number.POSITIVE_INFINITY,
};
