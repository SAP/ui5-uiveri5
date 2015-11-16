
describe("StatisticCollector", function() {
  var reporter;

  beforeEach(function(){
    reporter = require('../src/statisticCollector')();
  });

  it("Should compute overall statistic", function() {

    // simulate jasmine-core calling our reporter
    reporter.jasmineStarted();
    reporter.suiteStarted({description: 'Enabled suite'});
    reporter.specStarted({fullName: 'should pass'});
    reporter.specDone({
      status: 'passed',
      passedExpectations:[{
        status: 'passed',
        matcher: 'toBe'
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
        matcher: 'toBe',
        stack: 'stack'
      },{
        status: 'failed',
        message: 'image diff',
        matcher: 'toLookAs',
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

});
