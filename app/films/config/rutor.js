import {date} from '@k03mad/util';

import config from '../../common/config.js';

const currentYear = Number(date.now('YYYY'));
const prevYear = currentYear - 1;

export default {
    search: {
        // rutor.info/search/страница/категория/логическое выражение/сортировка по дате/
        url: (page, cat, log = 300) => `${config.rutor.url}/search/${page}/${cat}/${log}/0/`,
        query: `${currentYear}|${prevYear} 1080p|2160p`,
        pages: 1,
        categories: [1, 5, 6, 7, 10, 12],
    },

    dateFormat: 'DD MMM YY',

    pageCovers: Number.POSITIVE_INFINITY,
    filmsPerCat: Number.POSITIVE_INFINITY,
    filmsSliceCount: Number.POSITIVE_INFINITY,
};
