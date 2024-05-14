db = db.getSiblingDB('mongodb');

db.devices.insertMany([
  {
    "device_id": "1",
    "owner": "0xB1c247Dc3c051efc095a6D868A1F24428Ed4e947",
    "latitude": -23.583700,
    "longitude": -46.689109,
    "params": {"min": 0.0, "max": 5000}
  },
  {
    "device_id": "2",
    "owner": "0x0d45C62Eea0a7D73458Cc1A887066256d65C3642",
    "latitude": -23.585159,
    "longitude": -46.673926,
    "params": {"min": 0.0, "max": 5000}
  },
  {
    "device_id": "3",
    "owner": "0xbC0D41D5eF093F344b135675Ff8819025e711e4a",
    "latitude": -23.561730,
    "longitude": -46.691781,
    "params": {"min": 0.0, "max": 5000}
  },
  {
    "device_id": "4",
    "owner": "0x300487C40b556510e36A29a13d91242557635360",
    "latitude": -23.564533,
    "longitude": -46.683364,
    "params": {"min": 0.0, "max": 5000}
  },
  {
    "device_id": "5",
    "owner": "0xd926979DE38b47318165095e02e6d2f8C5b4B9D2",
    "latitude": -23.549287,
    "longitude": -46.712517,
    "params": {"min": 0.0, "max": 5000}
  },
  {
    "device_id": "6",
    "owner": "0x61bBB9A677f4daB7B83709Ed124c81B50724FC6A",
    "latitude": -23.544668,
    "longitude": -46.709314,
    "params": {"min": 0.0, "max": 5000}
  },
  {
    "device_id": "7",
    "owner": "0x71bc4143081c67F7BE26f38F5346743d05888378",
    "latitude": -23.572886862631535,
    "longitude": -46.70642214398499,
    "params": {"min": 0.0, "max": 5000}
  },
  {
    "device_id": "8",
    "owner": "0x4647e9B40F653AB0B96956C3f6e38E74D81c4A82",
    "latitude": -23.552902,
    "longitude": -46.690221,
    "params": {"min": 0.0, "max": 5000}
  },
  {
    "device_id": "9",
    "owner": "0x9E4a4ea7C84B92E2ffF0089D1C8d2CD66d133De9",
    "latitude": -23.556710,
    "longitude": -46.693748,
    "params": {"min": 0.0, "max": 5000}
  },
  {
    "device_id": "10",
    "owner": "0xC6055201296a1D048106f446163F7B2F658EF0D3",
    "latitude": -23.593845,
    "longitude": -46.685434,
    "params": {"min": 0.0, "max": 5000}
  }
]);