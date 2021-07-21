import env from './env.js';
import fs from 'node:fs';
import rutorConfig from './app/films/config/rutor.js';
import utils from '@k03mad/utils';

/***/
const writeHosts = async () => {
    const hostsFile = '/etc/hosts';

    const [hosts, ip] = await Promise.all([
        fs.promises.readFile(hostsFile, {encoding: 'utf-8'}),
        utils.shell.run(`dig +short ${rutorConfig.domain} @${env.mikrotik.host}`),
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
        await fs.promises.writeFile(hostsFile, joined);
    }
};

export default writeHosts;
