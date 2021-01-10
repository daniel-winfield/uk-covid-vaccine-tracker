// Please see documentation at https://docs.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your Javascript code.

const COLOUR_FIRST_JAB = 'rgb(28 156 146)';
const COLOUR_SECOND_JAB = '#f62aa0';
const COLOUR_TARGET = '#b8ee30';
const MAX_DATE = '2021-03-01';
const TARGET = 13000000;

$.getJSON('json/data.json', (json) => {
    var data = _.sortBy(json.body, (i) => new Date(i.date));

    var firstDoseData = _.map(data, (d) => { return { x: moment(d.date), y: d.cumPeopleReceivingFirstDose } });
    var secondDoseData = _.map(data, (d) => { return { x: moment(d.date), y: d.cumPeopleReceivingSecondDose } });
    var targetLine = _.map(data, (d) => { return { x: moment(d.date), y: TARGET } })
    targetLine.push({ x: moment(MAX_DATE), y: TARGET });

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
            datasets: [
                {
                    label: "First dose",
                    data: firstDoseData,
                    fill: false,
                    borderColor: COLOUR_FIRST_JAB
                },
                {
                    label: "Second dose",
                    data: secondDoseData,
                    fill: false,
                    borderColor: COLOUR_SECOND_JAB
                },
                {
                    label: "Target",
                    data: targetLine,
                    fill: false,
                    borderColor: COLOUR_TARGET,
                    borderDash: [5, 5],
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                xAxes: [{
                    type: "time",
                    time: {
                        format: 'DD/MM/YYYY',
                        tooltipFormat: 'll',
                    },
                }],
                yAxes: [{
                }]
            }
        }
    });
});
