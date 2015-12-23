const util = require("util");
const EventEmitter = require("events").EventEmitter;
var Fifo = require('fifo');

function Limiter(rate) {
    EventEmitter.call(this);
    this.jobs = Fifo();
    this.rate = rate;
    this.beforePauseRate = rate;
    this.inProg = 0;
}

util.inherits(Limiter, EventEmitter)

Limiter.prototype.emitJob = function(job) {
    var self = this;
    this.emit('data', job, function() {
        self.inProg--;
        self.checkForWork();
    });
};

Limiter.prototype.checkForWork = function() {
    while (this.inProg < this.rate && this.jobs.length > 0) {
        var job = this.jobs.shift();
        this.inProg++;
        this.emitJob(job);
    }
}

Limiter.prototype.push = function(job) {
    if (this.inProg < this.rate) {
        this.inProg++;
        var self = this;
        this.emitJob(job);
    } else {
        this.jobs.push(job);
    }
};

Limiter.prototype.pause = function() {
    this.beforePauseRate = this.rate;
    this.rate = 0;
};

Limiter.prototype.resume = function() {
    this.rate = this.beforePauseRate;
    this.checkForWork();
};

Limiter.prototype.relax = function(howMuch) {
    this.rate -= howMuch;
    if (this.rate <= 0) {
        this.rate = 0;
        this.emit("choked");
    }
};

Limiter.prototype.hurry = function(howMuch) {
    this.rate += howMuch;
    this.checkForWork();
};

module.exports = Limiter;
