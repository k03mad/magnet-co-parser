import {shell} from '@k03mad/util';
import fs from 'node:fs';

import rutorConfig from './app/films/config/rutor.js';
import env from './env.js';

/***/
const writeHosts = async () => {
    const hostsFile = '/etc/hosts';

    const [hosts, ip] = await Promise.all([
        fs.promises.readFile(hostsFile, {encoding: 'utf8'}),
        shell.run(`dig +short ${rutorConfig.domain} @${env.mikrotik.host}`),
    ]);

    const splitted = hosts.split(/\n/);
    const rutorEntry = splitted.findIndex(elem => elem.includes(rutorConfig.domain));

    if (rutorEntry > 0) {
        splitted[rutorEntry] = `${ip} ${rutorConfig.domain}`;
    } else {
        splitted.push(
            '# parser static',
            `${ip} ${rutorConfig.domain}\n`,
        );
    }

    const joined = splitted.join('\n');

    if (hosts !== joined) {
        await shell.run(`sudo chmod -R 777 ${hostsFile}`);
        await fs.promises.writeFile(hostsFile, joined);
    }
};

export default writeHosts;
