// Lets the verification harnesses through the resume's pre-publication gate.
//
// The gate is a real server-side redirect, so without this the harnesses would
// verify the unlock curtain instead of the resume and report a green matrix
// for a page they never loaded.
//
// The cookie is obtained by actually submitting the unlock form, not by
// hand-crafting the cookie: that way the harness exercises the same path a
// visitor does, and a broken unlock flow fails verification instead of being
// quietly bypassed.

const PASSCODE = process.env.RESUME_PASSCODE ?? "0315";

/**
 * Submit the unlock form and return the resulting cookies, ready for
 * `context.addCookies()`. Returns [] when the resume isn't gated.
 */
export async function resumeAccessCookies(baseUrl, browser) {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    const response = await page.goto(`${baseUrl}/resume`, {
      waitUntil: "domcontentloaded",
    });

    // Not gated (or already open) — nothing to do.
    if (!page.url().includes("/resume/unlock")) {
      if (response && response.status() >= 400) {
        throw new Error(
          `resume-gate: ${baseUrl}/resume returned ${response.status()}`,
        );
      }
      return [];
    }

    await page.fill("#passcode", PASSCODE);
    // Click first, then wait. Racing the two with Promise.all aborts the
    // form's own navigation.
    await page.click(".resume-unlock-submit");
    await page.waitForURL((url) => !url.pathname.startsWith("/resume/unlock"), {
      timeout: 15000,
      waitUntil: "domcontentloaded",
    });

    const cookies = await context.cookies();
    const access = cookies.filter((c) => c.name === "z_resume_access");
    if (!access.length) {
      throw new Error(
        "resume-gate: unlock form accepted but set no access cookie",
      );
    }
    return access;
  } finally {
    await context.close();
  }
}
