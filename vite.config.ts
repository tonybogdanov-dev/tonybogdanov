import 'dotenv/config';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import yaml from '@rollup/plugin-yaml';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { compression } from 'vite-plugin-compression2';
import { config } from './config.node';
import { handleEmail } from './src/api/email.js';
import { handleContact } from './src/api/contact.js';

function googleFontsPlugin(): Plugin {
  const families = [config.fonts.sansSerif, config.fonts.serif]
    .map((font) => `family=${font.name.replace(/ /g, '+')}:wght@${font.weights.join(';')}`)
    .join('&');

  return {
    name: 'inject-google-fonts',
    transformIndexHtml: () => [
      {
        tag: 'link',
        attrs: { href: `https://fonts.googleapis.com/css2?${families}&display=block`, rel: 'stylesheet' },
        injectTo: 'head',
      },
    ],
  };
}

function titlePlugin(): Plugin {
  return {
    name: 'inject-title',
    transformIndexHtml: (html) => html.replace(/<title>.*?<\/title>/, `<title>${config.content.title}</title>`),
  };
}

// Dev-mode counterpart to the `/api/email` route in server.js: keeps the real email address out
// of the client bundle, only ever handing it over on an explicit runtime request (see useRevealableEmail).
function emailApiPlugin(): Plugin {
  return {
    name: 'email-api',
    configureServer(server) {
      server.middlewares.use('/api/email', (req, res) => handleEmail(config.email, res));
    },
  };
}

// Dev-mode counterpart to the `/api/contact` route in server.js.
function contactApiPlugin(): Plugin {
  return {
    name: 'contact-api',
    configureServer(server) {
      server.middlewares.use('/api/contact', (req, res) => handleContact(req, res, { to: config.email }));
    },
  };
}

// Dev-mode counterpart to the `/upwork` route in server.js.
function upworkRedirectPlugin(): Plugin {
  return {
    name: 'upwork-redirect',
    configureServer(server) {
      server.middlewares.use('/upwork', (req, res) => {
        res.statusCode = 302;
        res.setHeader('Location', config.content.profile.upwork);
        res.end();
      });
    },
  };
}

// Build-time counterpart to the yaml parsing server.js used to do at boot: emits the handful of
// values the production server needs, so the runtime image ships neither config/ nor a yaml parser.
function runtimeConfigPlugin(): Plugin {
  return {
    name: 'emit-runtime-config',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: '.runtime.json',
        source: JSON.stringify({ upwork: config.content.profile.upwork }),
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    svgr(),
    yaml(),
    googleFontsPlugin(),
    titlePlugin(),
    emailApiPlugin(),
    contactApiPlugin(),
    upworkRedirectPlugin(),
    runtimeConfigPlugin(),
    compression({ algorithms: ['gzip', 'brotliCompress'], deleteOriginalAssets: false }),
  ],
  build: {
    outDir: '.dist',
    assetsInlineLimit: 0,
  },
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
  },
  server: {
    // BrowserStack Local tunnels macOS/Safari sessions through bs-local.com
    // instead of localhost; Vite's host check blocks it otherwise.
    allowedHosts: ['bs-local.com'],
  },
});
