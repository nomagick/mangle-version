import { program } from 'commander';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { detectGitCommitSHA, modifyPackageJsonSYNC } from './lib/version-mangler';

program
    .description('Mangle package.version to [version][+-][build]')
    .option('-v, --version <version>', 'Override package version')
    .option('-b, --build <build>', 'Override build version')
    .option('-m, --mangle <mangle>', 'Override mangled version')
    .option('-p, --path <path>', 'Set package path instead of cwd')
    .option('-t, --type <type>', 'Mangle version type [prerelease|build]', 'prerelease')

    .parse();


const options = program.opts();

const packagePath = resolve(options.path || process.cwd());

async function getBuildNumber() {
    if (options.build) {
        return options.build;
    }

    const envBuildVersion = [
        'OMEGA_BUILD_NUMBER',
        'BUILD_NUMBER',
        'CI_COMMIT_SHA',
        'GIT_COMMIT_SHA'
    ];

    for (const x of envBuildVersion) {
        if (process.env[x]) {

            const v = process.env[x]!.slice(0, 7)

            console.log(`mangle-version: Using build version from ENV[${x}]: ${v}`);

            return v;
        }
    }

    const gitshaShort = (await detectGitCommitSHA(packagePath)).slice(0, 7);

    console.log(`mangle-version: Using git commit hash for build version: ${gitshaShort}`);

    return gitshaShort;
}

function getVersionNumber() {
    if (options.version) {
        return options.version;
    }
    const envBuildVersion = [
        'OMEGA_PACKAGE_VERSION',
        'PACKAGE_VERSION'
    ];

    for (const x of envBuildVersion) {
        if (process.env[x]) {

            console.log(`mangle-version: Using package version from ENV[${x}]: ${process.env[x]}`);
            return process.env[x];
        }
    }

    const filePath = resolve(packagePath, 'package.json');
    const pkg: any = JSON.parse(readFileSync(filePath, 'utf-8'));

    const packageVersion = `${pkg.version}`;

    return packageVersion.replace(/[\+\-]\S+$/, '');
}

async function modifyPackageVersion() {

    const version = options.mangle || `${await getVersionNumber()}${options.type === 'prerelease' ? '-' : '+'}${await getBuildNumber()}`;

    console.log(`mangle-version: Setting package version to: ${version}`);

    modifyPackageJsonSYNC(packagePath, version);
}

modifyPackageVersion();
