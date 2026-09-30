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

  const getLocation = (): Promise<LocationCoords> => {
    return new Promise((resolve, reject) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 120000 }
        );
      } else reject(new Error('Tarayıcı konum hizmetini desteklemiyor.'));
    });
  };

  const getLocationName = async (lat: number, lon: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
        { headers: { 'Accept-Language': 'tr' } }
      );
      const data = await response.json();
      return data.address?.city || data.address?.town || data.address?.village || 'Bilinmeyen Konum';
    } catch {
      return 'Bilinmeyen Konum';
    }
  };

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError('');

      const coords = await getLocation();
      const locationName = await getLocationName(coords.latitude, coords.longitude);

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto&temperature_unit=celsius`
      );

      if (!response.ok) throw new Error('Hava durumu verisi alınamadı.');

      const data = await response.json();
      const current = data.current;

      const descriptions: Record<number, string> = {
        0: 'Açık', 1: 'Hafif Bulutlu', 2: 'Parçalı Bulutlu', 3: 'Bulutlu',
        45: 'Sisli', 48: 'Dumanlı / Sisli', 51: 'Hafif Çiseleme', 53: 'Çiseleme',
        55: 'Yoğun Çiseleme', 56: 'Soğuk Çiseleme', 57: 'Yoğun Soğuk Çiseleme',
        61: 'Hafif Yağmur', 63: 'Yağmur', 65: 'Şiddetli Yağmur', 66: 'Hafif Dondurucu Yağmur',
        67: 'Dondurucu Yağmur', 71: 'Hafif Kar', 73: 'Kar', 75: 'Şiddetli Kar', 77: 'Kar Tanesi',
        80: 'Hafif Sağanak', 81: 'Sağanak', 82: 'Şiddetli Sağanak', 85: 'Hafif Kar Yağışı',
        86: 'Şiddetli Kar Yağışı', 95: 'Gök Gürültülü', 96: 'Dolu', 99: 'Şiddetli Dolu'
      };

      setWeather({
        temperature: Math.round(current.temperature_2m),
        description: descriptions[current.weather_code] || 'Bilinmiyor',
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m),
        location: locationName,
        latitude: coords.latitude,
        longitude: coords.longitude,
        timezone: data.timezone,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hava durumu bilgisi alınamadı.');
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  const updateTime = () => {
    if (!weather?.timezone) return;

    const timeFormatter = new Intl.DateTimeFormat('tr-TR', {
      timeZone: weather.timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
      timeZone: weather.timezone,
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    setTime(timeFormatter.format(new Date()));
    setDate(dateFormatter.format(new Date()));
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

  useEffect(() => {
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="weather-widget error">
        <AlertCircle size={20} />
        <div className="error-content">
          <p className="error-title">Hava durumu yüklenemedi</p>
          <p className="error-message">{error}</p>
          <button onClick={fetchWeather} className="retry-button">Tekrar dene</button>
        </div>
      </div>
    );
  }

  if (loading || !weather) {
    return (
      <div className="weather-widget loading">
        <Cloud size={24} className="spin" />
        <span>Hava durumu yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="weather-widget">
      <div className="weather-header">
        <div className="location-info">
          <MapPin size={16} />
          <span>{weather.location}</span>
        </div>
        <div className="time-info">
          <p className="time">{time}</p>
          <p className="date">{date}</p>
        </div>
      </div>

      <div className="weather-main">
        <div className="temperature-section">
          <Cloud size={48} className="weather-icon" />
          <div>
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
        <small>{weather.latitude.toFixed(4)}°, {weather.longitude.toFixed(4)}°</small>
      </div>
    </div>
  );
}
