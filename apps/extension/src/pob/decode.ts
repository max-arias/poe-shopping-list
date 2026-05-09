import { decodePob } from "@max-arias/pob-codec";

export function decodePobXml(code: string): string {
  return decodePob(code, { validateXml: true });
}
