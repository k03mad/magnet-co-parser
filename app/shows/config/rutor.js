export default {
    search: {
        // rutor.info/search/страница/категория/все слова/сортировка по сидам/
        url: 'http://rutor.info/search/0/0/100/2/',
        quality: {
            full: ' 1080p',
            back: ' 720p',
        },
    },
    selectors: {
        td: '.gai, .tum',
        magnet: 'a:nth-child(2)',
    },

    regexp: /(?<date>^\d{1,2} .{3} \d{2}) (?<name>.+) \((?<year>[\d-]+)\) (?<info>.+) (?<size>\d+\.\d+ GB) (?<seed>\d+)/,
    episodes: /\[(\w?\d.+)]/,
    comments: / \d+$/,

    tagSplit: ' | ',

    timeout: 20000,
};
