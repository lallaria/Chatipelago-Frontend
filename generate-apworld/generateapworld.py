"""
Utility to:
1) Load YAML from /tmp/chati.yaml into two dicts: items and locations
2) Write:
   - worlds/chatipelago/names/RegionName.py with variables mapping to lists
   - worlds/chatipelago/names/ItemName.py with ItemNum constants
3) Build Chatipelago APWorld and move output to /tmp
"""

from __future__ import annotations

import os
import sys
import shutil
import logging
from pathlib import Path
from typing import Dict, List, Any

try:
    import yaml  # type: ignore
except Exception as exc:  # pragma: no cover
    raise RuntimeError(
        "PyYAML is required. Install with: pip install pyyaml"
    ) from exc

# This will not resolve without being placed into the Archipelago build folder
from worlds.LauncherComponents import _build_apworlds # type: ignore

ROOT = Path(__file__).resolve().parent
YAML_PATH = Path("/tmp/chati.yaml")
NAMES_DIR = ROOT / "worlds" / "chatipelago" / "names"
BUILD_OUTPUT = ROOT / "build" / "apworlds" / "chatipelago.apworld"
DEST_OUTPUT = Path("/tmp") / "chatipelago.apworld"

# File logging disabled - logger calls will use default handler (stderr) if needed
logger = logging.getLogger(__name__)
logger.addHandler(logging.NullHandler())  # Disable all logging output


def decode_unicode_escapes(s: str) -> str:
    """Decode literal unicode escape sequences like \\u00E9 (from YAML) to actual unicode characters."""
    try:
        # Check for literal backslash-u sequences that safe_load may preserve as strings
        if "\\u" in s or "\\U" in s:
            # Encode to latin-1 to preserve byte values, then decode as unicode_escape
            decoded = s.encode('latin-1').decode('unicode_escape')
            if decoded != s:
                return decoded
    except (UnicodeDecodeError, UnicodeEncodeError, ValueError):
        pass
    return s


def repr_with_unicode_escapes(s: str) -> str:
    """Convert string to Python repr, forcing unicode characters to use \\uXXXX escape sequences."""
    # Fast path: if string is all ASCII, use repr() (Python's built-in is faster)
    try:
        s.encode('ascii')
        # All ASCII - use built-in repr (much faster)
        return repr(s)
    except UnicodeEncodeError:
        pass
    
    # Slow path: process character-by-character for Unicode
    result = []
    for char in s:
        code = ord(char)
        if code < 128:
            # ASCII character - use standard escaping
            if char == "'":
                result.append("\\'")
            elif char == "\\":
                result.append("\\\\")
            elif char == "\n":
                result.append("\\n")
            elif char == "\r":
                result.append("\\r")
            elif char == "\t":
                result.append("\\t")
            elif 32 <= code < 127:  # Printable ASCII
                result.append(char)
            else:
                # Non-printable ASCII - use hex escape
                result.append(f"\\x{code:02x}")
        elif code <= 0xFFFF:
            # Use \uXXXX for BMP characters
            result.append(f"\\u{code:04x}")
        else:
            # Use \UXXXXXXXX for astral plane characters
            result.append(f"\\U{code:08x}")
    return "'" + "".join(result) + "'"


def load_yaml(path: Path) -> tuple[Dict[str, List[str]], Dict[str, List[str]]]:
    logger.info(f"Loading YAML from {path}")
    if not path.exists():
        logger.error(f"YAML file not found: {path}")
        raise FileNotFoundError(f"YAML file not found: {path}")
    with path.open("r", encoding="utf-8") as f:
        data: Dict[str, Any] = yaml.safe_load(f) or {}

    items = data.get("items")
    locations = data.get("locations")
    if not isinstance(items, dict) or not all(isinstance(v, list) for v in items.values()):
        # Nested categories under 'items': normal, trap, filler, prog
        logger.error("'items' must be a mapping of category -> list in YAML")
        raise ValueError("'items' must be a mapping of category -> list in YAML")
    if not isinstance(locations, dict) or not all(isinstance(v, list) for v in locations.values()):
        # Nested categories under 'locations': chatroom, prog
        logger.error("'locations' must be a mapping of category -> list in YAML")
        raise ValueError("'locations' must be a mapping of category -> list in YAML")

    # Normalize lists to strings and decode unicode escape sequences
    norm_items: Dict[str, List[str]] = {
        decode_unicode_escapes(str(k)): [decode_unicode_escapes(str(x)) for x in v] for k, v in items.items()
    }
    norm_locations: Dict[str, List[str]] = {
        decode_unicode_escapes(str(k)): [decode_unicode_escapes(str(x)) for x in v] for k, v in locations.items()
    }
    logger.info(f"Loaded {len(norm_items)} item categories and {len(norm_locations)} location categories")
    return norm_items, norm_locations


