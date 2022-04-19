const RUTOR_DOMAIN = 'rutor.info';
const rutorUrl = `http://${RUTOR_DOMAIN}`;

export default {
    url: rutorUrl,
    domain: RUTOR_DOMAIN,
    search: {
        // rutor.info/search/страница/категория/все слова/сортировка по сидам/
        url: `${rutorUrl}/search/0/0/100/2/`,
        quality: {
            full: ' 1080p|2160p',
            back: ' 720p',
        },
    },
    selectors: {
        td: '.gai, .tum',
        magnet: 'a:nth-child(2)',
    },

    regexp: /(?<date>^\d+ .{3} \d{2}) (?<name>.+) \((?<year>[\d-]+)\) (?<info>.+) (?<size>[\d.]+ [a-z]+) (?<seed>\d+)/i,
    episodes: /\[(\w?\d.+)]/,
    comments: / \d+$/,
    releaseGroup: /\s.+/,

    timeout: 20_000,
    concurrency: 5,
    tagSplit: ' | ',
};
