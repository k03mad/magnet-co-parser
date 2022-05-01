import config from '../../common/config.js';

export default {
    search: {
        // rutor.info/search/страница/категория/все слова/сортировка по сидам/
        url: `${config.rutor.url}/search/0/0/300/2/`,
        quality: {
            full: ' 1080p',
            back: ' 720p',
        },
    },

    episodes: /\[(\w?\d.+)]/,
    releaseGroup: /\s.+/,
};
