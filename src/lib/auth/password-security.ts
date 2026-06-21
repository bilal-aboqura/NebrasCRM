import { createHash } from "node:crypto";

export const PASSWORD_ERROR = "يجب أن تكون كلمة المرور مكونة من 12 خانة على الأقل ولم تظهر في تسريبات البيانات السابقة.";

export async function isBreachedPassword(password: string, fetcher: typeof fetch = fetch) {
  const digest = createHash("sha1").update(password).digest("hex").toUpperCase();
  const prefix = digest.slice(0, 5);
  const suffix = digest.slice(5);
  const response = await fetcher(`https://api.pwnedpasswords.com/range/${prefix}`, {
    headers: { "Add-Padding": "true", "User-Agent": "NebrasCRM-Password-Check" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("تعذر التحقق من أمان كلمة المرور حالياً. حاول مرة أخرى لاحقاً.");
  const matches = (await response.text()).split(/\r?\n/).some((line) => line.split(":", 1)[0] === suffix);
  return matches;
}

export async function validatePassword(password: string, fetcher: typeof fetch = fetch) {
  if (password.length < 12 || await isBreachedPassword(password, fetcher)) throw new Error(PASSWORD_ERROR);
}

