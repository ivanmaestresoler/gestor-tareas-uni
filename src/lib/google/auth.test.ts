import { describe, expect, it } from "vitest";
import { emailFromIdToken } from "./auth";

const encode = (obj: object) => Buffer.from(JSON.stringify(obj)).toString("base64url");

describe("emailFromIdToken", () => {
  it("lee el email del token aunque la fecha de emisión sea 'futura'", () => {
    const token = `${encode({ alg: "RS256" })}.${encode({ email: "yo@example.com", iat: 9999999999 })}.firma`;
    expect(emailFromIdToken(token)).toBe("yo@example.com");
  });

  it("devuelve cadena vacía si el token está mal formado", () => {
    expect(emailFromIdToken("basura")).toBe("");
  });
});
