const apiKey = "2e689ea661652089d684fb6735e15bf4";
const userLocationInput = document.getElementById("userLocation");
const searchIcon = document.getElementById("search");
const converter = document.getElementById("converter");
const weatherIcon = document.querySelector(".weatherIcon");
const temperature = document.querySelector(".temperature");
const feelsLike = document.querySelector(".feelsLike");
const description = document.querySelector(".description");
const date = document.querySelector(".date");
const city = document.querySelector(".city");
const humidityValue = document.getElementById("HValue");
const windSpeedValue = document.getElementById("WValue");
const sunsetValue = document.getElementById("SSValue");
const sunriseValue = document.getElementById("SRValue");
const cloudsValue = document.getElementById("CValue");
const uvIndexValue = document.getElementById("UVValue");
const pressureValue = document.getElementById("PValue");
const forecastContainer = document.querySelector(".Forecast");

// Initialize the map
const map = L.map('map').setView([0, 0], 2); // Default view
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let marker;

// Function to fetch weather data
async function fetchWeatherData(location, units = "metric") {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=${units}&appid=${apiKey}`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    return data;
}

// Function to fetch forecast data
async function fetchForecastData(location, units = "metric") {
    const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${location}&units=${units}&appid=${apiKey}`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    return data;
}

// Function to update weather details
function updateWeatherDetails(data) {
    const { main, weather, wind, sys, clouds, dt, name, coord } = data;

    // Update temperature and feels like
    temperature.textContent = `${Math.round(main.temp)}°${converter.value === "°C" ? "C" : "F"}`;
    feelsLike.textContent = `Feels like: ${Math.round(main.feels_like)}°${converter.value === "°C" ? "C" : "F"}`;

    // Update weather icon and description
    weatherIcon.style.background = `url(http://openweathermap.org/img/wn/${weather[0].icon}@2x.png)`;
    description.textContent = weather[0].description;

    // Update date and city
    const currentDate = new Date(dt * 1000).toLocaleDateString();
    date.textContent = currentDate;
    city.textContent = name;

    // Update highlights
    humidityValue.textContent = `${main.humidity}%`;
    windSpeedValue.textContent = `${wind.speed} m/s`;
    sunriseValue.textContent = new Date(sys.sunrise * 1000).toLocaleTimeString();
    sunsetValue.textContent = new Date(sys.sunset * 1000).toLocaleTimeString();
    cloudsValue.textContent = `${clouds.all}%`;
    uvIndexValue.textContent = "N/A"; // UV index is not available in the free API
    pressureValue.textContent = `${main.pressure} hPa`;

    // Update map
    map.setView([coord.lat, coord.lon], 10);
    if (marker) {
        marker.setLatLng([coord.lat, coord.lon]);
    } else {
        marker = L.marker([coord.lat, coord.lon]).addTo(map);
    }
}

// Function to update forecast details
function updateForecastDetails(data) {
    forecastContainer.innerHTML = ""; // Clear previous forecast data

    const dailyForecast = data.list.filter((item, index) => index % 8 === 0); // Get one forecast per day

    dailyForecast.forEach((item) => {
        const forecastCard = document.createElement("div");
        forecastCard.innerHTML = `
            <p>${new Date(item.dt * 1000).toLocaleDateString()}</p>
            <img src="http://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="${item.weather[0].description}">
            <p>${Math.round(item.main.temp)}°${converter.value === "°C" ? "C" : "F"}</p>
            <p>${item.weather[0].description}</p>
        `;
        forecastContainer.appendChild(forecastCard);
    });
}

// Function to handle search
async function findUserLocation() {
    const location = userLocationInput.value.trim();
    if (!location) return;

    try {
        const weatherData = await fetchWeatherData(location);
        const forecastData = await fetchForecastData(location);
        updateWeatherDetails(weatherData);
        updateForecastDetails(forecastData);
    } catch (error) {
        console.error("Error fetching weather data:", error);
        alert("Location not found. Please try again.");
    }
}

// Function to get current location
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchWeatherByCoords(latitude, longitude);
            },
            (error) => {
                console.error("Error getting location:", error);
                alert("Unable to retrieve your location.");
            }
        );
    } else {
        alert("Geolocation is not supported by your browser.");
    }
}

// Function to fetch weather by coordinates
async function fetchWeatherByCoords(lat, lon, units = "metric") {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${apiKey}`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    const forecastData = await fetchForecastData(data.name, units);
    updateWeatherDetails(data);
    updateForecastDetails(forecastData);
}

// Event listeners
searchIcon.addEventListener("click", findUserLocation);
userLocationInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") findUserLocation();
});

converter.addEventListener("change", () => {
    const location = userLocationInput.value.trim();
    if (location) findUserLocation();
});

// Get current location on page load
getCurrentLocation();

// Map click event to select location
map.on("click", async (e) => {
    const { lat, lng } = e.latlng;
    await fetchWeatherByCoords(lat, lng);
});

