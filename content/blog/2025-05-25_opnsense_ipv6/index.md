---
title: "Setting up DHCPv6 with Dnsmasq and ULA Addresses in OPNsense 25.1"
date: 2025-05-25T16:45:00+02:00
draft: false
language: en
summary: "A guide to configuring DHCPv6 in OPNsense 25.1 using Dnsmasq, including the integration of Unique Local Addresses (ULA) for your local network."
description: "This step-by-step guide shows how to set up DHCPv6 on your OPNsense 25.1 firewall with Dnsmasq as the DHCP server, and additionally configure ULA prefixes for improved local addressing."
author: "raydak"
tags: [
    "OPNsense",
    "IPv6",
    "DHCPv6",
    "Dnsmasq",
    "ULA",
    "Networking"
]
categories: [
    "Tutorials",
    "Network Engineering"
]
---

With OPNsense 25.1, Dnsmasq is increasingly becoming the focus for DHCP services and Router Advertisements [1]. This guide will walk you through setting up DHCPv6 with Dnsmasq and additionally configuring Unique Local Addresses (ULA) for your LAN. ULA addresses provide stable, internal IPv6 addresses, independent of your internet provider.

## Prerequisites

Ensure that your WAN and LAN interfaces are basically configured in OPNsense.

## 1. Configure WAN Interface for DHCPv6

First, we configure the WAN interface to obtain an IPv6 prefix from your provider.

*   Navigate to `Interfaces > [WAN]`.
*   Set the **IPv6 Configuration Type** to `DHCPv6`.
*   In the **DHCPv6 client configuration** section:
    *   Enable the option **Request only an IPv6 prefix** [2]. This is crucial for OPNsense to act as a router and receive a delegated prefix.
    *   Enable the option **Send IPv6 prefix hint** [2].
    *   Set the **Prefix delegation size** to the value supported by your provider, e.g., `56`.

Save the changes.

## 2. Prepare LAN Interface for IPv6

Now, we configure the LAN interface to use the prefix from the WAN interface.

*   Navigate to `Interfaces > [LAN]`.
*   Set the **IPv6 Configuration Type** to `Track Interface` [5].
*   Under **IPv6 Track Interface**:
    *   Select your WAN interface as the **IPv6 Interface**.
    *   Enter an **IPv6 Prefix ID** (e.g., `0` for the first network).
*   **Important**: Enable the option **Allow manual adjustment of DHCPv6 and Router Advertisements** [5]. This setting prevents OPNsense from automatically starting DHCPv6 services and Router Advertisements for this interface, allowing Dnsmasq to handle these tasks.

Save the changes.

## 3. Adjust Default Services

After enabling "Allow manual adjustment" on the LAN interface, you need to ensure that the default IPv6 services for this interface are disabled, as Dnsmasq will take over their functions.

*   Navigate to `Services > DHCPv6 > [LAN]`. Ensure that the DHCPv6 server for this interface is **not** enabled. The ISC DHCPv6 service should not run in parallel with Dnsmasq for the same interface [4].
*   Navigate to `Services > Router Advertisements > [LAN]`. Ensure that the Router Advertisement service (radvd) for this interface is also **disabled**.

## 4. Configure Dnsmasq for DHCPv6 and Router Advertisements

Now we configure Dnsmasq to assign IPv6 addresses and send Router Advertisement messages.

*   Navigate to `Services > Dnsmasq > Settings`.
*   Scroll to the section for your LAN interface.
*   Configure the **DHCPv6 Range**:
    *   **Range start for IPv6 DHCP leases**: Enter the suffix part, e.g., `::100`. OPNsense will automatically complete this with the dynamically obtained prefix [2].
    *   **Range end for IPv6 DHCP leases**: Enter the suffix part, e.g., `::200`.
*   Configure the **Router Advertisements**:
    *   **Router Advertisement**: Select `SLAAC` or another mode according to your requirements (e.g., `Assisted` for SLAAC and DHCPv6 addresses).
    *   **Router Priority**: Usually `Normal`.
    *   **RA Flags**: Enable `ra-names` (or a similar option that provides DNS server information via RA, like "Announce DNS servers"). If necessary, consult the OPNsense documentation on Dnsmasq [4].

Save the changes.

## 5. Create Virtual IP (VIP) for ULA Address

To use Unique Local Addresses (ULA) in your LAN in addition to global addresses (GUA), create a virtual IP address.

*   Navigate to `Interfaces > Virtual IPs > Settings`.
*   Click on **Add**.
*   Configure the VIP:
    *   **Mode**: `IP Alias`.
    *   **Interface**: Select your LAN interface.
    *   **Address**: Enter a ULA IPv6 address for your OPNsense LAN interface, followed by the prefix length `/64`.
        *   You can create a ULA prefix (usually a /48) with an online generator (e.g., `cd34.com/rfc4193`), which uses a random MAC address as input.
        *   Select a /64 subnet from this /48 prefix (e.g., the first one by setting the subnet ID to `0`).
        *   Assign a specific IP within this /64 network to your OPNsense LAN interface (e.g., `::4`).
        *   Example: `fdf3:b4a0:cc65:0::4/64` [3].
    *   **Description**: Enter a meaningful description (e.g., "ULA LAN Interface").

Save the VIP and apply the changes. Dnsmasq should also announce this ULA prefix via Router Advertisement if configured correctly (often automatically if the RA function for the interface is active and the VIP exists).

## 6. Finalization and Verification

*   Carefully save all configurations made.
*   To ensure all changes take effect, restart the affected services (Dnsmasq, reinitialize network interfaces if necessary) or reboot your OPNsense firewall.
*   On your client devices in the LAN, check if they receive both a global IPv6 address (from your provider prefix) and a ULA IPv6 address, and can correctly access the internet and local resources. DNS resolution via IPv6 should also work.

With these steps, you have configured DHCPv6 and Router Advertisements via Dnsmasq and additionally set up ULA addresses for more robust and flexible internal IPv6 addressing in your OPNsense network.
