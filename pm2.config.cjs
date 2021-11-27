module.exports = {
    apps: [
        {
            name: 'magnet',
            script: './node_modules/.bin/http-server',
            node_args: '--no-deprecation',

            args: [

                './www',
                '--port 7009',

                '-c-1',
                '--cors',
                '--silent',

                `--username ${process.env.MAGNET_USERNAME}`,
                `--password ${process.env.MAGNET_PASSWORD}`,

                '--ssl',
                `--cert ${process.env.CERT_PATH}/${process.env.CLOUD_DOMAIN}/cert.pem`,
                `--key ${process.env.CERT_PATH}/${process.env.CLOUD_DOMAIN}/privkey.pem`,
                `--ca ${process.env.CERT_PATH}/${process.env.CLOUD_DOMAIN}/fullchain.pem`,

            ].join(' '),
        },
    ],
};
