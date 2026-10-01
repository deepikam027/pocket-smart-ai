# Pocket Smart AI: Smart Budget and Recommendation Assistant

A responsive, browser-based budget dashboard for students and individuals. Record daily expenses, keep a monthly spending plan, and see a simple category breakdown and rule-based suggestions. Your budget and expenses are saved in your browser with LocalStorage; no account or backend is required.

## Objectives

- Make it easy to set a monthly budget in Indian Rupees and track expenses.
- Show spending, remaining balance, category patterns, and budget warnings at a glance.
- Keep the project approachable for beginners by using plain HTML, CSS, and JavaScript.

## Technologies

- HTML5 and CSS3 for the responsive interface.
- Vanilla JavaScript for form validation, calculations, recommendations, and a canvas doughnut chart.
- Browser LocalStorage for private, on-device persistence.

## Features

- Set or update a monthly budget in rupees.
- Add expenses with a name, amount, category, and date; delete recent entries.
- Track total spending and available balance for the current month.
- View budget progress and receive a warning at 80% or when over budget.
- Explore a category chart and demo recommendations based on simple rules.
- Load sample data after confirming; an empty state is shown before you add any expenses.
- Responsive layout for desktop, tablet, and mobile screens.
- Input checks prevent invalid, negative, future-dated, and excessively large entries.

The recommendations are demo logic, not a live generative AI model. This app does not connect to bank accounts or send financial data to a server. Data remains in LocalStorage on the current browser and device.

## Project structure

```text
pocket-smart-ai/
├── index.html
├── style.css
├── script.js
└── README.md
```

## Run locally

1. Download or clone this repository.
2. Open `index.html` in a modern browser. No build step or API key is needed.
3. Set a monthly budget, then add expenses. Refresh the page to see saved data.

For a local web server, you can also run `python3 -m http.server 8000` in the project folder and open `http://localhost:8000`.

## Deploy with GitHub Pages

1. Push the project files to the repository's default branch.
2. On GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the default branch and the `/ (root)` folder, then select **Save**.
5. Wait for the Pages deployment to finish. GitHub will show the published URL in the Pages section.

## Screenshots

_Add a desktop and mobile screenshot here after running the project._

## Future enhancements

- Export and import expenses as CSV.
- Add month selection and recurring expense support.
- Add optional savings goals and budget categories.
- Add automated accessibility and browser tests.

## Privacy and recommendation note

Recommendations are a small set of transparent, rule-based demo suggestions; they are not financial advice and do not use a live AI model. Pocket Smart AI does not connect to bank accounts. Data is stored only in the browser's LocalStorage, so it is not synced between browsers or devices. Clearing browser storage removes the saved data.