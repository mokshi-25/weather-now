const cityInput = document.getElementById('city');
const searchBtn = document.getElementById('search-btn');
const message = document.getElementById('message');
const currentBox = document.getElementById('current');
const forecastBox = document.getElementById('forecast');

function describe(code) {
  if (code === 0) return ['☀️', 'Clear sky'];
  if (code <= 2) return ['⛅', 'Partly cloudy'];
  if (code === 3) return ['☁️', 'Overcast'];
  if (code === 45 || code === 48) return ['🌫️', 'Fog'];
  if (code >= 51 && code <= 57) return ['🌦️', 'Drizzle'];
  if (code >= 61 && code <= 67) return ['🌧️', 'Rain'];
  if (code >= 71 && code <= 77) return ['❄️', 'Snow'];
  if (code >= 80 && code <= 82) return ['🌧️', 'Rain showers'];
  if (code >= 85 && code <= 86) return ['❄️', 'Snow showers'];
  if (code >= 95) return ['⛈️', 'Thunderstorm'];
  return ['🌡️', 'Unknown'];
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function showMessage(text, isError) {
  message.textContent = text;
  message.className = isError ? 'message error' : 'message';
}

async function loadWeather() {
  const name = cityInput.value.trim();
  if (!name) {
    showMessage('Please type a city name.', true);
    return;
  }

  showMessage('Loading...', false);
  currentBox.replaceChildren();
  forecastBox.replaceChildren();

  try {
    // Step 1: turn the city name into latitude and longitude
    const geoUrl = 'https://geocoding-api.open-meteo.com/v1/search?count=1&name=' + encodeURIComponent(name);
    const geoRes = await fetch(geoUrl);
    const geo = await geoRes.json();

    if (!geo.results || geo.results.length === 0) {
      showMessage('City not found. Check the spelling and try again.', true);
      return;
    }

    const place = geo.results[0];

    // Step 2: get the weather for that place
    const weatherUrl =
      'https://api.open-meteo.com/v1/forecast' +
      '?latitude=' + place.latitude +
      '&longitude=' + place.longitude +
      '&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code' +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min' +
      '&timezone=auto';

    const weatherRes = await fetch(weatherUrl);
    const data = await weatherRes.json();

    showMessage('', false);
    renderCurrent(place, data.current);
    renderForecast(data.daily);
  } catch (err) {
    showMessage('Something went wrong. Check your internet and try again.', true);
  }
}

function renderCurrent(place, current) {
  const [icon, text] = describe(current.weather_code);
  const card = el('div', 'card');

  card.appendChild(el('div', 'city', place.name + (place.country ? ', ' + place.country : '')));
  card.appendChild(el('div', 'icon', icon));
  card.appendChild(el('div', 'temp', Math.round(current.temperature_2m) + '°C'));
  card.appendChild(el('div', 'desc', text));

  const details = el('div', 'details');
  details.appendChild(el('span', '', 'Feels like ' + Math.round(current.apparent_temperature) + '°C'));
  details.appendChild(el('span', '', 'Humidity ' + current.relative_humidity_2m + '%'));
  details.appendChild(el('span', '', 'Wind ' + Math.round(current.wind_speed_10m) + ' km/h'));
  card.appendChild(details);

  currentBox.replaceChildren(card);
}

function renderForecast(daily) {
  // index 0 is today, so show the next 5 days (1 to 5)
  for (let i = 1; i <= 5; i++) {
    const [icon] = describe(daily.weather_code[i]);
    const date = new Date(daily.time[i] + 'T00:00:00');
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

    const box = el('div', 'day');
    box.appendChild(el('div', 'name', dayName));
    box.appendChild(el('div', 'icon', icon));
    box.appendChild(el('div', 'range',
      Math.round(daily.temperature_2m_max[i]) + '° / ' + Math.round(daily.temperature_2m_min[i]) + '°'));
    forecastBox.appendChild(box);
  }
}

searchBtn.addEventListener('click', loadWeather);
cityInput.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') loadWeather();
});

loadWeather();
