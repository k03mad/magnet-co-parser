import {spawn} from 'node:child_process';

import {log} from './app/common/utils.js';

const server = spawn('node --no-deprecation ./node_modules/.bin/http-server', [

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

], {shell: '/usr/bin/zsh'});

server.stdout.on('data', data => {
    log(`stdout: ${data}`);
});

server.stderr.on('data', data => {
    log(`stderr: ${data}`, 'error');
});

server.on('close', code => {
    log(`exit: ${code}`);
});
