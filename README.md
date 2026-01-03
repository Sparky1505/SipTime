## Available on Chrome Web Store

[SipTime – Install from the Chrome Web Store](https://chromewebstore.google.com/detail/siptime/npjkkjooolnpkpmleojnembmiaeccnml)


# SipTime

SipTime is a lightweight browser extension that helps you stay hydrated with simple, reliable reminders.  
It runs entirely in the browser, stores settings locally, and works without accounts or tracking.

Built as a Chrome / Brave extension using React, TypeScript, and Vite.

---

## What SipTime does

- Sends hydration reminders at regular intervals or fixed times
- Supports quiet hours to avoid interruptions at night
- Allows snoozing reminders when you’re busy
- Shows the next scheduled reminder in the popup
- Stores all settings locally using browser storage

No data is sent to external servers.

---

## Features

- Interval reminders (every X minutes)
- Fixed-time reminders (specific times each day)
- Quiet hours with overnight support
- Snooze option directly from notifications
- Clean popup UI with current status and next reminder
- Simple settings page with validation and feedback

---

## Tech stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Chrome Extensions (Manifest V3)

---

## Project structure

.
├── src/  
│   ├── background/        Alarm scheduling and notifications  
│   ├── popup/             Extension popup UI  
│   ├── options/           Settings page UI  
│   ├── shared/            Shared types and storage helpers  
│   └── index.css  
│  
├── public/                Static assets (icon)  
├── manifest.json  
├── popup.html  
├── options.html  
├── vite.config.ts  
└── package.json  

---

## Local development

Install dependencies  
npm install

Build the extension  
npm run build

Load the extension locally  
1. Open chrome://extensions or brave://extensions  
2. Enable Developer mode  
3. Click Load unpacked  
4. Select the dist folder

---

## Notifications note (Windows)

If notifications do not appear:

- Ensure browser notifications are enabled in Windows settings
- Make sure notification banners are allowed for Chrome or Brave
- Check that Do Not Disturb is turned off

---

## Privacy

SipTime does not collect, track, or transmit personal data.  
All preferences are stored locally using browser storage APIs.

---

## Why this project

SipTime was built as a practical, daily-use extension with a focus on:

- Reliability
- Simple UX
- Clean architecture
- Long-term maintainability

It also serves as a foundation for future habit-tracking features.

---

## License

MIT
