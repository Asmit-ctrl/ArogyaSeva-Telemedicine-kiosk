let mockInterval;

export async function connectPulseOximeter() {
  if ("bluetooth" in navigator) {
    return navigator.bluetooth.requestDevice({ acceptAllDevices: true });
  }
  return { mock: true };
}

export async function connectSerialDevice() {
  if ("serial" in navigator) {
    return navigator.serial.requestPort();
  }
  return { mock: true };
}

export function startVitalsStream(onVitals) {
  stopVitalsStream();

  mockInterval = setInterval(() => {
    const vitals = {
      heartRate: String(68 + Math.floor(Math.random() * 16)),
      bloodPressure: `${110 + Math.floor(Math.random() * 20)}/${70 + Math.floor(Math.random() * 14)}`,
      temperature: (36 + Math.random() * 1.8).toFixed(1),
      spo2: String(95 + Math.floor(Math.random() * 4)),
      weight: (52 + Math.random() * 20).toFixed(1)
    };
    onVitals(vitals);
  }, 1800);
}

export function stopVitalsStream() {
  if (mockInterval) {
    clearInterval(mockInterval);
    mockInterval = null;
  }
}
