"""Generate a piano piece and write the MIDI, piano roll and audio.

Replaces the Django view that used to wrap this. The view was ~80% request
plumbing around two calls; the model loading below is lifted from its
module-level import block, where it ran on every `manage.py` invocation.

    python cli.py --out ./out
"""

import argparse
from pathlib import Path

import torch
from miditok import REMI
from transformers import AutoModelForCausalLM

from music_generator import generate_song, midi_to_mp3

# Hugging Face repos. `theglassofwater` is a former username; HF redirects
# renamed accounts, but if these stop resolving the weights need re-uploading.
# See docs/BLOCKERS.md #5.
MODEL_ID = "theglassofwater/finetuning_16.0epochs"
TOKENIZER_ID = "theglassofwater/remi_12500"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--out", type=Path, default=Path("out"), help="output directory (created if missing)"
    )
    parser.add_argument(
        "--max-length", type=int, default=200, help="total tokens to generate (default: 200)"
    )
    parser.add_argument(
        "--name", default="song", help="basename for the output files (default: song)"
    )
    parser.add_argument("--sample-rate", type=int, default=22050)
    args = parser.parse_args()

    args.out.mkdir(parents=True, exist_ok=True)
    midi_path = args.out / f"{args.name}.mid"
    png_path = args.out / f"{args.name}.png"
    # .wav, not .mp3: soundfile picks its format from the extension and does not
    # write mp3. The original wrote a WAV stream to a .mp3 filename, which
    # browsers tolerate but is a lie about the format.
    audio_path = args.out / f"{args.name}.wav"

    print(f"Loading {MODEL_ID} ...")
    model = AutoModelForCausalLM.from_pretrained(MODEL_ID)
    if torch.cuda.is_available():
        model.to("cuda")
        print("Using CUDA.")
    else:
        print("No CUDA device; running on CPU (slower).")

    tokenizer = REMI.from_pretrained(TOKENIZER_ID)

    print(f"Generating {args.max_length} tokens ...")
    generate_song(
        model,
        tokenizer,
        song_filename=str(midi_path),
        pianoroll_filename=str(png_path),
        max_length=args.max_length,
    )
    midi_to_mp3(str(midi_path), str(audio_path), sr=args.sample_rate)

    print(f"\nWrote:\n  {midi_path}\n  {png_path}\n  {audio_path}")


if __name__ == "__main__":
    main()
