"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
const index_1 = __importDefault(require("./index"));
// import * as types from './types'
// import { Puppeteer } from './puppeteer-mods'
const puppeteer_extra_1 = require("puppeteer-extra");
const PUPPETEER_ARGS = ['--no-sandbox', '--disable-setuid-sandbox'];
(0, ava_1.default)('will detect reCAPTCHAs', async (t) => {
    const puppeteer = (0, puppeteer_extra_1.addExtra)(require('puppeteer'));
    const recaptchaPlugin = (0, index_1.default)();
    puppeteer.use(recaptchaPlugin);
    const browser = await puppeteer.launch({
        args: PUPPETEER_ARGS,
        headless: true
    });
    const page = await browser.newPage();
    const url = 'https://www.google.com/recaptcha/api2/demo';
    await page.goto(url, { waitUntil: 'networkidle0' });
    const { captchas, error } = await page.findRecaptchas();
    t.is(error, null);
    t.is(captchas.length, 1);
    const c = captchas[0];
    t.is(c._vendor, 'recaptcha');
    t.is(c.callback, 'onSuccess');
    t.is(c.hasResponseElement, true);
    t.is(c.url, url);
    t.true(c.sitekey && c.sitekey.length > 5);
    await browser.close();
});
(0, ava_1.default)('will detect hCAPTCHAs', async (t) => {
    const puppeteer = (0, puppeteer_extra_1.addExtra)(require('puppeteer'));
    const recaptchaPlugin = (0, index_1.default)();
    puppeteer.use(recaptchaPlugin);
    const browser = await puppeteer.launch({
        args: PUPPETEER_ARGS,
        headless: true
    });
    const page = await browser.newPage();
    const urls = [
        'https://accounts.hcaptcha.com/demo',
        'https://democaptcha.com/demo-form-eng/hcaptcha.html'
    ];
    for (const url of urls) {
        await page.goto(url, { waitUntil: 'networkidle0' });
        const { captchas, error } = await page.findRecaptchas();
        t.is(error, null);
        t.is(captchas.length, 1);
        const c = captchas[0];
        t.is(c._vendor, 'hcaptcha');
        t.is(c.url, url);
        t.true(c.sitekey && c.sitekey.length > 5);
    }
    await browser.close();
});
(0, ava_1.default)('will detect active hCAPTCHA challenges', async (t) => {
    const puppeteer = (0, puppeteer_extra_1.addExtra)(require('puppeteer'));
    const recaptchaPlugin = (0, index_1.default)();
    puppeteer.use(recaptchaPlugin);
    const browser = await puppeteer.launch({
        args: PUPPETEER_ARGS,
        headless: true
    });
    const page = await browser.newPage();
    const urls = [
        'https://accounts.hcaptcha.com/demo',
        'https://democaptcha.com/demo-form-eng/hcaptcha.html'
    ];
    for (const url of urls) {
        await page.goto(url, { waitUntil: 'networkidle0' });
        await page.evaluate(() => window.hcaptcha.execute()); // trigger challenge popup
        await page.waitForTimeout(2 * 1000);
        await page.evaluate(() => document
            .querySelector(`[data-hcaptcha-widget-id]:not([src*='invisible'])`)
            .remove()); // remove regular checkbox so we definitely test against the popup
        const { captchas, error } = await page.findRecaptchas();
        t.is(error, null);
        t.is(captchas.length, 1);
        const c = captchas[0];
        t.is(c._vendor, 'hcaptcha');
        t.is(c.url, url);
        t.true(c.sitekey && c.sitekey.length > 5);
    }
    await browser.close();
});
(0, ava_1.default)('will not throw when no captchas are found', async (t) => {
    const puppeteer = (0, puppeteer_extra_1.addExtra)(require('puppeteer'));
    const recaptchaPlugin = (0, index_1.default)();
    puppeteer.use(recaptchaPlugin);
    const browser = await puppeteer.launch({
        args: PUPPETEER_ARGS,
        headless: true
    });
    const page = await browser.newPage();
    const url = 'https://www.example.com';
    await page.goto(url, { waitUntil: 'networkidle0' });
    const { captchas, error } = await page.findRecaptchas();
    t.is(error, null);
    t.is(captchas.length, 0);
    await browser.close();
});
// TODO: test/mock the rest
//# sourceMappingURL=index.test.js.map