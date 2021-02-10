Chart.plugins.unregister(ChartDataLabels);
const COLOUR_FIRST_JAB = '#273c75';
const COLOUR_SECOND_JAB = '#218c74';
const COLOUR_TARGET = '#b8ee30';
const COLOUR_UNVACCINATED = '#b33939';
const MAX_DATE = '2021-02-15';
const TARGET = 15000000;
const UK_ADULT_POPULATION = 52403344;
const IS_DEVELOPMENT = false;

var setupChart = function(htmlElementId, chartData) {
    let htmlElement = document.getElementById(htmlElementId);
    new Chart(htmlElement, chartData);
};

var setupCurrentCount = function(countHtmlElementId, changeHtmlElementId, data, colour) {
    let countHtmlElement = document.getElementById(countHtmlElementId);
    let changeHtmlElement = document.getElementById(changeHtmlElementId);
    let latestCount = _.max(data, (d) => d.y).y;
    let latestDailyChange = getLatestDailyChange(data);

    countHtmlElement.innerText = Number(latestCount).toLocaleString();
    countHtmlElement.style.color = colour;

    changeHtmlElement.innerText = `An increase of ${Number(latestDailyChange).toLocaleString()} in the past day`;
};

var setupCurrentPercentage = function(htmlElementId, data, colour) {
    let htmlElement = document.getElementById(htmlElementId);
    let latestPercentage = (_.max(data, (d) => d.y).y / UK_ADULT_POPULATION) * 100;

    htmlElement.innerText = `${Number(latestPercentage).toLocaleString()}%`;
    htmlElement.style.color = colour;
};

var getLatestDailyChange = function(data) {
    let mostRecent = { x: null, y: 0 };
    let secondMostRecent = { x: null, y: 0 };

    data.forEach(i => {
        if (i.x > secondMostRecent.x) {
            if (i.x > mostRecent.x) {
                secondMostRecent = mostRecent;
                mostRecent = i;
            } else {
                secondMostRecent = i;
            }
        }
    });

    return mostRecent.y - secondMostRecent.y;
};

var setupCharts = function(json) {
    var data = _.sortBy(json.body, (i) => new Date(i.date));

    var firstDoseData = _.map(data, (d) => { return { x: moment(d.date), y: d.cumPeopleVaccinatedFirstDoseByPublishDate } });
    var secondDoseData = _.map(data, (d) => { return { x: moment(d.date), y: d.cumPeopleVaccinatedSecondDoseByPublishDate } });
    var targetLine = _.map(data, (d) => { return { x: moment(d.date), y: TARGET } })

    if (moment(MAX_DATE) > moment()) {
        targetLine.push({ x: moment(MAX_DATE), y: TARGET });
    }

    setupCurrentCount('firstDoseCount', 'firstDoseChange', firstDoseData, COLOUR_FIRST_JAB);
    setupCurrentCount('secondDoseCount', 'secondDoseChange', secondDoseData, COLOUR_SECOND_JAB);
    setupCurrentPercentage('firstDosePercentage', firstDoseData, COLOUR_FIRST_JAB);
    setupCurrentPercentage('secondDosePercentage', secondDoseData, COLOUR_SECOND_JAB);

    Chart.defaults.global.legend.labels.usePointStyle = true;

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
                    label: "February 15th target",
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
            // responsive: true,
            maintainAspectRatio: true,
            scales: {
                xAxes: [{
                    type: "time",
                    time: {
                        format: 'DD/MM/YYYY',
                        tooltipFormat: 'll',
                    },
                    gridLines: {
                        display: true,
                        drawOnChartArea: false,
                    }
                }],
                yAxes: [{
                    ticks: {
                        callback: function (value) {
                            if (value === 0) {
                                return 0;
                            }
                            return `${Number(value / 1000000).toLocaleString()}m`
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
                        let cumDoses = dataset.data[tooltipItem.index].y;
                        let changeFromPrevDay = '';

                        if (tooltipItem.index > 0 && tooltipItem.datasetIndex != 2) {
                            changeFromPrevDay = `(+${Number(cumDoses - dataset.data[tooltipItem.index - 1].y).toLocaleString()})`;
                        }

                        return `${dataset.label}: ${Number(cumDoses).toLocaleString()} ${changeFromPrevDay}`;
                    }
                },
                position: 'nearest'
            }
        }
    });

    let bothDoses = _.last(data).cumPeopleVaccinatedSecondDoseByPublishDate;
    let firstDoseOnly = _.last(data).cumPeopleVaccinatedFirstDoseByPublishDate - bothDoses;
    let unvaccinated = UK_ADULT_POPULATION - firstDoseOnly - bothDoses;

    setupChart('percentageVaccinated', {
        plugins: [ChartDataLabels],
        type: 'doughnut',
        data: {
            labels: ["First dose only", "Both doses", "Unvaccinated"],
            datasets: [{
                data: [firstDoseOnly, bothDoses, unvaccinated],
                backgroundColor: [
                    COLOUR_FIRST_JAB,
                    COLOUR_SECOND_JAB,
                    COLOUR_UNVACCINATED
                ]
            }]
        },
        options: {
            cutoutPercentage: 60,
            responsive: true,
            legend: {
                display: false
            },
            tooltips: {
                callbacks: {
                    label: (tooltipItem, data) => {
                        let dataset = data.datasets[tooltipItem.datasetIndex];
                        let category = dataset.data[tooltipItem.index];
                        let pop = UK_ADULT_POPULATION;

                        let categoryLabel = data.labels[tooltipItem.index];
                        let categoryCount = Number(category).toLocaleString();
                        let categoryPercentage = `${Number((category / pop) * 100).toLocaleString()}%`;

                        return `${categoryLabel}: ${categoryCount} (${categoryPercentage})`;
                    }
                }
            },
            plugins: {
                datalabels: {
                    display: 'auto',
                    anchor: 'centre',
                    color: function(context) {
                        return context.dataset.backgroundColor;
                    },
                    borderRadius: 15,
                    borderWidth: 2,
                    backgroundColor: 'white',
                    font: {
                        weight: 'bold',
                        size: '15'
                    },
                    padding: 6,
                    formatter: function(value, context) {
                        let percentage = Number((value / UK_ADULT_POPULATION) * 100).toLocaleString(undefined, { maximumFractionDigits: 0 });
                        return `${percentage}%`;
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