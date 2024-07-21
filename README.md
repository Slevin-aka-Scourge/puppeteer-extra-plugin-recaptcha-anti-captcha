# Anti-Captcha provider for puppeteer-extra-plugin-recaptcha!

> This is a plugin for [puppeteer-extra-plugin-recaptcha](https://github.com/berstend/puppeteer-extra/tree/master/packages/puppeteer-extra-plugin-recaptcha) that implements [Anti-Captcha](https://getcaptchasolution.com/w3dxzftg7u) provider to the solver.

![](https://i.imgur.com/SWrIQw0.gif)

## Gratitude

-   Thanks to [berstend](https://github.com/berstend) for the original plugin

## Install

```bash
yarn add puppeteer-extra-plugin-recaptcha-anti-captcha
# - or -
npm install puppeteer-extra-plugin-recaptcha-anti-captcha
```

If this is your first [puppeteer-extra](https://github.com/berstend/puppeteer-extra) plugin here's everything you need:

```bash
yarn add puppeteer puppeteer-extra puppeteer-extra-plugin-recaptcha-anti-captcha
# - or -
npm install puppeteer puppeteer-extra puppeteer-extra-plugin-recaptcha-anti-captcha
```

## Usage

The plugin essentially provides a mighty `page.solveRecaptchas()` method that does everything needed automagically.

```js
// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality
const puppeteer = require('puppeteer-extra')

// add recaptcha plugin and provide it your anti-captcha token (= their apiKey)
// anti-captcha is the builtin solution provider but others would work as well.
// Please note: You need to add funds to your anti-captcha account for this to work
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha-anti-captcha')
puppeteer.use(
  RecaptchaPlugin({
    provider: {
      id: 'antigate',
      token: 'XXXXXXX' // REPLACE THIS WITH YOUR OWN 2CAPTCHA API KEY ⚡
    },
    visualFeedback: true // colorize reCAPTCHAs (violet = detected, green = solved)
  })
)

// puppeteer usage as normal
puppeteer.launch({ headless: true }).then(async browser => {
  const page = await browser.newPage()
  await page.goto('https://www.google.com/recaptcha/api2/demo')

  // That's it, a single line of code to solve reCAPTCHAs 🎉
  await page.solveRecaptchas()

  await Promise.all([
    page.waitForNavigation(),
    page.click(`#recaptcha-demo-submit`)
  ])
  await page.screenshot({ path: 'response.png', fullPage: true })
  await browser.close()
})
```

### Options

```ts
interface PluginOptions {
  /** Visualize reCAPTCHAs based on their state */
  visualFeedback: boolean // default: true
  /** Throw on errors instead of returning them in the error property */
  throwOnError: boolean // default: false
  /** Only solve captchas and challenges visible in the browser viewport */
  solveInViewportOnly: boolean // default: false
  /** Solve scored based captchas with no challenge (e.g. reCAPTCHA v3) */
  solveScoreBased: boolean // default: false
  /** Solve invisible captchas that have no active challenge */
  solveInactiveChallenges: boolean // default: false
}
```

### What about invisible reCAPTCHAs?

- [Invisible reCAPTCHAs](https://developers.google.com/recaptcha/docs/invisible) are supported. They're basically used to compute a score of how likely the user is a bot. Based on that score the site owner can block access to resources or (most often) present the user with a reCAPTCHA challenge (which this plugin can solve). The [stealth plugin](https://github.com/berstend/puppeteer-extra/tree/master/packages/puppeteer-extra-plugin-stealth) might be of interest here, as it masks the usage of puppeteer.
- Technically speaking the plugin supports: reCAPTCHA v2, reCAPTCHA v3, invisible reCAPTCHA, hCaptcha, invisible hCaptcha. All of those (multiple as well) are solved when `page.solveRecaptchas()` is called.

### When should I call `page.solveRecaptchas()`?

- reCAPTCHAs will be solved automatically whenever they **are visible** (_aka their "I'm not a robot" iframe in the DOM_). It's your responsibility to do any required actions to trigger the captcha being shown, if needed.
  - Note about "invisible" versions of reCAPTCHA/hCaptchas: They don't feature a visible checkbox iframe, the plugin will then solve any open challenge popups instead. :-)
- If you summon the plugin immediately after navigating to a page it's got your back and will wait automatically until the reCAPTCHA script (if any) has been loaded and initialized.
- If you call `page.solveRecaptchas()` on a page that has no reCAPTCHAs nothing bad will happen (😄) but the promise will resolve and the rest of your code executes as normal.
- After solving the reCAPTCHAs the plugin will automatically detect and trigger their [optional callback](https://developers.google.com/recaptcha/docs/display#render_param). This might result in forms being submitted and page navigations to occur, depending on how the site owner implemented the reCAPTCHA.

### Defaults

By default the plugin will never throw, but return any errors silently in the `{ error }` property of the result object. You can change that behaviour by passing `throwOnError: true` to the initializier and use `try/catch` blocks to catch errors.

For convenience and because it looks cool the plugin will "colorize" reCAPTCHAs depending on their state (violet = detected and being solved, green = solved). You can turn that feature off by passing `visualFeedback: false` to the plugin initializer.

## Troubleshooting

### Solving captchas in iframes

By default the plugin will only solve reCAPTCHAs showing up on the immediate page. In case you encounter captchas in frames the plugin extends the `Puppeteer.Frame` object with custom methods as well:

```js
// Loop over all potential frames on that page
for (const frame of page.mainFrame().childFrames()) {
  // Attempt to solve any potential captchas in those frames
  await frame.solveRecaptchas()
}
```

In addition you might want to disable site isolation, so puppeteer is able to access [cross-origin iframes](https://github.com/puppeteer/puppeteer/issues/2548):

```js
puppeteer.launch({
  args: [
    '--disable-features=IsolateOrigins,site-per-process,SitePerProcess',
    '--flag-switches-begin --disable-site-isolation-trials --flag-switches-end'
  ]
})
```

### Solving captchas in pre-existing browser pages

In case you're not using `browser.newPage()` but re-use the existing `about:blank` tab (which is not recommended for various reasons) you will experience a `page.solveRecaptchas is not a function` error, as the plugin hasn't hooked into this page yet. As a workaround you can manually add existing pages to the lifecycle methods of the plugin:

```js
const recaptcha = RecaptchaPlugin()
const pages = await browser.pages()
for (const page in pages) {
  // Add plugin methods to existing pages
  await recaptcha.onPageCreated(page)
}
```

### Tips

- Make sure to use debug logging if something is not working right or when reporting issues.
- Check for ignored captchas in the filtered array in case a captcha you intend to solve is being ignored, filtered captchas will state the reason why they have been ignored (or better: which plugin option is responsible)
- Keep in mind that by default the plugin will only solve "active" captchas (the means a visible checkbox or an active challenge popup). In extreme cases (like a very weird or super slow loading site) you can help the plugin by making sure the captcha you intend to solve is there before calling `page.solveRecaptchas`:

```js
await page.waitForSelector('iframe[src*="recaptcha/"]')
await page.solveRecaptchas()
```