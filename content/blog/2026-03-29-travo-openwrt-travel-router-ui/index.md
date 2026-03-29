---
title: "Travo: A Modern Web UI for OpenWrt Travel Routers"
date: 2026-03-29T12:00:00+01:00
draft: false
language: en
featured_image: images/pages/blog/travo/logo.webp
summary: Travo is an open-source, mobile-first dashboard for OpenWrt travel routers—WiFi, captive portals, VPN, AdGuard Home, and system settings—built as a Go and React monorepo alongside LuCI.
description: "Introducing Travo (raydak-labs/travo): a Go + Fiber backend and React SPA for GL.iNet-style travel routers on OpenWrt 23.05+, with one-line install, LuCI coexistence, and links to the repository and releases."
author: raydak
tags: [
    "OpenWrt",
    "Travel Router",
    "Travo",
    "Self-Hosted",
    "Go",
    "React",
    "Networking"
]
categories: [
    "Projects",
    "Networking"
]
---

## What it is

[Travo](https://github.com/raydak-labs/travo) is a web interface for OpenWrt on compact travel routers—think GL.iNet Beryl AX (MT3000), Slate AXT1800, or any recent aarch64 or x86_64 OpenWrt 23.05+ image. The goal is a **phone-friendly** control surface for the things you actually touch on the road: WiFi, hotel captive portals, upstream connectivity, VPN, DNS filtering, and a few system knobs—without replacing LuCI for deep dives.

The stack is deliberately boring in a good way: a **React** single-page app (Vite, TanStack Query/Router, shared TypeScript types in a small `shared/` package) talking to a **Go** API built with **Fiber**. The backend shells out to OpenWrt primitives—UCI, ubus, package management—so behavior stays aligned with how the device is meant to be administered.

## Why a separate UI

LuCI remains the reference admin UI for OpenWrt, but on a small screen or when you only need “connect this repeater” or “turn on WireGuard,” a focused dashboard is easier. Travo is designed to **coexist** with LuCI: after the bundled install path, Travo can listen on port 80 while LuCI is moved to another port (for example 8080), and optional components such as AdGuard Home get predictable ports documented in the project README.

## Features at a glance

- **Dashboard** — live stats and quick actions  
- **WiFi** — scan, connect, and mode switching (client, repeater, AP), with attention to apply flows that match OpenWrt’s rollback-safe patterns where wireless is involved  
- **Captive portals** — detection and streamlined hotel login flows  
- **VPN** — WireGuard and Tailscale-oriented workflows  
- **Services** — install and manage add-ons such as **AdGuard Home** from the same UI  
- **System** — network, DNS, and firewall-oriented settings exposed where the project supports them  
- **Theming** — light/dark, mobile-first layout  

For the authoritative, always-up-to-date list, see the [repository README](https://github.com/raydak-labs/travo/blob/main/README.md) and the requirements docs in the same tree.

## Try it on a router

The project publishes a **one-line installer**. SSH to the router and run:

```sh
wget -O- https://raw.githubusercontent.com/raydak-labs/travo/main/scripts/install.sh | sh
```

That sets up Travo, relocates LuCI as described in the README, and wires AdGuard Home with the documented ports. **Change default credentials** for any bundled service immediately after install.

Pre-built **binaries and `.ipk` packages** for aarch64 and x86_64 land on [GitHub Releases](https://github.com/raydak-labs/travo/releases) when maintainers tag a version.

## Hack on it locally

If you want to contribute or extend the UI:

1. Clone [https://github.com/raydak-labs/travo](https://github.com/raydak-labs/travo).  
2. Install Node (≥ 20), pnpm (≥ 9), and Go (≥ 1.23) as documented in the README.  
3. `pnpm install`, `cd backend && go mod tidy`, then `make dev` for the dev servers.  
4. Use `make test`, `make lint`, and `make build` before opening a PR (see `CONTRIBUTING.md` in the repo).

Docker Compose is also available for a containerized dev loop.

## Links

- **Source and issues:** [github.com/raydak-labs/travo](https://github.com/raydak-labs/travo)  
- **Releases:** [github.com/raydak-labs/travo/releases](https://github.com/raydak-labs/travo/releases)  
- **License:** MIT (see `LICENSE` in the repository)  

Travo is actively developed; treat this post as an orientation piece and rely on the GitHub README and deployment notes for port numbers, install flags, and security reminders.
