// Please see documentation at https://docs.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your Javascript code.

const COLOUR_FIRST_JAB = 'rgb(28 156 146)';
const COLOUR_SECOND_JAB = '#f62aa0';
const COLOUR_TARGET = '#b8ee30';

$.getJSON('json/overview_2021-01-09.json', (json) => {
    debugger;
});

var data = [
    {"date":"2020-12-20","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleReceivingFirstDose":650714,"cumPeopleReceivingSecondDose":0},
    {"date":"2020-12-27","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleReceivingFirstDose":963208,"cumPeopleReceivingSecondDose":0},
    {"date":"2021-01-03","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleReceivingFirstDose":1296432,"cumPeopleReceivingSecondDose":21313}];

var currentDate = new Date("2020-12-20"),
    endDate = new Date("2021-02-01"),
    labels = [];

while (currentDate < endDate) {
    labels.push(currentDate.toLocaleString());
    currentDate.setDate(currentDate.getDate() + 7)
}

var firstDoseData = _.map(data, (d) => { return { t: new Date(d.date), y: d.cumPeopleReceivingFirstDose } });
var secondDoseData = _.map(data, (d) => { return { t: new Date(d.date), y: d.cumPeopleReceivingSecondDose } });
var targetLine = _.map(labels, (l) => { return { x: l, y: 13000000 } })

var currentFirstDoseCount = _.max(firstDoseData, (d) => d.y).y;
var currentSecondDoseCount = _.max(secondDoseData, (d) => d.y).y;

var firstDoseElement = document.getElementById('firstDoseCount');
var secondDoseElement = document.getElementById('secondDoseCount');

firstDoseElement.innerText = Number(currentFirstDoseCount).toLocaleString();
firstDoseElement.style.color = COLOUR_FIRST_JAB;

secondDoseElement.innerText = Number(currentSecondDoseCount).toLocaleString();
secondDoseElement.style.color = COLOUR_SECOND_JAB;

var ctx = document.getElementById('myChart');
var myChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: labels,
        datasets: [{
            label: 'First jab',
            fill: false,
            backgroundColor: COLOUR_FIRST_JAB,
            borderColor: COLOUR_FIRST_JAB,
            data: firstDoseData
        },{
            label: 'Second jab',
            fill: false,
            backgroundColor: COLOUR_SECOND_JAB,
            borderColor: COLOUR_SECOND_JAB,
            data: secondDoseData
        }, {
            label: 'Target',
            fill: false,
            backgroundColor: COLOUR_TARGET,
            borderColor: COLOUR_TARGET,
            borderDash: [5, 5],
            data: targetLine
        }]
    },
    options: {
        scales: {
            xAxis: [{
                type: 'time',
                time: {
                    unit: 'day'
                }
            }]
        }
    }
});