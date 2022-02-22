import {spawn} from 'node:child_process';

const server = spawn('./node_modules/.bin/http-server', [

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
    console.log(`stdout: ${data}`);
});

server.stderr.on('data', data => {
    console.error(`stderr: ${data}`);
});

server.on('close', code => {
    console.log(`server process exited with code ${code}`);
});
