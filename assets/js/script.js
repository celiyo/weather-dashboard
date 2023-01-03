const APIKey = "2011f86e09c0ef5745d5c9cf27911231";
const searchInput = $("#search-input");
const searchBtn = $("#search-button");
const historyCities = $("#history");
const start = $("#start");
const currentWeather = $("#today");
const futureWeather = $("#forecast");
const clearHistory = $("#clear-history");
const alert = $("#alert");

let cities = [];

init();

function renderCities() {
  let savedCities = JSON.parse(localStorage.getItem("cities"));

  // Clear the #history element value
  historyCities.text("");

  // Return from the function early if the cities array is empty
  if (!savedCities) {
    return;
  }

  // Render a new button for each city
  for (let i = 0; i < savedCities.length; i++) {
    let savedCity = savedCities[i].name;
    let historyCity = $("<button>")
      .addClass("btn btn-small btn-secondary mb-2")
      .attr("id", savedCities[i].name)
      .text(savedCity);
    historyCities.prepend(historyCity);
  }
}

function storeCities() {
  // Stringify and set "cities" key in localStorage to cities array
  localStorage.setItem("cities", JSON.stringify(cities));
}

function displayCurrentWeather(data) {
  let date = moment.unix(data.dt).format("DD/MM/YYYY");
  let icon = data.weather[0].icon;

  // Create elements for current weather conditions
  let cityNameEl = $("<h3>").text(data.name);
  let dateEl = $('<span class="current-dt">').text("(" + date + ")");
  let iconEl = $("<img>").attr(
    "src",
    "http://openweathermap.org/img/wn/" + icon + ".png"
  );
  let tempEl = $("<p>").text("Temp: " + data.main.temp + " °C");
  let windSpeedEl = $("<p>").text("Wind: " + data.wind.speed + " KPH");
  let humidityEl = $("<p>").text("Humidity: " + data.main.humidity + "%");

  // Append elements for the current weather conditions
  cityNameEl.append(dateEl, iconEl);
  currentWeather.empty();
  currentWeather.append(cityNameEl, tempEl, windSpeedEl, humidityEl);
  currentWeather.addClass("visible");
}

function displayFutureWeather(data) {
  let lat = data.coord.lat;
  let lon = data.coord.lon;
  let queryForecastURL =
    "https://api.openweathermap.org/data/2.5/forecast?lat=" +
    lat +
    "&lon=" +
    lon +
    "&appid=" +
    APIKey +
    "&units=metric";

  $.ajax({
    url: queryForecastURL,
    method: "GET",
  }).then(function (response) {
    let today = moment().format("DD/MM/YYYY");
    let forecast = response.list;

    // Create and apend the forecast section title element
    let titleEl = $("<h3>").text("5-Day Forecast:");
    futureWeather.append(titleEl);

    // Create the forecast card-wrapper element
    let cardRowEl = $("<div>").addClass("card-wrapper m-0");
    for (let i = 0; i < forecast.length; i++) {
      let date = moment.unix(forecast[i].dt).format("DD/MM/YYYY");
      let hour = parseInt(moment.unix(forecast[i].dt).format("H"));
      let icon = forecast[i].weather[0].icon;
      if (date !== today && hour == 12) {
        // Create card HTML elements
        let cardEl = $("<div>").addClass("card bg-primary text-white");
        let cardBodyEl = $("<div>").addClass("card-body");
        let cardTitleEl = $("<h5>").addClass("card-title").text(date);
        let cardIconEl = $("<img>").attr(
          "src",
          "http://openweathermap.org/img/wn/" + icon + ".png"
        );
        let cardTextEl = $("<div>").addClass("card-text");
        let cardTempEl = $("<p>").text(
          "Temp: " + forecast[i].main.temp + " °C"
        );
        let cardWindSpeedEl = $("<p>").text(
          "Wind: " + forecast[i].wind.speed + " KPH"
        );
        let cardHumidityEl = $("<p>").text(
          "Humidity: " + forecast[i].main.humidity + "%"
        );

        // Append card HTML elements
        cardTextEl.append(cardTempEl, cardWindSpeedEl, cardHumidityEl);
        cardBodyEl.append(cardTitleEl, cardIconEl, cardTextEl);
        cardEl.append(cardBodyEl);
        cardRowEl.append(cardEl);
      }
      // Empty the forecast element, append new forecast card element
      futureWeather.empty();
      futureWeather.append(cardRowEl);
    }
  });
}

function getCityWeather(name) {
  let queryURL =
    "https://api.openweathermap.org/data/2.5/weather?q=" +
    name +
    "&appid=" +
    APIKey +
    "&units=metric";
  if (name) {
    $.ajax({
      url: queryURL,
      method: "GET",
    })
      .then(function (response) {
        let city = {};
        city.name = response.name;
        city.lat = response.coord.lat;
        city.lon = response.coord.lon;

        // Clear alert
        alert.text("").addClass("hide");

        // Get the current and future wether conditions
        displayCurrentWeather(response);
        displayFutureWeather(response);

        // Return from the function early if the city name entered has already been saved
        let cityExists = cities.find(
          (item) => item.name.toLowerCase() === name.toLowerCase()
        );
        if (cityExists) {
          return;
        }

        // Save the new city object to the cities array and render the new cities to the DOM
        cities.push(city);
        storeCities();
        renderCities();
      })
      // Alert the user if the city name entered is not valid
      .catch(() => {
        alert.text("Please enter a valid city name.").removeClass("hide");
      });
  }
}

function init() {
  // Get stored todos from localStorage, parsing the JSON string to an object
  let storedCities = JSON.parse(localStorage.getItem("cities"));

  // If cities were retrieved from the localStorage, update the cities array
  if (storedCities !== null) {
    cities = storedCities;

    // Render cities to the DOM
    renderCities();

    // Hide the start section if there are cities
    start.removeClass("visible");

    // Display current and future weather conditions for the last searched city
    getCityWeather(cities[cities.length - 1].name);
  } else {
    // Display the start section if there are no cities
    start.addClass("visible");
  }
}

// When the search button is clicked, retrieve the weather conditions for the city
searchBtn.on("click", function (e) {
  e.preventDefault();
  let cityName = searchInput.val();

  // Clear the input and display current and future weather conditions
  searchInput.val("");
  start.removeClass("visible");
  getCityWeather(cityName);
});

// When the history buttons are clicked, retrieve the weather conditions for the city
historyCities.on("click", ".btn", function (e) {
  let elName = e.target.id;
  getCityWeather(elName);
});

// When the clear history button is clicked, clear the cities array and the HTML elements
clearHistory.on("click", function () {
  localStorage.clear();
  cities = [];
  renderCities();
  currentWeather.empty();
  currentWeather.removeClass("visible");
  futureWeather.empty();
  start.addClass("visible");
});
