# Music Generator

A small causal language model fine-tuned on MIDI token streams, generating short
piano pieces. Generated tokens are decoded back to MIDI, rendered as a piano
roll, and synthesised to audio.

The case study is at [`/work/music-generator`](../../frontend/content/caseStudies.ts).

## Where this came from

This code was served by a Django + DRF backend that ran only on localhost and
was never deployed. That backend has been deleted; the generation code has not,
because it never depended on it — `music_generator.py` imports no Django, takes
the model and tokenizer as arguments, and takes file paths as strings.

Extracting it required exactly two changes: removing default file paths that
assumed the old project's working directory, and moving the model loading out of
a Django module-level import (where it ran on every `manage.py` invocation) into
`cli.py`.

The full pre-migration history is preserved at the `pre-nextjs-migration` tag:

```bash
git show pre-nextjs-migration:WebApp/api/views.py
```

## Running it

```bash
python -m venv env && source env/bin/activate
pip install -r requirements.txt
python cli.py --out ./out
```

Options: `--max-length` (total tokens, default 200 ≈ 60s of audio), `--name`
(output basename), `--sample-rate` (default 22050).

First run downloads model weights from Hugging Face, so it is slow. Without a
CUDA device it runs on CPU, slower again.

Writes three files into `--out`:

| File | What |
|---|---|
| `song.mid` | decoded MIDI |
| `song.png` | piano-roll render (white-on-transparent) |
| `song.wav` | synthesised audio |

`soundfile` is not writing mp3 — it picks its format from the file extension and
has no mp3 encoder. The original code wrote a WAV stream to a `.mp3` filename,
which browsers play anyway; the CLI writes `.wav` so the extension is honest.
The committed sample at `frontend/public/case-studies/music-generator/song.mp3`
is that same WAV-in-mp3-clothing, left as-is because it works.

## Models

| | Hugging Face repo |
|---|---|
| Model | `theglassofwater/finetuning_16.0epochs` |
| Tokenizer | `theglassofwater/remi_12500` (REMI, 12,500-token vocabulary) |

> `theglassofwater` is the former GitHub username, but the Hugging Face account
> was never renamed — both repos return HTTP 200 as of 2026-09-03, so the IDs
> above are current, not historical. Re-check with:
>
> ```bash
> curl -s -o /dev/null -w '%{http_code}\n' https://huggingface.co/api/models/theglassofwater/remi_12500
> ```

## How it works

`generate_song()` runs the pipeline:

1. `generate_tokens()` — samples from the model with `temperature=0.9`,
   `do_sample=True` and a 25-token floor, so degenerate short outputs are not
   returned. Moves the input to CUDA when available.
2. `tokens_to_file()` — decodes tokens through the REMI tokenizer and dumps MIDI.
3. `make_piano_roll()` — renders the piano roll via `pretty_midi` and matplotlib
   on the `Agg` backend, with white axes on a transparent background so it sits
   on the site's dark theme.

`midi_to_mp3()` is separate: it synthesises the MIDI to an audio array and writes
it. (The name is a holdover; it writes whatever format the extension implies.)
