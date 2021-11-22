export default {
    mikrotik: {
        host: process.env.MIKROTIK_HOST,
    },
    isCloud: process.env.IS_CLOUD,
    parser: {
        type: process.env.npm_config_type,
    },
};
