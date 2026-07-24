import { test as base, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const coverageDir = path.join(process.cwd(), '.nyc_output_raw');

export const test = base.extend({
    page: async ({ page }, use, testInfo) => {
        await use(page);

        const coverage = await page.evaluate(() => (window as any).__coverage__).catch(() => null);
        if (coverage) {
            fs.mkdirSync(coverageDir, { recursive: true });
            const fileName = `${testInfo.testId}-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
            fs.writeFileSync(path.join(coverageDir, fileName), JSON.stringify(coverage));
        }
    },
});

export { expect };
export type { Page, Locator, APIRequestContext } from '@playwright/test';
