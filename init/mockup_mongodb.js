db = db.getSiblingDB('mongodb');

db.stations.insertMany([
  {
    "station_id": "1",
    "latitude": -23.583700,
    "longitude": -46.689109,
    "params": {"min": 0.0, "max": 5000}
  },
  {
    "station_id": "2",
    "latitude": -23.585159,
    "longitude": -46.673926,
    "params": {"min": 0.0, "max": 5000}
  },
  {
    "station_id": "3",
    "latitude": -23.561730,
    "longitude": -46.691781,
    "params": {"min": 0.0, "max": 5000}
  },
  {
    "station_id": "4",
    "latitude": -23.564533,
    "longitude": -46.683364,
    "params": {"min": 0.0, "max": 5000}
  },
  {
    "station_id": "5",
    "latitude": -23.549287,
    "longitude": -46.712517,
    "params": {"min": 0.0, "max": 5000}
  },
  {
    "station_id": "6",
    "latitude": -23.544668,
    "longitude": -46.709314,
    "params": {"min": 0.0, "max": 5000}
  },
  {
    "station_id": "7",
    "latitude": -23.572886862631535,
    "longitude": -46.70642214398499,
    "params": {"min": 0.0, "max": 5000}
  },
  {
    "station_id": "8",
    "latitude": -23.552902,
    "longitude": -46.690221,
    "params": {"min": 0.0, "max": 5000}
  },
  {
    "station_id": "9",
    "latitude": -23.556710,
    "longitude": -46.693748,
    "params": {"min": 0.0, "max": 5000}
  },
  {
    "station_id": "10",
    "latitude": -23.593845,
    "longitude": -46.685434,
    "params": {"min": 0.0, "max": 5000}
  },
  {
    "station_id": "11",
    "latitude": -23.597521,
    "longitude": -46.691947,
    "params": {"min": 0.0, "max": 5000}
  },
  {
    "station_id": "12",
    "latitude": -23.596499,
    "longitude": -46.717842,
    "params": {"min": 0.0, "max": 5000}
  },
  {
    "station_id": "13",
    "latitude": -23.532880,
    "longitude": -46.791603,
    "params": {"min": 0.0, "max": 5000}
  }
]);