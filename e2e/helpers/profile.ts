/**
 * Profile view helpers.
 */
/// <reference types="@wdio/globals/types" />

/**
 * Triggers report calculation in the Profile view.
 */
export async function calculateReport(): Promise<void> {
    const btn = await $('#profile-btn-calculate-report');
    await btn.waitForDisplayed({ timeout: 5000 });
    await btn.click();
    
    // Wait for the success alert (modal-overlay + modal-content)
    const overlay = await $('.modal-overlay');
    await overlay.waitForDisplayed({ timeout: 10000 });
    
    const title = await overlay.$('h3');
    expect(await title.getText()).toBe('Success');
    
    const text = await overlay.$('p');
    console.log(`[E2E-TRACE] calculateReport: ${await text.getText()}`);
    
    // Close it
    const okBtn = await overlay.$('#alert-ok');
    await okBtn.click();
    await browser.pause(300);
}
