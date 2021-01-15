const COLOUR_FIRST_JAB = 'rgb(28 156 146)';
const COLOUR_SECOND_JAB = '#f62aa0';
const COLOUR_TARGET = '#b8ee30';
const MAX_DATE = '2021-02-15';
const TARGET = 14000000;
const UK_ADULT_POPULATION = 52403344;
const IS_DEVELOPMENT = false;

var setupChart = function(htmlElementId, chartData) {
    let htmlElement = document.getElementById(htmlElementId);
    new Chart(htmlElement, chartData);
};

var setupCurrentCount = function(htmlElementId, data, colour) {
    let htmlElement = document.getElementById(htmlElementId);
    let latestCount = _.max(data, (d) => d.y).y;

    htmlElement.innerText = Number(latestCount).toLocaleString();
    htmlElement.style.color = colour;
};

var setupCharts = function(json) {
    var data = _.sortBy(json.body, (i) => new Date(i.date));

    var firstDoseData = _.map(data, (d) => { return { x: moment(d.date), y: d.cumPeopleVaccinatedFirstDoseByPublishDate } });
    var secondDoseData = _.map(data, (d) => { return { x: moment(d.date), y: d.cumPeopleVaccinatedSecondDoseByPublishDate } });
    var targetLine = _.map(data, (d) => { return { x: moment(d.date), y: TARGET } })
    targetLine.push({ x: moment(MAX_DATE), y: TARGET });

    setupCurrentCount('firstDoseCount', firstDoseData, COLOUR_FIRST_JAB);
    setupCurrentCount('secondDoseCount', secondDoseData, COLOUR_SECOND_JAB);

    setupChart('cumVaccineDoses', {
        type: 'line',
        data: {
            datasets: [
                {
                    label: "First dose",
                    data: firstDoseData,
                    fill: false,
                    borderColor: COLOUR_FIRST_JAB,
                    backgroundColor: COLOUR_FIRST_JAB,
                    pointRadius: 2
                },
                {
                    label: "Both doses",
                    data: secondDoseData,
                    fill: false,
                    borderColor: COLOUR_SECOND_JAB,
                    backgroundColor: COLOUR_SECOND_JAB,
                    pointRadius: 2
                },
                {
                    label: "Target",
                    data: targetLine,
                    fill: false,
                    borderColor: COLOUR_TARGET,
                    backgroundColor: COLOUR_TARGET,
                    borderDash: [5, 5],
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                xAxes: [{
                    type: "time",
                    time: {
                        format: 'DD/MM/YYYY',
                        tooltipFormat: 'll',
                    },
                }],
                yAxes: [{
                    ticks: {
                        callback: function (value) {
                            return Number(value).toLocaleString()
                        }
                    }
                }]
            },
            tooltips: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    label: (tooltipItem, data) => {
                        let dataset = data.datasets[tooltipItem.datasetIndex];
                        let cumDoses = dataset.data[tooltipItem.index];

                        return `${dataset.label}: ${Number(cumDoses.y).toLocaleString()}`;
                    }
                }
            }
        }
    });

    setupChart('percentageVaccinated', {
        type: 'doughnut',
        data: {
            labels: ["Vaccinated", "Population"],
            datasets: [{
                data: [_.last(data).cumPeopleVaccinatedFirstDoseByPublishDate, UK_ADULT_POPULATION],
                backgroundColor: [
                    COLOUR_FIRST_JAB,
                    '#b4b4b4'
                ]
            }, {
                data: [_.last(data).cumPeopleVaccinatedSecondDoseByPublishDate, UK_ADULT_POPULATION],
                backgroundColor: [
                    COLOUR_SECOND_JAB,
                    '#b4b4b4'
                ]
            }]
        },
        options: {
            responsive: true,
            legend: {
                display: false
            },
            tooltips: {
                mode: 'dataset',
                callbacks: {
                    afterBody: (tooltipItem, data) => {
                        let dataset = data.datasets[tooltipItem[0].datasetIndex];
                        let cumDoses = dataset.data[0];
                        let pop = dataset.data[1];

                        return Number((cumDoses / pop) * 100).toLocaleString() + '%';
                    }
                }
            }
        }
    });
};

if (!IS_DEVELOPMENT) {
    $.getJSON('json/data.json', (json) => {
        setupCharts(json);
    });    
} else {
    setupCharts({"length":4,"body":[
        {"date":"2021-01-13","cumPeopleVaccinatedFirstDoseByPublishDate":2918252,"cumPeopleVaccinatedSecondDoseByPublishDate":437977},
        {"date":"2021-01-12","cumPeopleVaccinatedFirstDoseByPublishDate":2639309,"cumPeopleVaccinatedSecondDoseByPublishDate":428232},
        {"date":"2021-01-11","cumPeopleVaccinatedFirstDoseByPublishDate":2431648,"cumPeopleVaccinatedSecondDoseByPublishDate":412167},
        {"date":"2021-01-10","cumPeopleVaccinatedFirstDoseByPublishDate":2286572,"cumPeopleVaccinatedSecondDoseByPublishDate":391399}
    ]});
}