---
title: "Fixing VSCode Auto-Import with Python UV"
date: 2025-05-25T12:00:00+01:00
draft: false
language: en
# No featured image since one wasn't provided in the request
summary: Resolve VSCode auto-import issues when using Python UV in package mode by configuring hatchling and adding an 'editables' dependency.
description:  A guide to fixing VSCode's auto-import feature when working with Python projects managed by UV in package mode. This involves modifying the `hatchling` build configuration and ensuring the `editables` package is included as a development dependency.
author: raydak
tags: [
    "Python",
    "UV",
    "VSCode",
    "Auto-Import",
    "Hatchling",
    "Development Environment"
]
categories: [
    "Development",
    "Tools"
]
---

## Problem

When using Python's `uv` package manager in package mode (`--package`), I encountered issues with VSCode's auto-import functionality. Specifically, VSCode stopped providing import suggestions, which significantly hindered my workflow.

## Solution

To restore auto-import functionality in VSCode when using `uv` in package mode, follow these steps:

1.  **Modify `hatchling` Configuration:** Add the `dev-mode-exact` option to your `hatchling` configuration. This setting ensures that development dependencies are treated as exact versions.
2.  **Add `editables` Dependency:** Include `editables` as a development dependency. This package, along with the `dev-mode-exact` setting, helps create the necessary files in the `site-packages` directory for VSCode to correctly resolve imports.

Here’s the updated `pyproject.toml` configuration:

```toml
[project]
    name = "demo-bug"
    version = "0.1.0"
    description = "Add your description here"
    readme = "README.md"
    authors = [{ name = "your name", email = "mymail" }]
    requires-python = ">=3.12"
    dependencies = []

    [project.scripts]
        demo-bug = "demo_bug:main"

[build-system]
    build-backend = "hatchling.build"
    requires = ["hatchling"]

# https://hatch.pypa.io/1.12/config/build/#dev-mode
# https://microsoft.github.io/pyright/#/import-resolution?id=editable-installs
# requires package "editables"
[tool.hatch.build]
    dev-mode-exact = true

[dependency-groups]
    dev = ["editables>=0.5"]
```


3.  **Sync Dependencies:** Run `uv sync` to update your project's dependencies based on the modified `pyproject.toml` file.
4.  **Restart VSCode:** After syncing, restart VSCode or use the "Clear Cache and Reload Window" command to ensure the changes take effect. The Python extension will then recreate its cache, and auto-import should start working.

This solution has been tested with Python 3.12 and Python 3.13.

## Future Improvements

The underlying issues in `uv` and the VSCode Python extension are being tracked in these GitHub issues:

*   [https://github.com/astral-sh/uv/issues/9637](https://github.com/astral-sh/uv/issues/9637)
*   [https://github.com/microsoft/pylance-release/issues/7242](https://github.com/microsoft/pylance-release/issues/7242)

My fix has been shared in the VSCode extension issue, and the developers are likely to implement a more comprehensive solution in future releases, eliminating the need for this workaround.
