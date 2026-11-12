# Security

## What the scanner does

`handfeel scan` reads source files under the folder you pass it and prints a report. It does not open network connections, does not call any AI service, does not execute or import the code it scans, and writes nothing to disk. `handfeel init cursor` writes one file, `.cursor/rules/handfeel.mdc`, and only overwrites it with `--force`.

The agent skill (`skills/handfeel/`) is a set of Markdown instructions. What it changes in your project is done by your coding agent, under that agent's permissions.

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting: open the [Security tab](https://github.com/maximilianfeix/handfeel/security) and choose "Report a vulnerability". Don't open a public issue for it.

Include the handfeel version (`npx handfeel --version`), the command you ran, and a minimal file or project that shows the problem.

## Supported versions

Fixes go into the latest release only.
