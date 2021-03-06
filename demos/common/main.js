
require("!style!css!less!./style.less");


var React = require("react");
var _ = require("lodash");

import { timeStrToMinutes, minutesToStr } from '../../src/functions/time-functions';
import { TimeBar } from '../../src/component';

require("./visualizer");

function roundToHalfHours(timeStr) {
    var minutes = timeStrToMinutes(timeStr);
    var rounded =  30 * Math.round(minutes / 30);
    return minutesToStr(rounded);
}

function subTimes(time1, time0) {
    var minutes0 = timeStrToMinutes(time0);
    var minutes1 = timeStrToMinutes(time1);
    return minutes1 - minutes0;
}

function addMinutes(timeStr, deltaMinutes) {
    var minutes = timeStrToMinutes(timeStr);
    return minutesToStr(minutes + deltaMinutes);
}

var intervals = [
    { id: 0, from: "10:00", to: "11:00", className:"highlighted" },
    { id: 1, from: "12:00", to: "15:00" }
];

function updateStart(intervalId, time) {
    var interval = _.find(intervals, i => i.id === intervalId);
    var intervalBefore = _.find(intervals, (__, index) => index === (intervals.length - 1) ? false : intervals[index+1].id === intervalId);
    var maxTime = addMinutes(interval.to, -30);
    var minTime = intervalBefore ? intervalBefore.to : "8:00";

    var rounded = roundToHalfHours(time);
    var timeInMinutes = timeStrToMinutes(rounded);
    var newTime = timeInMinutes > timeStrToMinutes(maxTime) ? maxTime :
                  timeInMinutes < timeStrToMinutes(minTime) ? minTime :
                  rounded;

    interval.from = newTime;

    refresh();
}

function updateEnd(intervalId, time) {
    var interval = _.find(intervals, i => i.id === intervalId);
    var nextInterval = _.find(intervals, (__, index) => index === 0 ? false : intervals[index-1].id === intervalId);
    var minTime = addMinutes(interval.from, 30);;
    var maxTime = nextInterval ? nextInterval.from : "18:00";

    var rounded = roundToHalfHours(time);
    var timeInMinutes = timeStrToMinutes(rounded);
    var newTime = timeInMinutes > timeStrToMinutes(maxTime) ? maxTime :
                  timeInMinutes < timeStrToMinutes(minTime) ? minTime :
                  rounded;

    interval.to = newTime;

    refresh();
}

function onIntervalClick(intervalId, e) {
    var interval = _.find(intervals, i => i.id === intervalId);
    if (interval.className) {
        delete interval.className;
    } else {
        interval.className = "highlighted";
    }
    refresh();
}

function onIntervalDrag(intervalId, newIntervalStart) {
    var interval = _.find(intervals, i => i.id === intervalId);
    var intervalBefore = _.find(intervals, (__, index) => index === (intervals.length - 1) ? false : intervals[index+1].id === intervalId);
    var nextInterval = _.find(intervals, (__, index) => index === 0 ? false : intervals[index-1].id === intervalId);
    var minTime = intervalBefore ? intervalBefore.to : "8:00";
    var maxEndTime = nextInterval ? nextInterval.from : "18:00";
    var intervalDuration = subTimes(interval.to, interval.from);
    var maxTime = addMinutes(maxEndTime, -intervalDuration);

    var rounded = roundToHalfHours(newIntervalStart);
    var timeInMinutes = timeStrToMinutes(rounded);
    var newIntervalStartBounded = timeInMinutes > timeStrToMinutes(maxTime) ? maxTime :
                                  timeInMinutes < timeStrToMinutes(minTime) ? minTime :
                                  rounded;

    var delta = subTimes(newIntervalStartBounded, interval.from);
    interval.to = addMinutes(interval.to, delta);
    interval.from = newIntervalStartBounded;
    refresh();
}

var toggleFlag = false;
function modifyLength() {
    intervals[0].to = addMinutes(intervals[0].to, toggleFlag ? 30 : -30);
    toggleFlag = !toggleFlag;
    refresh();
}

var int1 = null;
function toggleLenghChanger() {
    if (int1) {
        clearInterval(int1);
        int1 = 0;
    } else {
        int1 = setInterval(modifyLength, 1000);
    }
}
window.document.getElementById("run-size").addEventListener("click",  toggleLenghChanger);

window.document.getElementById("run-remove").addEventListener("click", function() {
    setTimeout(function() {
        intervals.splice(0, 1);
        refresh();
    }, 2000);
});

function removeInterval(id) {
    for (var i = 0, interval; interval = intervals[i]; i++) {
        if (interval.id === id) {
            intervals.splice(i, 1);
            break;
        }
    }
    refresh();
}

function blockEvent(e) {
    e.stopPropagation();
}

function intervalContentGen(interval) {
    var fn = function(e) {
        e.preventDefault();
        e.stopPropagation();
        removeInterval(interval.id);
    };
    var removeButton = (<a className="remove-button"
                           onClick={fn}
                           onMouseDown={blockEvent}>[x]</a>);
    return <span className="interval-content">{interval.from + " - " + interval.to} {removeButton}</span>;
}

function genNewInterval(bounds) {
    var intervalWithHighestId = _.max(intervals, i => i.id);
    var newId = intervalWithHighestId ? intervalWithHighestId.id + 1 : 0;
    var newInterval = { id: newId, from: bounds.from, to: bounds.to };
    var index = 0;
    for (var interval; interval = intervals[index]; index++) {
        if (timeStrToMinutes(interval.from) > timeStrToMinutes(newInterval.from))
            break;
    }
    intervals.splice(index, 0, newInterval);
    refresh();
}

function refresh() {

    window.document.getElementById("intervals").innerText = JSON.stringify(intervals, null, "\t");

    React.render(
        <TimeBar min={"8:00"}
                 max={"18:00"}
                 width={800}
                 intervals={intervals}
                 onStartChange={updateStart}
                 onEndChange={updateEnd}
                 onIntervalClick={onIntervalClick}
                 onIntervalDrag={onIntervalDrag}
                 onIntervalNew={genNewInterval}
                 intervalContentGenerator={intervalContentGen} />,
        window.document.getElementById("container")
    );
}

refresh();
