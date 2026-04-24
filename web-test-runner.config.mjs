// import { playwrightLauncher } from '@web/test-runner-playwright';
import { polyfill } from '@web/dev-server-polyfill';
import { esbuildPlugin } from '@web/dev-server-esbuild';

const filteredLogs = ['Running in dev mode', 'lit-html is in dev mode'];

export default /** @type {import("@web/test-runner").TestRunnerConfig} */ ({
  /** Test files to run */
  files: ['**/*.spec.ts', '!node_modules/**'],
  testRunnerHtml: testFramework => `
  <html>
    <head>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@300&family=Roboto:wght@300;400;500&display=swap" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&display=block" />
    </head>
    <body>
      <style class="deanimator">
      *, *::before, *::after {
       -moz-transition: none !important;
       transition: none !important;
       -moz-animation: none !important;
       animation: none !important;
      }
      </style>
      <style>
      * { -webkit-font-smoothing: none;
       font-kerning: none;
       text-rendering: geometricPrecision;
       font-variant-ligatures: none;
       letter-spacing: 0.01em;}
      </style>
      <script>window.process = { env: ${JSON.stringify(process.env)} }</script>
      <script type="module" src="${testFramework}"></script>
      <script>
      function descendants(parent) {
        return (Array.from(parent.childNodes)).concat(
          ...Array.from(parent.children).map(child => descendants(child))
        );
      }
      const deanimator = document.querySelector('.deanimator');
      function deanimate(element) {
        if (!element.shadowRoot) return;
        if (element.shadowRoot.querySelector('.deanimator')) return;
        const style = deanimator.cloneNode(true);
        element.shadowRoot.appendChild(style);
        descendants(element.shadowRoot).forEach(deanimate);
      }
      const observer = new MutationObserver((mutationList, observer) => {
        for (const mutation of mutationList) {
          if (mutation.type === 'childList') {
            descendants(document.body).forEach(deanimate);
          }
        }
      });
      observer.observe(document.body, {childList: true, subtree:true});
      </script>
      <style>
      * {
        margin: 0px;
        padding: 0px;
        --mdc-icon-font: 'Material Symbols Outlined';
      }

      body {
        background: white;
      }
      </style>
    </body>
  </html>`,

  /** Resolve bare module imports */
  nodeResolve: {
    exportConditions: ['browser', 'development'],
  },

  /** Filter out lit dev mode logs */
  filterBrowserLogs(log) {
    for (const arg of log.args) {
      if (typeof arg === 'string' && filteredLogs.some(l => arg.includes(l))) {
        return false;
      }
    }
    return true;
  },

  plugins: [
    esbuildPlugin({ ts: true, tsconfig: './tsconfig.json' }),
    polyfill({
      scopedCustomElementRegistry: true,
    }),
  ]

  /** Compile JS for older browsers. Requires @web/dev-server-esbuild plugin */
  // esbuildTarget: 'auto',

  /** Amount of browsers to run concurrently */
  // concurrentBrowsers: 2,

  /** Amount of test files per browser to test concurrently */
  // concurrency: 1,

  /** Browsers to run tests on */
  // browsers: [
  //   playwrightLauncher({ product: 'chromium' }),
  //   playwrightLauncher({ product: 'firefox' }),
  //   playwrightLauncher({ product: 'webkit' }),
  // ],

  // See documentation for all available options
});
