#!/usr/bin/env python3
"""Create immutable UI-only calendar previews; never modify download originals.

Run with the Pillow-enabled local runtime, or any Python with Pillow installed.
Only assets/calendar-previews/, _data/preview-images.json and the report are written.
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import os
from pathlib import Path
import time
from datetime import datetime, timezone
from PIL import Image, ImageOps, __version__ as pillow_version, features

MANIFESTS = ("downloads/gada-a3/manifest.json", "downloads/menesa-a3/manifest.json",
             "downloads/meness/manifest.json")
WIDTHS = (480, 800)
ENCODER = {"format": "WEBP", "quality": 84, "method": 6,
           "resampler": "LANCZOS", "upscale": False, "exifTranspose": True,
           "pillowVersion": pillow_version, "libwebpVersion": features.version("webp")}


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def atomic_json(path: Path, value):
    payload = (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    if path.exists() and path.read_bytes() == payload:
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(path.name + f".tmp-{os.getpid()}")
    try:
        temp.write_bytes(payload)
        os.replace(temp, path)
    finally:
        if temp.exists():
            temp.unlink()


def local_source(root: Path, url: str) -> Path:
    if not url.startswith("/downloads/") or "?" in url or "#" in url:
        raise ValueError("Preview must be an unambiguous local downloads URL")
    path = (root / url.lstrip("/")).resolve()
    if not path.is_relative_to((root / "downloads").resolve()):
        raise ValueError("Preview path escapes downloads")
    return path


def valid_variant(root: Path, variant: dict) -> bool:
    try:
        path = (root / variant["src"].lstrip("/")).resolve()
        if not path.is_relative_to((root / "assets/calendar-previews").resolve()):
            return False
        data = path.read_bytes()
        sha = digest(data)
        if len(data) != variant["bytes"] or sha != variant["sha256"] or sha[:24] not in path.name:
            return False
        with Image.open(io.BytesIO(data)) as image:
            return image.format == "WEBP" and list(image.size) == [variant["width"], variant["height"]]
    except (OSError, KeyError, TypeError, ValueError):
        return False


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()
    root = args.root.resolve()
    report_path = args.report or root.parent / "reports/seo-performance-2026-11-11/preview-assets.json"
    output_dir = root / "assets/calendar-previews"
    data_path = root / "_data/preview-images.json"
    started = time.monotonic()
    encoder_fingerprint = digest(json.dumps(ENCODER, sort_keys=True).encode())
    previous = read_json(data_path) if data_path.exists() else {}
    prior_images = previous.get("images", {}) if previous.get("encoderFingerprint") == encoder_fingerprint else {}
    counts = {"sources": 0, "variants": 0, "generatedVariants": 0, "reusedVariants": 0,
              "excludedYearItems": 0, "duplicateSourceReferences": 0}
    manifests = []
    references = {}
    errors = []
    for name in MANIFESTS:
        manifest_path = root / name
        source_bytes = manifest_path.read_bytes()
        manifest = json.loads(source_bytes)
        chosen = [item for item in manifest["items"] if 2027 <= int(item.get("year", 0)) <= 2030]
        counts["excludedYearItems"] += len(manifest["items"]) - len(chosen)
        manifests.append({"path": name, "sha256": digest(source_bytes),
                          "items": len(manifest["items"]), "selectedItems": len(chosen)})
        for item in chosen:
            url = item.get("preview", "")
            if url in references:
                counts["duplicateSourceReferences"] += 1
            references.setdefault(url, {"manifest": name, "item": item})
    output_dir.mkdir(parents=True, exist_ok=True)
    images = {}
    ledger = []
    for index, (url, reference) in enumerate(sorted(references.items()), 1):
        try:
            source_path = local_source(root, url)
            raw = source_path.read_bytes()
            source_sha = digest(raw)
            expected_sha = reference["item"].get("previewSha256")
            if expected_sha and source_sha != expected_sha:
                raise ValueError("Source checksum does not match its original manifest")
            with Image.open(io.BytesIO(raw)) as source:
                source.load()
                image = ImageOps.exif_transpose(source)
                image = image.convert("RGBA" if "A" in image.getbands() else "RGB")
            source_width, source_height = image.size
            actual_widths = sorted({min(width, source_width) for width in WIDTHS})
            old = prior_images.get(url, {})
            reusable = (old.get("sourceSha256") == source_sha and
                        old.get("sourceWidth") == source_width and old.get("sourceHeight") == source_height and
                        [v.get("width") for v in old.get("variants", [])] == actual_widths and
                        all(valid_variant(root, v) for v in old.get("variants", [])))
            if reusable:
                record = old
                counts["reusedVariants"] += len(record["variants"])
            else:
                variants = []
                for width in actual_widths:
                    height = max(1, round(source_height * width / source_width))
                    resized = image if image.size == (width, height) else image.resize((width, height), Image.Resampling.LANCZOS)
                    buffer = io.BytesIO()
                    resized.save(buffer, format="WEBP", quality=84, method=6)
                    result = buffer.getvalue()
                    sha = digest(result)
                    # Actual output digest, not the source or recipe digest, names immutable bytes.
                    group = source_path.parent.name
                    target = output_dir / f"{group}-{source_path.stem}-{width}-{sha[:24]}.webp"
                    if target.exists():
                        if target.read_bytes() != result:
                            raise ValueError("Immutable output name collision; refusing overwrite")
                    else:
                        # Exclusive create guarantees a concurrent run cannot overwrite an asset.
                        try:
                            with target.open("xb") as handle:
                                handle.write(result)
                        except FileExistsError:
                            if target.read_bytes() != result:
                                raise ValueError("Concurrent immutable output collision")
                    variants.append({"src": "/" + target.relative_to(root).as_posix(),
                                     "width": width, "height": height,
                                     "bytes": len(result), "sha256": sha})
                    counts["generatedVariants"] += 1
                largest = variants[-1]
                record = {"sourceSha256": source_sha, "src": largest["src"],
                          "srcset": ", ".join(f'{v["src"]} {v["width"]}w' for v in variants),
                          "width": largest["width"], "height": largest["height"],
                          "variants": variants, "sourceWidth": source_width, "sourceHeight": source_height}
            images[url] = record
            counts["sources"] += 1
            counts["variants"] += len(record["variants"])
            if digest(source_path.read_bytes()) != source_sha:
                raise ValueError("Source changed while previews were generated")
            ledger.append({"source": url, "sourceSha256": source_sha, "sourceBytes": len(raw),
                           "sourceWidth": source_width, "sourceHeight": source_height,
                           "manifest": reference["manifest"], "unchangedAfter": True,
                           "variants": record["variants"]})
            if index % 100 == 0:
                print(f"Preview sources {index}/{len(references)}", flush=True)
        except (OSError, KeyError, ValueError, TypeError) as error:
            errors.append({"source": url, "manifest": reference["manifest"],
                           "error": str(error)})
    for manifest in manifests:
        if digest((root / manifest["path"]).read_bytes()) != manifest["sha256"]:
            errors.append({"manifest": manifest["path"], "error": "Source manifest changed during generation"})
    data = {"schemaVersion": 1, "encoder": ENCODER, "encoderFingerprint": encoder_fingerprint,
            "requestedWidths": list(WIDTHS), "images": images}
    if not errors:
        atomic_json(data_path, data)
    else:
        # Do not publish an incomplete map over a previously valid integration.
        print(f"Not replacing preview map: {len(errors)} source errors", flush=True)
    source_total = sum(row["sourceBytes"] for row in ledger)
    variant_total = sum(v["bytes"] for row in ledger for v in row["variants"])
    largest_total = sum(row["variants"][-1]["bytes"] for row in ledger)
    report = {"generatedAt": datetime.now(timezone.utc).isoformat(), "complete": not errors,
              "root": str(root), "encoder": ENCODER, "encoderFingerprint": encoder_fingerprint,
              "requestedWidths": list(WIDTHS), "counts": counts, "manifests": manifests,
              "sourceTotalBytes": source_total, "allVariantsTotalBytes": variant_total,
              "largestVariantTotalBytes": largest_total,
              "largestVariantReductionPercent": round((1-largest_total/source_total)*100, 2) if source_total else 0,
              "elapsedSeconds": round(time.monotonic()-started, 2),
              "errors": errors, "ledger": ledger,
              "notes": ["Original PDF, Image, preview and manifest files are read-only inputs.",
                        "Widths smaller than requested are retained without upscaling; identical widths are deduplicated.",
                        "Output filenames contain the first 24 hex digits of the actual output SHA256.",
                        "Reusable output is verified by source checksum, encoder fingerprint, dimensions and full output SHA256."]}
    atomic_json(report_path, report)
    print(json.dumps({key: report[key] for key in ["complete", "counts", "sourceTotalBytes",
          "allVariantsTotalBytes", "largestVariantTotalBytes", "largestVariantReductionPercent",
          "elapsedSeconds"]}), flush=True)
    if errors:
        raise SystemExit(2)


if __name__ == "__main__":
    main()
