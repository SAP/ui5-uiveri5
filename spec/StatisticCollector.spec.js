describe("StatisticCollector", function() {
  var reporter = require('../src/statisticCollector');

  beforeEach(function(){
    reporter.reset();
  });

  describe("getOverview", function () {
    it("Should compute overall statistic", function() {
      // simulate jasmine-core calling our reporter
      reporter.jasmineStarted();
      reporter.suiteStarted({description: 'Enabled suite'});
      reporter.specStarted({fullName: 'should pass'});
      reporter.specDone({
        status: 'passed',
        passedExpectations:[{
          status: 'passed',
          matcherName: 'toBe'
        }],
        failedExpectations:[]
      });
      reporter.specStarted({fullName: 'should fail'});
      reporter.specDone({
        status: 'failed',
        passedExpectations:[],
        failedExpectations:[{
          status: 'failed',
          message: 'message',
          matcherName: 'toBe',
          stack: 'stack'
        },{
          status: 'failed',
          message: JSON.stringify({
            message: 'image diff',
            imageName: 'expectedImageName',
            failureType: 'COMPARISON'
          }),
          matcherName: 'toLookAs',
          stack: 'stack'
        }]
      });
      reporter.specStarted({fullName: 'should be pending'});
      reporter.specDone({
        status: 'pending',
        passedExpectations:[],
        failedExpectations:[]
      });
      reporter.suiteDone();
      reporter.suiteStarted({description: 'Disabled suite'});
      reporter.specStarted({fullName: 'should be disabled'});
      reporter.specDone({
        status: 'disabled',
        passedExpectations:[],
        failedExpectations:[]
      });
      reporter.suiteDone();
      reporter.jasmineDone();

      // validate stats
      var overview = reporter.getOverview();
      expect(overview.statistic.suites.total).toBe(2);
      expect(overview.statistic.suites.passed).toBe(1);
      expect(overview.statistic.suites.failed).toBe(1);

      expect(overview.statistic.specs.total).toBe(4);
      expect(overview.statistic.specs.passed).toBe(1);
      expect(overview.statistic.specs.failed).toBe(1);
      expect(overview.statistic.specs.pending).toBe(1);
      expect(overview.statistic.specs.disabled).toBe(1);

      expect(overview.statistic.expectations.total).toBe(3);
      expect(overview.statistic.expectations.passed).toBe(1);
      expect(overview.statistic.expectations.failed.total).toBe(2);
      expect(overview.statistic.expectations.failed.error).toBe(1);
      expect(overview.statistic.expectations.failed.image).toBe(1);
    });

    it("Should handle failed expectation details", function() {
      reporter.jasmineStarted();
      reporter.suiteStarted({description: 'Enabled suite'});
      reporter.specStarted({fullName: 'should fail'});
      reporter.specDone({
        status: 'failed',
        passedExpectations:[],
        failedExpectations:[{
          status: 'failed',
          message: JSON.stringify({
            message: 'message',
            details:{
              key:'value'
            },
            imageName: 'expectedImageName',
            failureType: 'COMPARISON'
          }),
          matcherName: 'toLookAs',
          stack: 'stack'
        }]
      });
      reporter.suiteDone();
      reporter.jasmineDone();

      // validate
      var overview = reporter.getOverview();
      var failedExpectation = overview.suites[0].specs[0].expectations[0];
      expect(failedExpectation.message).toBe('message');
      expect(failedExpectation.details.key).toBe('value');
      expect(failedExpectation.imageName).toBe('expectedImageName');
      expect(failedExpectation.failureType).toBe('COMPARISON');
    });

    it("Should handle passed expectation details", function() {
      reporter.jasmineStarted();
      reporter.suiteStarted({description: 'Enabled suite'});
      reporter.specStarted({fullName: 'should pass'});
      reporter.specDone({
        status: 'passed',
        passedExpectations:[{
          status: 'passed',
          matcherName: 'toBe',
          passed: {
            message: JSON.stringify({message: 'fine',details: 'url', imageName: 'expectedImageName'})
          }
        }],
        failedExpectations:[]
      });
      reporter.suiteDone();
      reporter.jasmineDone();

      // validate
      var overview = reporter.getOverview();
      var passedExpectation = overview.suites[0].specs[0].expectations[0];
      expect(passedExpectation.message).toBe('fine');
      expect(passedExpectation.details).toBe('url');
      expect(passedExpectation.imageName).toBe('expectedImageName');
    });
  });

  describe('collectActions', function () {
    it('Should collect actions', function () {
      var clickAction = {name: 'click', elementId: 'id', screenshot: 'click_id_1'};
      var sendKeysAction = {name: 'sendKeys', value: 'keys', elementId: 'id', screenshot: 'sendKeys_id_2'};
      reporter.jasmineStarted();
      reporter.suiteStarted({description: 'Enabled suite'});
      reporter.specStarted({fullName: 'should pass'});
      reporter.collectAction(clickAction);
      reporter.collectAction(sendKeysAction);
      reporter.specDone({
        status: 'passed',
        passedExpectations:[{
          status: 'passed'
        }],
        failedExpectations:[]
      });
      reporter.suiteDone();
      reporter.jasmineDone();

      // validate
      var overview = reporter.getOverview();
      var specActions = overview.suites[0].specs[0].actions;
      expect(specActions[0]).toBe(clickAction);
      expect(specActions[1]).toBe(sendKeysAction);
    });

    it('Should collect actions only if spec is started', function () {
      reporter.jasmineStarted();
      reporter.suiteStarted({description: 'Enabled suite'});
      reporter.collectAction({name: 'click'});
      reporter.suiteDone();
      reporter.jasmineDone();

      //validate
      var overview = reporter.getOverview();
      expect(overview.suites[0].specs.length).toBeFalsy();
    });

    it('Should collect authentication actions with hidden values', function () {
      reporter.jasmineStarted();
      reporter.suiteStarted({description: 'Enabled suite'});
      reporter.authStarted();
      reporter.collectAction({name: 'sendKeys', value: 'password'});
      reporter.authDone();
      reporter.suiteDone();
      reporter.jasmineDone();

      //validate
      var overview = reporter.getOverview();
      var authSpec = overview.suites[0].specs[0];
      expect(authSpec.name).toBe('Authentication');
      expect(authSpec.status).toBe('passed');
      expect(authSpec.meta.isAuthentication).toBeTruthy();
      expect(authSpec.actions.length).toBe(1);
      expect(authSpec.actions[0].name).toBe('sendKeys');
      expect(authSpec.actions[0].value).toBeFalsy();
    });
  });

  describe('collectSteps', function () {
    it('Should collect step sequence', function () {
      reporter.jasmineStarted();
      reporter.suiteStarted({description: 'Enabled suite'});
      reporter.specStarted({description: 'should pass'});
      reporter.authStarted();
      reporter.collectAction({name: 'click', stepIndex: 0, screenshot: 'click_0'});
      reporter.authDone();
      reporter.collectAction({name: 'click', stepIndex: 0, screenshot: 'click_0'});
      reporter.collectAction({name: 'click', stepIndex: 2, screenshot: 'click_2'});
      reporter.specDone({
        status: 'passed',
        passedExpectations:[{
          stepIndex: 1,
          screenshot: 'expect_1'
        }],
        failedExpectations:[{
          stepIndex: 3,
          message: 'message',
          screenshot: 'expect_3'
        }]
      });
      reporter.suiteDone();
      reporter.jasmineDone();

      // validate
      var overview = reporter.getOverview();
      var auth = overview.suites[0].specs[0];
      var spec = overview.suites[0].specs[1];
      expect(auth.stepSequence).toEqual(['actions']);
      expect(spec.stepSequence).toEqual(['actions', 'expectations', 'actions', 'expectations']);
      expect(auth.actions[0].screenshot).toBe('click_0');
      expect(spec.actions[0].screenshot).toBe('click_0');
      expect(spec.actions[1].screenshot).toBe('click_2');
      expect(spec.expectations[0].screenshot).toBe('expect_3');
      expect(spec.expectations[1].screenshot).toBe('expect_1');
    });
  });
});
