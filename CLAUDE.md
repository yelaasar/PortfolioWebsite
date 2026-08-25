# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Personal portfolio site: a Django + DRF backend (`WebApp/`) serving a Create React App frontend (`WebApp/frontend/`). The frontend is deployed statically to GitHub Pages (`https://theglassofwater.github.io/PortfolioWebsite/`); the backend runs locally only and is *not* deployed, so the Music Generator page only works against a local Django server.

## Commands

All backend commands run from `WebApp/` (where `manage.py` lives); frontend commands from `WebApp/frontend/`.

```bash
# Backend (Python 3.11 venv, deps in the repo-root requirements.txt)
python -m venv env && source env/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver          # http://127.0.0.1:8000
python manage.py test               # all tests
python manage.py test api.tests.SomeTestCase.test_method   # single test

# Frontend
npm install
npm start                           # http://localhost:3000
npm test                            # react-scripts (jest) watch mode
npm test -- --testPathPattern=App   # single test file
npm run build
npm run deploy                      # gh-pages publish of build/
```

Note: `python manage.py runserver` loads the Hugging Face transformer model at import time (see below), so startup is slow and the autoreloader loads it twice. `--noreload` avoids the double load.

## Architecture

**Two routing layers, one app.** `backend/urls.py` mounts `api/urls.py` at the root (no `/api/` prefix). `api/urls.py` uses a DRF `DefaultRouter` for `users/` and `messages/`, plus a function view at `generate_song/`, and appends `static(MEDIA_URL, ...)` so generated media is served directly by Django in DEBUG.

**Media = generated artifacts, not uploads.** `MEDIA_ROOT` is `api/common/assets/`, served at `/common/assets/`. `generate_song` overwrites the same three files (`song.mid`, `song.png`, `song.mp3`) on every request — there is no per-request file naming, so concurrent requests clobber each other. These files are committed to git. The frontend cache-busts with `?${Date.now()}` on the URLs.

**Model loading is module-level.** `api/views.py` calls `AutoModelForCausalLM.from_pretrained("theglassofwater/finetuning_16.0epochs")` and `REMI.from_pretrained("theglassofwater/remi_12500")` at import time (moved to CUDA if available). Any Django management command pays this cost. Generation itself lives in `api/common/util/music_generator.py`: generate tokens → decode to `.mid` via miditok → render piano-roll PNG via pretty_midi/matplotlib (`Agg` backend) → synthesize to audio and write with soundfile. `midi_to_mp3` actually writes a WAV stream to a `.mp3` filename.

**Hardcoded absolute URLs.** `generate_download_song` returns `http://127.0.0.1:8000/common/assets/...` URLs in its JSON response, and `frontend/src/components/Axios.jsx` hardcodes `baseURL = 'http://localhost:8000/'`. Both must change together for any non-local deployment. `CORS_ALLOWED_ORIGINS` only allows `http://localhost:3000`.

**Contact form flows through UserViewSet, not MessageViewSet.** The frontend POSTs `{name, email, message}` to `users/`. `UserViewSet.create` is overridden to upsert the `User` by email and then create the `Message` in the same request. `User` is a plain `models.Model` (not `AbstractUser`) with an unused `password` field — there is no auth; all viewsets are `AllowAny`. Email validation is stricter in the model than in the frontend yup schema.

**Frontend structure.** `App.js` declares each route twice — once bare and once under `/PortfolioWebsite` — because GitHub Pages serves the app from that subpath. Pages are `components/*Page.jsx` composing section components from `components/<Name>/<Name>.js`, each with a colocated `<Name>.module.css`. The AimTrainer is a react-three-fiber scene under `components/AimTrainer/` with `gameComponents/`; it is pure client-side and touches no API.

## Known state

`DEBUG = True` and `ALLOWED_HOSTS = ["*"]` with a committed `SECRET_KEY` — fine for local dev, must change before any deploy. Contact messages are stored in sqlite only; the README lists "actually receive the messages", UI component libraries, and CI/CD as open goals.
