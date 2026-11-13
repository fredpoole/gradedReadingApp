# Leaf — graded reading

A small Node.js app for Spanish, French, and German learners. Choose a topic and CEFR level (A1–C2), generate a reading of up to 300 words, select any word for its contextual English meaning, and finish with a reading report.

## Run locally

Requires Node.js 22.13+ (Node 23.7+ also works). No dependency installation needed.

```sh
npm start
```

Open http://localhost:3000. Sample mode includes one fully glossed A1 everyday-life reading in each language. Samples do not adapt to the chosen topic or level.

## Enable live generation

Copy `.env.example` to `.env`, add your OpenAI API key, and restart the server. Keys stay on the server and `.env` is ignored by Git. `OPENAI_MODEL` defaults to `gpt-4o-mini`; override it with a compatible model. API usage is billed to the key’s account. Never commit a key.

The server uses the [Responses API with structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs). It checks every word token has an English gloss and rejects readings over 300 words. CEFR alignment and translation quality are model estimates, not externally certified assessments. Failed generation displays an error without silently substituting a sample.

## Tracking

The timer starts when the passage appears, includes time spent looking at glosses, and pauses on manual pause or when the document becomes hidden. Returning to the tab requires Resume. Finishing freezes the session. Reports show active time, words per minute, total lookups, distinct word forms looked up, and the percentage of text positions glossed. Repeat clicks count as separate lookups; repeated occurrences share the distinct-word count. Downloads contain the reading, contextual glosses, timestamped lookup events, and summary metrics.

Up to 50 completed sessions are stored in localStorage in this browser only. There are no learner accounts or cross-device sync. In-progress sessions are not saved on refresh. Storage failures still allow report download. The local development server binds to localhost. Netlify provides HTTPS and the hosted reading function configures a limit of 5 requests per minute per IP and domain. This is an abuse deterrent, not a guaranteed spending cap; learners sharing an IP share the limit. Firebase login and server-verified user quotas can be added later.

## Verify

```sh
npm test
```

## Deploy to Netlify

1. In Netlify, choose **Add new project → Import an existing project → GitHub**, and select `fredpoole/gradedReadingApp` on branch `main`.
2. The checked-in `netlify.toml` sets the build command to `npm run build`, publish directory to `dist`, and functions directory to `netlify/functions`. No base directory is needed.
3. In **Project configuration → Environment variables**, add `OPENAI_API_KEY` with your key as its value. Include the **Functions** scope (or all scopes if individual scopes are unavailable), for Production. Optionally set `OPENAI_MODEL` to a compatible structured-output model. Avoid granting production secrets to untrusted deploy previews.
4. Deploy or redeploy after saving the variable. Open the site and verify the topic, language, and level flow, a clickable gloss, and the final report. Without a key, the site remains in sample mode.

Enter the API key directly in Netlify, not in chat, GitHub, a browser-side variable, or the build configuration. Environment changes require a new deployment. Only static files are copied to `dist`; the API key is read at runtime by server functions. Netlify's native function paths expose `/api/config` and `/api/reading`. Generation has a 50-second timeout to leave room within Netlify's 60-second function limit. A slow response shows a retry message.

Docs: [function configuration](https://docs.netlify.com/build/functions/configuration/), [function environment variables](https://docs.netlify.com/build/functions/environment-variables/), and [rate limiting](https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/).

### Firebase later

Keep the frontend on Netlify and use Firebase Authentication plus Firestore for learner accounts and saved reports. At that stage, send the Firebase ID token with reading requests and verify it on the server before generating text; enforce per-user quotas there. Store reports under each authenticated user's ID with corresponding Firestore security rules. Browser history currently remains on-device; no Firebase project or account data has been configured yet.
