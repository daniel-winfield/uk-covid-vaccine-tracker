Chart.plugins.unregister(ChartDataLabels);
const COLOUR_FIRST_JAB = '#273c75';
const COLOUR_SECOND_JAB = '#218c74';
const COLOUR_UNVACCINATED = '#b33939';
const MAX_DATE = '2020-05-06';
const UK_ADULT_POPULATION = 52403344;
const IS_DEVELOPMENT = false;
const TARGETS = [
    {
        label: 'Vaccine groups 1-4',
        date: '2021-02-15', 
        target: 15000000,
        colour: '#f5b942'
    }, { 
        label: 'Vaccine groups 5-9',
        date: '2021-05-06', 
        target: 32000000,
        colour: '#eb8634'
    }]

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

var generateTargetData = function(data, target) {
    var targetLine = _.map(data, (d) => { return { x: moment(d.date), y: target.target } })

    if (moment(MAX_DATE) > moment()) {
        targetLine.push({ x: moment(MAX_DATE), y: target.target });
    }

    return {
        label: target.label,
        data: targetLine,
        fill: false,
        borderColor: target.colour,
        backgroundColor: target.colour,
        borderDash: [5, 5],
        pointRadius: 0
    }
}

var setupCharts = function(json) {
    var data = _.sortBy(json.body, (i) => new Date(i.date));

    var firstDoseData = _.map(data, (d) => { return { x: moment(d.date), y: d.cumPeopleVaccinatedFirstDoseByPublishDate } });
    var secondDoseData = _.map(data, (d) => { return { x: moment(d.date), y: d.cumPeopleVaccinatedSecondDoseByPublishDate } });

    setupCurrentCount('firstDoseCount', 'firstDoseChange', firstDoseData, COLOUR_FIRST_JAB);
    setupCurrentCount('secondDoseCount', 'secondDoseChange', secondDoseData, COLOUR_SECOND_JAB);
    setupCurrentPercentage('firstDosePercentage', firstDoseData, COLOUR_FIRST_JAB);
    setupCurrentPercentage('secondDosePercentage', secondDoseData, COLOUR_SECOND_JAB);

    var datasets = [];
    datasets.push({
        label: "First dose",
        data: firstDoseData,
        fill: false,
        borderColor: COLOUR_FIRST_JAB,
        backgroundColor: COLOUR_FIRST_JAB,
        pointRadius: 1
    });
    datasets.push({
        label: "Both doses",
        data: secondDoseData,
        fill: false,
        borderColor: COLOUR_SECOND_JAB,
        backgroundColor: COLOUR_SECOND_JAB,
        pointRadius: 1
    });

    TARGETS.forEach(target => {
        datasets.push(generateTargetData(data, target));
    });

  
    Chart.defaults.global.legend.labels.usePointStyle = true;

    setupChart('cumVaccineDoses', {
        type: 'line',
        data: {
            datasets: datasets
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

                        // Exclude targets from daily change in tooltip
                        if (tooltipItem.index > 0 && tooltipItem.datasetIndex < 2) {
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
                display: true
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
    setupCharts({"length":38,"body":[{"date":"2021-02-16","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":15940972,"cumPeopleVaccinatedSecondDoseByPublishDate":558577},{"date":"2021-02-15","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":15576107,"cumPeopleVaccinatedSecondDoseByPublishDate":546165},{"date":"2021-02-14","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":15300151,"cumPeopleVaccinatedSecondDoseByPublishDate":539630},{"date":"2021-02-13","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":15062189,"cumPeopleVaccinatedSecondDoseByPublishDate":537715},{"date":"2021-02-12","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":14556827,"cumPeopleVaccinatedSecondDoseByPublishDate":534869},{"date":"2021-02-11","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":14012224,"cumPeopleVaccinatedSecondDoseByPublishDate":530094},{"date":"2021-02-10","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":13509108,"cumPeopleVaccinatedSecondDoseByPublishDate":524447},{"date":"2021-02-09","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":13058298,"cumPeopleVaccinatedSecondDoseByPublishDate":519553},{"date":"2021-02-08","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":12646486,"cumPeopleVaccinatedSecondDoseByPublishDate":516392},{"date":"2021-02-07","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":12294006,"cumPeopleVaccinatedSecondDoseByPublishDate":512581},{"date":"2021-02-06","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":12015018,"cumPeopleVaccinatedSecondDoseByPublishDate":511719},{"date":"2021-02-05","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":11465210,"cumPeopleVaccinatedSecondDoseByPublishDate":510057},{"date":"2021-02-04","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":10971047,"cumPeopleVaccinatedSecondDoseByPublishDate":505993},{"date":"2021-02-03","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":10490487,"cumPeopleVaccinatedSecondDoseByPublishDate":501957},{"date":"2021-02-02","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":10021471,"cumPeopleVaccinatedSecondDoseByPublishDate":498962},{"date":"2021-02-01","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":9646715,"cumPeopleVaccinatedSecondDoseByPublishDate":496796},{"date":"2021-01-31","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":9296367,"cumPeopleVaccinatedSecondDoseByPublishDate":494209},{"date":"2021-01-30","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":8977329,"cumPeopleVaccinatedSecondDoseByPublishDate":491053},{"date":"2021-01-29","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":8378940,"cumPeopleVaccinatedSecondDoseByPublishDate":480432},{"date":"2021-01-28","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":7891184,"cumPeopleVaccinatedSecondDoseByPublishDate":478254},{"date":"2021-01-27","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":7476765,"cumPeopleVaccinatedSecondDoseByPublishDate":476485},{"date":"2021-01-26","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":7164387,"cumPeopleVaccinatedSecondDoseByPublishDate":474156},{"date":"2021-01-25","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":6853327,"cumPeopleVaccinatedSecondDoseByPublishDate":472446},{"date":"2021-01-24","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":6573570,"cumPeopleVaccinatedSecondDoseByPublishDate":470478},{"date":"2021-01-23","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":6353321,"cumPeopleVaccinatedSecondDoseByPublishDate":469660},{"date":"2021-01-22","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":5861351,"cumPeopleVaccinatedSecondDoseByPublishDate":468617},{"date":"2021-01-21","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":5383103,"cumPeopleVaccinatedSecondDoseByPublishDate":466796},{"date":"2021-01-20","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":4973248,"cumPeopleVaccinatedSecondDoseByPublishDate":464036},{"date":"2021-01-19","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":4609740,"cumPeopleVaccinatedSecondDoseByPublishDate":460625},{"date":"2021-01-18","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":4266577,"cumPeopleVaccinatedSecondDoseByPublishDate":456866},{"date":"2021-01-17","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":4062501,"cumPeopleVaccinatedSecondDoseByPublishDate":452301},{"date":"2021-01-16","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":3837094,"cumPeopleVaccinatedSecondDoseByPublishDate":449736},{"date":"2021-01-15","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":3559179,"cumPeopleVaccinatedSecondDoseByPublishDate":447261},{"date":"2021-01-14","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":3234946,"cumPeopleVaccinatedSecondDoseByPublishDate":443234},{"date":"2021-01-13","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":2918252,"cumPeopleVaccinatedSecondDoseByPublishDate":437977},{"date":"2021-01-12","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":2639309,"cumPeopleVaccinatedSecondDoseByPublishDate":428232},{"date":"2021-01-11","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":2431648,"cumPeopleVaccinatedSecondDoseByPublishDate":412167},{"date":"2021-01-10","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":2286572,"cumPeopleVaccinatedSecondDoseByPublishDate":391399}]});
}
