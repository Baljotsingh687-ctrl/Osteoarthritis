// ESP32 hand-off point. The browser talks only to the hardware here; the
// resulting features are sent to the Node backend, which calls the IMU model.
export async function connectSensorKit() {
  if (!navigator.bluetooth) throw new Error('Web Bluetooth is not supported. Use Chrome on Android/desktop.')
  const service = import.meta.env.VITE_SENSOR_SERVICE_UUID
  const characteristic = import.meta.env.VITE_SENSOR_CHARACTERISTIC_UUID
  if (!service || !characteristic) throw new Error('Sensor UUIDs are not configured')
  const device = await navigator.bluetooth.requestDevice({ filters: [{ services: [service] }], optionalServices: [service] })
  const server = await device.gatt.connect()
  const serviceObj = await server.getPrimaryService(service)
  const char = await serviceObj.getCharacteristic(characteristic)
  return { device, characteristic: char }
}

export async function readSensorReadings(connection) {
  const value = await connection.characteristic.readValue()
  const text = new TextDecoder().decode(value)
  let data
  try { data = JSON.parse(text) } catch { throw new Error('ESP32 characteristic must contain JSON sensor features') }
  return { status: 'complete', ...data }
}
