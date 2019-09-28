import utils from 'utils-mad';

const currentYear = Number(utils.date.now('YYYY'));
const prevYear = currentYear - 1;

export default {
    search: {
        // rutor.info/search/страница/категория/логическое выражение/сортировка по дате/
        url: (page, cat, log = 300) => `http://rutor.info/search/${page}/${cat}/${log}/0/`,
        query: `${currentYear}|${prevYear} (iTunes|Лицензия| D) -( BDRemux) -( Blu-Ray) -( 3D-Video) -( 60 fps) -( Line) -( HDRezka)`,
        quality: ' 1080p',
        pages: 20,
        // зарубежные фильмы, наши фильмы, телевизор, мультипликация, аниме, науч-поп
        categories: [1, 5, 6, 7, 10, 12],
    },
    selectors: {
        td: '.gai, .tum',
        magnet: 'a:nth-child(2)',
    },

    regexp: /(?<date>^\d{1,2} .{3} \d{2}) (?<name>.+) \((?<year>[\d-]+)\) (?<info>.+) (?<size>\d+\.\d+ GB) (?<seed>\d+)/,
    comments: / \d+$/,

    tagSplit: ' | ',

    timeout: 20000,
    minSeeds: 0,
};
