import {date} from '@k03mad/util';

import config from '../../common/config.js';

const currentYear = Number(date.now('YYYY'));
const prevYear = currentYear - 1;

export default {
    search: {
        // rutor.info/search/страница/категория/логическое выражение/сортировка по дате/
        url: (page, cat, log = 300) => `${config.rutor.url}/search/${page}/${cat}/${log}/0/`,
        query: `${currentYear}|${prevYear} 1080p -( Blu-ray) -( BDRemux) -( HDR)`,
        pages: 20,
        categories: [
            // зарубежные
            1,
            // наши
            5,
            // телевизор
            6,
            // мультипликация
            7,
            // аниме
            10,
            // научно-популярные
            12,
            // юмор
            15,
        ],
    },

    dateFormat: 'DD MMM YY',

    // фильмов на одной странице
    pageCovers: Number.POSITIVE_INFINITY,
};
