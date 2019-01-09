module.exports = function () {
    this.aLogs = [];
    this.fnOriginalLog = console.log;

    this.start = function (sLogMatch) {
        var that = this;
        console.log = function (sLog) {
            if (sLog.match(sLogMatch)) {
                that.aLogs.push(sLog);
            }
            return that.fnOriginalLog.apply(this, arguments);
        }
    };
    this.stop = function () {
        console.log = this.fnOriginalLog;
    };
}
