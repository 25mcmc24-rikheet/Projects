const cityInput = document.getElementById("cityInput") as HTMLInputElement;
const getWeatherBtn = document.getElementById("getWeatherBtn") as HTMLButtonElement;
const resultDiv = document.getElementById("result") as HTMLDivElement;

interface WeatherResponse {
    name: string;
    main: {
        temp: number;
        humidity: number;
    };
    weather: {
        description: string;
    }[];
}

interface ErrorResponse {
    message: string;
}

const API_KEY = "e88a8b49ea1acf43fa3361e94b9c4979";

getWeatherBtn.addEventListener("click", () => {
    const city = cityInput.value.trim();

    if (!city) {
        resultDiv.innerText = "Please enter a city name.";
        return;
    }

    fetchWeather(city);
});

async function fetchWeather(city: string): Promise<void> {
    resultDiv.innerText = "Loading...";

    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
        );

        const data = await response.json();

        if (!response.ok) {
            const err = data as ErrorResponse;
            resultDiv.innerText = "Error: " + err.message;
            return;
        }

        displayWeather(data as WeatherResponse);
    } catch {
        resultDiv.innerText = "Network error. Please try again later.";
    }
}

function displayWeather(data: WeatherResponse): void {
    const { temp, humidity } = data.main;
    const description = data.weather[0]?.description ?? "No description available";

    resultDiv.innerHTML = `
        <h3>${data.name}</h3>
        <p>Temperature: ${temp} °C</p>
        <p>Humidity: ${humidity} %</p>
        <p>Condition: ${description}</p>
    `;

}