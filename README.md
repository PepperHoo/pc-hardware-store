# Custom Website

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

## Live Currency Pricing

The website converts MYR product prices using live forex snapshots from Twelve Data.
Add the following environment variable in Vercel and redeploy:

```text
TWELVE_DATA_API_KEY=your_twelve_data_api_key
```

The API key is used only by `/api/exchange-rates` and is never exposed to the browser.
The website refreshes rates every minute and keeps the last successful live rates if the
provider is temporarily unavailable.

The request contains five forex symbols. Check that your Twelve Data plan has enough API
credits for your expected traffic and refresh frequency.

## Supabase Cart And Wishlist Storage

The user cart and wishlist are stored in Supabase so they remain available after refresh,
sign-out, or login on another device.

Run the following file once in **Supabase Dashboard > SQL Editor**:

```text
supabase-cart-wishlist-tables.sql
```

This creates the `cart_items` and `wishlist_items` tables. Each row contains the user email,
product ID, and a JSON product snapshot. Cart rows also contain the selected quantity.

After running the SQL, add a component to the cart or wishlist and confirm it appears in
**Supabase Dashboard > Table Editor**.

The current website uses a custom users table instead of Supabase Auth, so the included RLS
policies allow the public website client to read and write these rows. For production security,
migrate login to Supabase Auth and restrict each policy to the authenticated user's ID.

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
