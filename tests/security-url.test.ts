import { describe, expect, it } from "vitest";
import { isPrivateIp } from "@/lib/security/ip";
import { isBlockedHostname, parsePublicHttpUrl } from "@/lib/security/url";
import { getClientKey } from "@/lib/security/client-ip";

describe("isPrivateIp", () => {
  it.each(["127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "224.0.0.1", "::1", "::", "fe80::1", "fc00::1", "fd12:3456::1", "::ffff:127.0.0.1", "::ffff:7f00:1", "64:ff9b::a9fe:a9fe", "2002:c0a8:0101::1", "not-an-ip"])(
    "%s is private/blocked",
    (ip) => expect(isPrivateIp(ip)).toBe(true),
  );
  it.each(["8.8.8.8", "1.1.1.1", "172.32.0.1", "142.250.190.78", "2606:4700:4700::1111"])("%s is public", (ip) => expect(isPrivateIp(ip)).toBe(false));
});

describe("parsePublicHttpUrl", () => {
  it("accepts normal public URLs", () => {
    expect(parsePublicHttpUrl("https://bit.ly/abc")?.hostname).toBe("bit.ly");
  });
  it.each([
    "javascript:alert(1)",
    "file:///etc/passwd",
    "ftp://example.com/x",
    "http://localhost:3000/",
    "http://127.0.0.1/",
    "http://2130706433/", // decimal 127.0.0.1
    "http://0x7f.1/",
    "http://[::1]/",
    "http://169.254.169.254/latest/meta-data",
    "http://metadata.google.internal/",
    "http://service.railway.internal/",
    "http://router/",
    "https://user:pass@example.com/",
    "https://example.com:8080/",
    "https://exa mple.com/",
  ])("rejects %s", (u) => expect(parsePublicHttpUrl(u)).toBeNull());
  it("blocks internal hostnames", () => {
    expect(isBlockedHostname("printer.local")).toBe(true);
    expect(isBlockedHostname("example.com")).toBe(false);
  });
});

describe("getClientKey", () => {
  const h = (o: Record<string, string>) => new Headers(o);
  it("ignores forwarding headers unless explicitly trusted", () => {
    expect(getClientKey(h({ "x-forwarded-for": "1.2.3.4" }), undefined)).toBe("global");
  });
  it("uses the right-most X-Forwarded-For entry (added by the trusted proxy)", () => {
    expect(getClientKey(h({ "x-forwarded-for": "6.6.6.6, 9.9.9.9" }), "x-forwarded-for")).toBe("9.9.9.9");
  });
  it("validates header values", () => {
    expect(getClientKey(h({ "x-real-ip": "<script>" }), "x-real-ip")).toBe("global");
    expect(getClientKey(h({ "x-real-ip": "5.6.7.8:443" }), "x-real-ip")).toBe("5.6.7.8");
  });
});
