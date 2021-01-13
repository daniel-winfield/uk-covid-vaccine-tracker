const COLOUR_FIRST_JAB = 'rgb(28 156 146)';
const COLOUR_SECOND_JAB = '#f62aa0';
const COLOUR_TARGET = '#b8ee30';
const MAX_DATE = '2021-03-01';
const TARGET = 13000000;
const UK_ADULT_POPULATION = 52403344;

$.getJSON('json/data.json', (json) => {
    var data = _.sortBy(json.body, (i) => new Date(i.date));


    // var data = [
    // {"date":"2020-12-20","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":650714,"cumPeopleVaccinatedSecondDoseByPublishDate":0},
    // {"date":"2020-12-27","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":963208,"cumPeopleVaccinatedSecondDoseByPublishDate":0},
    // {"date":"2021-01-03","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":1296432,"cumPeopleVaccinatedSecondDoseByPublishDate":21313},
    // {"date":"2021-01-10","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":2286572,"cumPeopleVaccinatedSecondDoseByPublishDate":391399},
    // {"date":"2021-01-11","areaType":"overview","areaCode":"K02000001","areaName":"United Kingdom","cumPeopleVaccinatedFirstDoseByPublishDate":2431648,"cumPeopleVaccinatedSecondDoseByPublishDate":412167}]

    var firstDoseData = _.map(data, (d) => { return { x: moment(d.date), y: d.cumPeopleVaccinatedFirstDoseByPublishDate } });
    var secondDoseData = _.map(data, (d) => { return { x: moment(d.date), y: d.cumPeopleVaccinatedSecondDoseByPublishDate } });
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

    var cumVaccineDoses = document.getElementById('cumVaccineDoses');
    var chartLine = new Chart(cumVaccineDoses, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: "First dose",
                    data: firstDoseData,
                    fill: false,
                    borderColor: COLOUR_FIRST_JAB,
                    backgroundColor: COLOUR_FIRST_JAB
                },
                {
                    label: "Second dose",
                    data: secondDoseData,
                    fill: false,
                    borderColor: COLOUR_SECOND_JAB,
                    backgroundColor: COLOUR_SECOND_JAB
                },
                {
                    label: "Target",
                    data: targetLine,
                    fill: false,
                    borderColor: COLOUR_TARGET,
                    backgroundColor: COLOUR_TARGET,
                    borderDash: [5, 5],
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
                mode: 'x',
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

    var percentageVaccinated = document.getElementById('percentageVaccinated');
    var chartDoughnut = new Chart(percentageVaccinated, {
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
});