def write_region_names(locations: Dict[str, List[str]]) -> None:
    logger.info(f"Writing region names to {NAMES_DIR / 'RegionName.py'}")
    NAMES_DIR.mkdir(parents=True, exist_ok=True)
    region_file = NAMES_DIR / "RegionName.py"

    lines: List[str] = [
        "# Auto-generated by generateapworld.py",
    ]
    for category_name, location_list in locations.items():
        # Create a valid Python identifier (conservative replacement)
        var_name = "".join(ch if ch.isalnum() or ch == "_" else "_" for ch in str(category_name))
        if not var_name or var_name[0].isdigit():
            var_name = f"_{var_name}"
        rendered_list = ", ".join(repr_with_unicode_escapes(x) for x in location_list)
        lines.append(f"{var_name} = [{rendered_list}]")
        logger.debug(f"Added region category '{category_name}' ({len(location_list)} locations) as '{var_name}'")

    region_file.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
    logger.info(f"Wrote {len(locations)} region categories to {region_file}")


def write_item_names(items: Dict[str, List[str]]) -> None:
    logger.info(f"Writing item names to {NAMES_DIR / 'ItemName.py'}")
    NAMES_DIR.mkdir(parents=True, exist_ok=True)
    item_file = NAMES_DIR / "ItemName.py"

    normal_list: List[str] = [str(x) for x in items.get("normal", [])]
    trap_list: List[str] = [str(x) for x in items.get("trap", [])]
    filler_list: List[str] = [str(x) for x in items.get("filler", [])]
    prog_list: List[str] = [str(x) for x in items.get("prog", [])]

    logger.debug(f"Item counts: normal={len(normal_list)}, trap={len(trap_list)}, filler={len(filler_list)}, prog={len(prog_list)}")

    lines: List[str] = [
        "# Auto-generated by generateapworld.py",
    ]

    # Normal items numbered from 0 through 62
    for idx, name in enumerate(normal_list):
        lines.append(f"ItemNum{idx} = {repr_with_unicode_escapes(name)}")

    # Trap items starting at 197
    for offset, name in enumerate(trap_list):
        lines.append(f"ItemNum{197 + offset} = {repr_with_unicode_escapes(name)}")

    # Filler items starting at 200
    for offset, name in enumerate(filler_list):
        lines.append(f"ItemNum{200 + offset} = {repr_with_unicode_escapes(name)}")

    # Progression items starting at 300
    for offset, name in enumerate(prog_list):
        lines.append(f"ItemNum{300 + offset} = {repr_with_unicode_escapes(name)}")

    item_file.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
    total_items = len(normal_list) + len(trap_list) + len(filler_list) + len(prog_list)
    logger.info(f"Wrote {total_items} item definitions to {item_file}")


def run_build_apworld() -> int:
    logger.info("Building APWorld for Chatipelago")
    try:
        _build_apworlds('Chatipelago')
        logger.info("Build completed successfully")
        return 0
    except Exception as e:
        logger.error(f"Build failed: {e}")
        return 1


def move_output() -> None:
    logger.info(f"Moving build output from {BUILD_OUTPUT} to {DEST_OUTPUT}")
    if not BUILD_OUTPUT.exists():
        logger.error(f"Build output not found: {BUILD_OUTPUT}")
        raise FileNotFoundError(f"Build output not found: {BUILD_OUTPUT}")
    DEST_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    # Replace existing file atomically if present
    if DEST_OUTPUT.exists():
        logger.debug(f"Removing existing file at {DEST_OUTPUT}")
        DEST_OUTPUT.unlink()
    shutil.move(str(BUILD_OUTPUT), str(DEST_OUTPUT))
    logger.info(f"Successfully moved output to {DEST_OUTPUT}")


def main() -> int:
    logger.info("Starting APWorld generation process")
    try:
        items, locations = load_yaml(YAML_PATH)
        write_region_names(locations)
        write_item_names(items)

        code = run_build_apworld()
        if code != 0:
            logger.error(f"Build process failed with exit code {code}")
            return code

        move_output()
        logger.info(f"APWorld generation completed successfully. Output: {DEST_OUTPUT}")
        return 0
    except Exception as e:
        logger.exception(f"Error during APWorld generation: {e}")
        raise


if __name__ == "__main__":
    raise SystemExit(main())