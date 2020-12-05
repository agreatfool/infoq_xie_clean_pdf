#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const LibFs = require("fs");
const LibPath = require("path");
const LibOs = require("os");
const program = require("commander");
const puppeteer = require("puppeteer");
const isUrl = require('is-url');
const pkg = require('../package.json');
const DEFAULT_OUTPUT_DIR = LibPath.join(process.env.HOME, 'Downloads');
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/63.0.3239.84 Chrome/63.0.3239.84 Safari/537.36';
const REMOVE_LIST = [
    '.layout-header-wrap',
    '.article-fixed-wrap',
    '.layout-footer-wrap',
    '.widget-operation-bottom',
    '.article-comment-block',
];
program.version(pkg.version)
    .description('infoq_xie_clean_pdf: generate clean pdf from xie.infoq.cn')
    .option('-s, --source <string>', 'download target, url')
    .option('-o, --output_dir <dir>', 'output directory, default is "~/Downloads/"')
    .option('-u, --user_agent <string>', 'self defined usage agent, to avoid anti-crawler, just leave it if all things worked, there is a default one in codes already')
    .parse(process.argv);
const ARGS_SOURCE = program.source;
let ARGS_OUTPUT_DIR = program.outputDir;
const ARGS_USER_AGENT = program.userAgent === undefined ? DEFAULT_USER_AGENT : program.userAgent;
class Pdf {
    async run() {
        console.log('Process starting ...');
        await this._validate();
        await this._process();
    }
    async _validate() {
        console.log('Process validating ...');
        // source validation
        if (!ARGS_SOURCE || !isUrl(ARGS_SOURCE)) {
            console.log('Option "source" required & has to be url, please provide correct -s option!');
            process.exit(1);
        }
        // output validation
        if (ARGS_OUTPUT_DIR === undefined && LibOs.platform() === 'darwin') {
            ARGS_OUTPUT_DIR = DEFAULT_OUTPUT_DIR;
        }
        else if (ARGS_OUTPUT_DIR === undefined) {
            console.log('Option "output dir" required, please provide -o option!');
            process.exit(1);
        }
        if (!LibFs.existsSync(ARGS_OUTPUT_DIR) || !LibFs.statSync(ARGS_OUTPUT_DIR).isDirectory()) {
            console.log('Output has to be a directory!');
            process.exit(1);
        }
        console.log(`Output dir: ${ARGS_OUTPUT_DIR}`);
        process.chdir(ARGS_OUTPUT_DIR);
    }
    async _process() {
        const browser = await puppeteer.launch({ headless: true, defaultViewport: { width: 1920, height: 1080 } });
        const page = await browser.newPage();
        await Promise.all([
            page.setUserAgent(ARGS_USER_AGENT),
            page.setJavaScriptEnabled(true),
            page.setViewport({ width: 1920, height: 1080 }),
        ]);
        await page.goto(ARGS_SOURCE, { waitUntil: 'networkidle0' });
        const title = await page.title();
        for (const eleClass of REMOVE_LIST) {
            await page.evaluate((eleClass) => {
                const elements = document.querySelectorAll(eleClass);
                for (let i = 0; i < elements.length; i++) {
                    elements[i].parentNode.removeChild(elements[i]);
                }
            }, eleClass);
        }
        console.log(title);
        try {
            await page.pdf({
                path: `${title}.pdf`,
                format: 'A4',
            });
        }
        catch (err) {
            throw err;
        }
        finally {
            await browser.close();
        }
    }
}
new Pdf().run().then(_ => _).catch(_ => console.log(_));
process.on('uncaughtException', (error) => {
    console.error(`Process on uncaughtException error = ${error.stack}`);
    process.exit(1);
});
process.on('unhandledRejection', (error) => {
    console.error(`Process on unhandledRejection error = ${error.stack}`);
    process.exit(1);
});
//# sourceMappingURL=index.js.map