#!/usr/bin/env python3
"""Validate an Agent Skill directory against the open skill format."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


ALLOWED_FIELDS = {
    "name",
    "description",
    "license",
    "compatibility",
    "metadata",
    "allowed-tools",
}
NAME_RE = re.compile(r"^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$|^[a-z0-9]$")
TOP_LEVEL_RE = re.compile(r"^([A-Za-z0-9_-]+):(.*)$")


def strip_quotes(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        return value[1:-1]
    return value


def parse_scalar(value: str) -> Any:
    value = strip_quotes(value.strip())
    if value in {"true", "True"}:
        return True
    if value in {"false", "False"}:
        return False
    if value in {"null", "Null", "~"}:
        return None
    if re.fullmatch(r"-?\d+", value):
        try:
            return int(value)
        except ValueError:
            return value
    if re.fullmatch(r"-?\d+\.\d+", value):
        try:
            return float(value)
        except ValueError:
            return value
    return value


def parse_frontmatter_fallback(text: str) -> dict[str, Any]:
    lines = text.splitlines()
    data: dict[str, Any] = {}
    index = 0
    while index < len(lines):
        line = lines[index]
        index += 1
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        match = TOP_LEVEL_RE.match(line)
        if not match:
            raise ValueError(f"cannot parse frontmatter line: {line!r}")
        key, raw_value = match.group(1), match.group(2).strip()
        if raw_value in {">", "|"}:
            block: list[str] = []
            while index < len(lines) and (
                lines[index].startswith(" ") or not lines[index].strip()
            ):
                block.append(lines[index].lstrip())
                index += 1
            separator = " " if raw_value == ">" else "\n"
            data[key] = separator.join(part for part in block).strip()
            continue
        if raw_value:
            data[key] = parse_scalar(raw_value)
            continue
        nested: dict[str, Any] = {}
        while index < len(lines) and (
            lines[index].startswith(" ") or not lines[index].strip()
        ):
            nested_line = lines[index]
            index += 1
            if not nested_line.strip():
                continue
            nested_match = re.match(r"^\s+([A-Za-z0-9_.-]+):(.*)$", nested_line)
            if not nested_match:
                raise ValueError(f"cannot parse nested frontmatter line: {nested_line!r}")
            nested[nested_match.group(1)] = parse_scalar(nested_match.group(2).strip())
        data[key] = nested
    return data


def parse_frontmatter(text: str) -> dict[str, Any]:
    try:
        import yaml  # type: ignore

        parsed = yaml.safe_load(text)
        if parsed is None:
            return {}
        if not isinstance(parsed, dict):
            raise ValueError("frontmatter must be a mapping")
        return parsed
    except ModuleNotFoundError:
        return parse_frontmatter_fallback(text)
    except Exception as exc:
        raise ValueError(f"invalid YAML frontmatter: {exc}") from exc


def extract_frontmatter(content: str) -> tuple[str, str]:
    if not content.startswith("---\n"):
        raise ValueError("SKILL.md must start with YAML frontmatter delimited by ---")
    marker = "\n---"
    end = content.find(marker, 4)
    if end == -1:
        raise ValueError("frontmatter closing --- not found")
    frontmatter = content[4:end]
    body = content[end + len(marker) :].lstrip("\n")
    return frontmatter, body


def validate_skill(skill_path: Path) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    skill_path = skill_path.resolve()
    skill_md = skill_path / "SKILL.md"

    if not skill_path.exists():
        return [f"skill directory does not exist: {skill_path}"], warnings
    if not skill_path.is_dir():
        return [f"path is not a directory: {skill_path}"], warnings
    if not skill_md.exists():
        return ["SKILL.md not found"], warnings

    try:
        content = skill_md.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return ["SKILL.md must be UTF-8 text"], warnings

    try:
        frontmatter_text, body = extract_frontmatter(content)
        frontmatter = parse_frontmatter(frontmatter_text)
    except ValueError as exc:
        return [str(exc)], warnings

    unknown = sorted(set(frontmatter) - ALLOWED_FIELDS)
    if unknown:
        errors.append(f"unknown frontmatter field(s): {', '.join(unknown)}")

    name = frontmatter.get("name")
    if not isinstance(name, str) or not name.strip():
        errors.append("name must be a non-empty string")
    else:
        name = name.strip()
        if len(name) > 64:
            errors.append("name must be 64 characters or fewer")
        if not re.fullmatch(r"[a-z0-9-]+", name):
            errors.append("name may contain only lowercase letters, numbers, and hyphens")
        if name.startswith("-") or name.endswith("-") or "--" in name:
            errors.append("name must not start or end with a hyphen or contain consecutive hyphens")
        if name != skill_path.name:
            errors.append("name must match parent directory")

    description = frontmatter.get("description")
    if not isinstance(description, str) or not description.strip():
        errors.append("description must be non-empty")
    elif len(description.strip()) > 1024:
        errors.append("description must be 1024 characters or fewer")

    compatibility = frontmatter.get("compatibility")
    if compatibility is not None:
        if not isinstance(compatibility, str) or not compatibility.strip():
            errors.append("compatibility must be a non-empty string when present")
        elif len(compatibility.strip()) > 500:
            errors.append("compatibility must be 500 characters or fewer")

    license_value = frontmatter.get("license")
    if license_value is not None and (
        not isinstance(license_value, str) or not license_value.strip()
    ):
        errors.append("license must be a non-empty string when present")

    allowed_tools = frontmatter.get("allowed-tools")
    if allowed_tools is not None and (
        not isinstance(allowed_tools, str) or not allowed_tools.strip()
    ):
        errors.append("allowed-tools must be a non-empty string when present")

    metadata = frontmatter.get("metadata")
    if metadata is not None:
        if not isinstance(metadata, dict):
            errors.append("metadata must be a mapping")
        else:
            for key, value in metadata.items():
                if not isinstance(key, str) or not key.strip():
                    errors.append("metadata keys must be non-empty strings")
                if not isinstance(value, str):
                    errors.append("metadata values must be strings")
                    break

    if not body.strip():
        errors.append("SKILL.md body must be non-empty")
    if "TODO" in content or "[TODO" in content:
        warnings.append("placeholder TODO text remains")

    for directory in ("scripts", "references", "assets", "agents", "evals"):
        path = skill_path / directory
        if path.exists() and not path.is_dir():
            errors.append(f"{directory}/ must be a directory when present")

    return errors, warnings


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate an Agent Skill directory against the open skill format."
    )
    parser.add_argument("skill_path", help="Path to the skill directory")
    parser.add_argument("--json", action="store_true", help="Print machine-readable JSON")
    args = parser.parse_args()

    errors, warnings = validate_skill(Path(args.skill_path))
    payload = {
        "valid": not errors,
        "errors": errors,
        "warnings": warnings,
    }
    if args.json:
        print(json.dumps(payload, indent=2, sort_keys=True))
    elif errors:
        print("Skill is invalid:")
        for error in errors:
            print(f"- {error}")
        for warning in warnings:
            print(f"Warning: {warning}", file=sys.stderr)
    else:
        print("Skill is valid.")
        for warning in warnings:
            print(f"Warning: {warning}", file=sys.stderr)
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
