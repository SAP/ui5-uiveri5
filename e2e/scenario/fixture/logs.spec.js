describe('logs', function() {
    it('show page', function() {
        expect(browser.getTitle()).toBe('E2E Test');
        browser.executeScript(function () {
            console.error("Error-browserLogsScenarioTest");
            console.warn("Warning-browserLogsScenarioTest");
            console.log("Log-browserLogsScenarioTest");
            console.info("Info-browserLogsScenarioTest");
            console.debug("Debug-browserLogsScenarioTest");
            console.trace("Trace-browserLogsScenarioTest");
        });
    })
});
