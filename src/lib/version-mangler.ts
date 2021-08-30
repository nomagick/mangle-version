import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import simpleGit from 'simple-git/promise';

export async function detectGitCommitSHA(dir: string) {
    const git = simpleGit(dir);

    const sha = await git.revparse(['--verify', 'HEAD']);

    return sha;
}


export function modifyPackageJsonSYNC(
    dir: string,
    version: string
) {
    const filePath = resolve(dir, 'package.json');
    const pkg: any = JSON.parse(readFileSync(filePath, 'utf-8'));

    pkg.version = version;

    writeFileSync(filePath, JSON.stringify(pkg, undefined, '    ') + '\n');
}
