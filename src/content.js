console.info('%c🔪 Shinigami Scythe content script loaded.', 'color: lime')

// More convenient observer
class MutationReactor extends MutationObserver {
  constructor(targetElement, callback, options={childList: true, subtree: true}) {
    super(callback)

    this.targetElement = targetElement
    this.options = options
  }

  start() {
    this.observe(this.targetElement, this.options)
    return this
  }
  stop() {
    this.disconnect()
    return this
  }
  restart() {
    this.stop()
    this.start()
  }
  
  runCallback() {
    return this.callback?.()
  }
  
  setOptions(options) {
    const isObject = (options instanceof Object) && !(options instanceof Array)

    if (!isObject) {
      console.warn(`MutationReactor.setOptions: ${options} is not a valid Object, `
                 + `continuing with ${JSON.stingify(this.options)}.`)
      return this
    }

    this.options = options
    this.restart()
    return this
  }

  sneak(callback) {
    this.stop()
    const result = callback()
    this.start()
    return result
  }
}

//#region Utilities

/**
 * Combine different CSS selectors into a single one, appending a
 * .assigned-label-transphobic checker on each one.
 * @param {...string} strings - Individual CSS selectors
 * @returns {string} - Joined CSS selector
 */
function makeSelector(...strings) {
  return strings
    .map((string) => string + ':has(.assigned-label-transphobic)')
    .join(',')
}

//#endregion
//#region CSS Selectors

// TLD-specific CSS selectors for user content
// { [tld: string]: [selector: string] }
const selectors = {
  'x.com': makeSelector(
    '[data-testid="tweet"]',
    '[data-testid="UserCell"]',
  ),

  'youtube.com': makeSelector(
    'ytd-video-renderer',
    'ytd-channel-renderer',
    'ytd-rich-item-renderer',
    'ytd-reel-player-overlay-renderer',
  ),

  'bsky.app': makeSelector(
    '[data-testid^="feedItem-by-"]',
    '.css-175oi2r.r-1otgn73.r-1loqt21.r-1inuy60.r-1hfyk0a.r-ry3cjt.r-m611by',
  ),

  'facebook.com': makeSelector(
    '.x1lliihq',
    '[role="article"]',
  ),
}

// TLD aliases
selectors['twitter.com'] = selectors['x.com']

// Get selector for current website
const selector = Object.entries(selectors)
  // Check if TLD is contained within the current URL's hostname
  .find(([domain, selector]) => location.hostname.includes(domain))

//#endregion CSS Selectors
//#region DOM Checking

const reactor = new MutationReactor(document.body, () => {
  if (!selector)
    return console.info('This website is not supported by Shinigami Scythe.')

  try {
    const posts = document.querySelectorAll(selector)

    if (!posts.length)
      return

    reactor.sneak(()=> posts.forEach((post) => post.remove()))
  }
  catch (error) {
    console.error(`Shinigami Scythe has encountered an unexpected error.`, error)
    alert(`Shinigami Scythe has encountered an unexpected error. Check the console for details.`)
    reactor.stop()
  }
})
  .start()

//#endregion