# Lead Predictor

Lead Predictor is a dependency-free, responsive calculator for estimating the number of customers, leads, and prospects a campaign requires to reach its revenue target.

## Technologies

- Semantic HTML5
- CSS3 (responsive layout and native range controls)
- Vanilla JavaScript (ES6 classes, events, arrays, strings, objects, and `Map`)

No framework, build step, charting package, or external CSS/JavaScript library is used.

## Formulas

The calculator rounds every funnel-stage requirement upward with `Math.ceil()`:

```text
Customers = Total Revenue / Average Order Value
Leads = Customers × 100 / Lead Response Rate
Prospects = Leads × 100 / Prospect Response Rate
```

With the initial settings ($10,000 revenue, $1,000 average order value, 40% lead response rate, and 20% prospect response rate), the output is **10 customers**, **25 leads**, and **125 prospects**.

## Features

- Live validation and instant recalculation
- Campaign start/end dates and monthly, keyboard-accessible funnel chart
- Focus/hover chart tooltips with per-month funnel values
- English and Bulgarian interface text
- USD, EUR, and BGN display options
- Responsive dashboard layout, visible focus states, and reduced-motion support

## Run locally

This is a static application. Open `index.html` directly in a modern browser, or serve this directory from any static web server. No installation is required.

## Deployment

Deploy the repository root as the publish directory; no build command is required.

Netlify URL: _Pending Netlify authentication and production deployment._
