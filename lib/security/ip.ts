import { isIP } from "node:net";

/**
 * Returns true when an IP address must never be contacted by the server:
 * loopback, private, link-local (incl. cloud metadata 169.254.169.254),
 * CGNAT, multicast, reserved, documentation ranges, IPv4-mapped IPv6 etc.
 * Unknown / unparsable input is treated as private (fail closed).
 */
export function isPrivateIp(address: string): boolean {
  const ip = address.trim().replace(/^\[|\]$/g, "").split("%")[0] ?? "";
  const version = isIP(ip);
  if (version === 4) return isPrivateIPv4(ip);
  if (version === 6) return isPrivateIPv6(ip);
  return true;
}

function ipv4ToInt(ip: string): number {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
}

const V4_BLOCKS: Array<[string, number]> = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
];

function isPrivateIPv4(ip: string): boolean {
  const value = ipv4ToInt(ip);
  return V4_BLOCKS.some(([base, bits]) => {
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (value & mask) === (ipv4ToInt(base) & mask);
  });
}

/** Expand an IPv6 address into 8 hextets (numbers). Supports embedded IPv4. */
function expandIPv6(ip: string): number[] | null {
  let addr = ip.toLowerCase();
  const v4Match = addr.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (v4Match?.[1]) {
    const n = ipv4ToInt(v4Match[1]);
    addr = addr.replace(v4Match[1], `${((n >>> 16) & 0xffff).toString(16)}:${(n & 0xffff).toString(16)}`);
  }
  const [head, tail] = addr.split("::");
  const headParts = head ? head.split(":") : [];
  const tailParts = tail !== undefined && tail !== "" ? tail.split(":") : [];
  if (addr.includes("::")) {
    const fill = 8 - headParts.length - tailParts.length;
    if (fill < 0) return null;
    const parts = [...headParts, ...Array<string>(fill).fill("0"), ...tailParts];
    return parts.map((p) => parseInt(p, 16));
  }
  if (headParts.length !== 8) return null;
  return headParts.map((p) => parseInt(p, 16));
}

function isPrivateIPv6(ip: string): boolean {
  const h = expandIPv6(ip);
  if (!h || h.some((x) => Number.isNaN(x))) return true;
  const [a = 0, b = 0, c = 0, d = 0, e = 0, f = 0, g = 0, last = 0] = h;
  const allZeroPrefix = a === 0 && b === 0 && c === 0 && d === 0 && e === 0;
  // :: and ::1
  if (allZeroPrefix && f === 0 && g === 0 && (last === 0 || last === 1)) return true;
  // IPv4-mapped ::ffff:a.b.c.d and IPv4-compatible ::a.b.c.d
  if (allZeroPrefix && (f === 0xffff || f === 0)) {
    return isPrivateIPv4(`${g >> 8}.${g & 0xff}.${last >> 8}.${last & 0xff}`);
  }
  // NAT64 64:ff9b::/96
  if (a === 0x64 && b === 0xff9b && c === 0 && d === 0 && e === 0 && f === 0) {
    return isPrivateIPv4(`${g >> 8}.${g & 0xff}.${last >> 8}.${last & 0xff}`);
  }
  if ((a & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((a & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((a & 0xffc0) === 0xfec0) return true; // fec0::/10 site-local (deprecated)
  if ((a & 0xff00) === 0xff00) return true; // ff00::/8 multicast
  if (a === 0x2001 && b === 0x0db8) return true; // documentation
  if (a === 0x0100 && b === 0 && c === 0 && d === 0) return true; // discard-only
  if (a === 0x2002) {
    // 6to4 — embedded IPv4 in hextets 2-3
    return isPrivateIPv4(`${b >> 8}.${b & 0xff}.${c >> 8}.${c & 0xff}`);
  }
  return false;
}
