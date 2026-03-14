import { useEffect } from "react";
import { usePatientStore } from "../store/patientStore";
import { startVitalsStream, stopVitalsStream } from "../services/deviceService";

export function useVitals(active = true) {
  const vitals = usePatientStore((state) => state.vitals);
  const setVitals = usePatientStore((state) => state.setVitals);

  useEffect(() => {
    if (!active) {
      return;
    }

    startVitalsStream((data) => setVitals(data));
    return () => stopVitalsStream();
  }, [active, setVitals]);

  return vitals;
}
