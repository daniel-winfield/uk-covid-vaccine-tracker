# UK COVID-19 Vaccine Tracker
This application tracks the rollout of vaccines in the United Kingdom, comparing the total number of first and second doses given out to the targets set by government and against the population as a whole. 

The data is sourced directly from the GOV.UK API in JSON format using a GitHub action. The GitHub action retrieves the latest version of the data once per hour and, if a newer version is found, pushes that to the repository. This has been done for efficiency and because the API endpoint is rate limited.

GitHub pages is used for hosting and it can be accessed at https://danielwinfield.uk/uk-covid-vaccine-tracker/