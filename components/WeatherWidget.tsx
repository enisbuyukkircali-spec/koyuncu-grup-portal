'use client';

import { useState, useEffect } from 'react';
import { Cloud, Droplets, Wind, MapPin, AlertCircle } from 'lucide-react';

interface WeatherData {
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  location: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

interface LocationCoords {
  latitude: number;
  longitude: number;
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Konumu al
  const getLocation = (): Promise<LocationCoords> => {
    return new Promise((resolve, reject) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (err) => {
            reject(err);
          }
        );
      } else {
        reject(new Error('Tarayıcı konum hizmetini desteklemiyor'));
      }
    });
  };

  // Ters coğrafi kodlama - koordinatlardan şehir adı
  const getLocationName = async (lat: number, lon: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
        { headers: { 'Accept-Language': 'tr' } }
      );
      const data = await response.json();
      return data.address?.city || data.address?.town || 'Bilinmeyen Konum';
    } catch {
      return 'Bilinmeyen Konum';
    }
  };

  // Hava durumunu al
  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError('');

      // Konumu al
      const coords = await getLocation();
      const locationName = await getLocationName(coords.latitude, coords.longitude);

      // Open-Meteo API'den hava durumunu al
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto&temperature_unit=celsius`
      );

      if (!weatherResponse.ok) throw new Error('Hava durumu verisi alınamadı');

      const weatherData = await weatherResponse.json();
      const current = weatherData.current;
      const timezone = weatherData.timezone;

      // Hava durumu kodundan açıklama
      const descriptions: Record<number, string> = {
        0: 'Açık',
        1: 'Hafif Bulutlu',
        2: 'Kısmi Bulutlu',
        3: 'Bulutlu',
        45: 'Sisli',
        48: 'Sisli',
        51: 'Hafif Yağmur',
        53: 'Orta Yağmur',
        55: 'Şiddetli Yağmur',
        61: 'Hafif Yağmur',
        63: 'Yağmur',
        65: 'Şiddetli Yağmur',
        71: 'Hafif Kar',
        73: 'Kar',
        75: 'Şiddetli Kar',
        77: 'Kar Taneleri',
        80: 'Hafif Yağmurlu',
        81: 'Yağmurlu',
        82: 'Şiddetli Yağmurlu',
        85: 'Hafif Kar Yağışlı',
        86: 'Şiddetli Kar Yağışlı',
        95: 'Gök Gürültülü',
        96: 'Dolu ile Gök Gürültülü',
        99: 'Büyük Dolu ile Gök Gürültülü',
      };

      setWeather({
        temperature: Math.round(current.temperature_2m),
        description: descriptions[current.weather_code] || 'Bilinmiyor',
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m),
        location: locationName,
        latitude: coords.latitude,
        longitude: coords.longitude,
        timezone: timezone,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Hava durumu bilgisi alınamadı. Lütfen konum izni veriniz.'
      );
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  // Saati güncelle
  const updateTime = () => {
    if (weather?.timezone) {
      const formatter = new Intl.DateTimeFormat('tr-TR', {
        timeZone: weather.timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
        timeZone: weather.timezone,
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        weekday: 'long',
      });

      setTime(formatter.format(new Date()));
      setDate(dateFormatter.format(new Date()));
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  useEffect(() => {
    if (weather?.timezone) {
      updateTime();
      const interval = setInterval(updateTime, 1000);
      return () => clearInterval(interval);
    }
  }, [weather?.timezone]);

  // Her 10 dakikada hava durumunu yenile
  useEffect(() => {
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="weather-widget error">
        <AlertCircle size={20} />
        <div className="error-content">
          <p className="error-title">Hava Durumu Bilgisi Yüklenemedi</p>
          <p className="error-message">{error}</p>
          <button onClick={fetchWeather} className="retry-button">
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  if (loading || !weather) {
    return (
      <div className="weather-widget loading">
        <Cloud size={24} className="spin" />
        <p>Hava durumu yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="weather-widget">
      <div className="weather-header">
        <div className="location-info">
          <MapPin size={16} />
          <span className="location-name">{weather.location}</span>
        </div>
        <div className="time-info">
          <p className="time">{time}</p>
          <p className="date">{date}</p>
        </div>
      </div>

      <div className="weather-main">
        <div className="temperature-section">
          <Cloud size={48} className="weather-icon" />
          <div className="temp-info">
            <p className="temperature">{weather.temperature}°C</p>
            <p className="description">{weather.description}</p>
          </div>
        </div>

        <div className="weather-details">
          <div className="detail-item">
            <Droplets size={18} />
            <div>
              <p className="detail-label">Nem</p>
              <p className="detail-value">{weather.humidity}%</p>
            </div>
          </div>
          <div className="detail-item">
            <Wind size={18} />
            <div>
              <p className="detail-label">Rüzgar</p>
              <p className="detail-value">{weather.windSpeed} km/s</p>
            </div>
          </div>
        </div>
      </div>

      <div className="coordinates">
        <small>
          {weather.latitude.toFixed(4)}°, {weather.longitude.toFixed(4)}°
        </small>
      </div>
    </div>
  );
}
