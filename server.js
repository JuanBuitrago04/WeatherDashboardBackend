const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: DEEPSEEK_API_KEY
});

app.use(cors());
app.use(express.json());

app.get("/weather", async (req, res) => {
    const { city } = req.query;
    if (!city) {
        return res.status(400).json({ error: "You must provide a city." });
    }

    try {
        const fetch = (await import("node-fetch")).default; // Dynamic import
        const response = await fetch(`https://api.weatherbit.io/v2.0/current?city=${city}&key=${WEATHER_API_KEY}&lang=en`);
        const data = await response.json();

        if (data.error) {
            return res.status(404).json({ error: "City not found." });
        }

        res.json({
            city: data.data[0].city_name,
            temperature: data.data[0].temp,
            description: data.data[0].weather.description,
            icon: `https://www.weatherbit.io/static/img/icons/${data.data[0].weather.icon}.png`,
            wind: data.data[0].wind_spd,
            humidity: data.data[0].rh
        });
    } catch (error) {
        res.status(500).json({ error: "Error getting weather data." });
    }
});

app.get("/recommendation", async (req, res) => {
    const { temperature } = req.query;
    if (temperature === undefined) {
        return res.status(400).json({ error: "You must provide the temperature." });
    }

    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: `You are a helpful assistant. Provide a very short and clear recommendation based on the temperature of ${temperature}°C and include emoji depending on the weather.` }],
            model: "deepseek-chat",
        });

        const recommendation = completion.choices[0].message.content;

        res.json({ recommendation });
    } catch (error) {
        res.status(500).json({ error: "Error getting the recommendation." });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});