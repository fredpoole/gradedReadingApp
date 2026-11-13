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

Up to 50 completed sessions are stored in localStorage in this browser only. There are no learner accounts or cross-device sync. In-progress sessions are not saved on refresh. Storage failures still allow report download. The app binds to localhost; add authentication, rate limits, persistent learner storage, and HTTPS before offering a public server.

## Verify

```sh
npm test
```
