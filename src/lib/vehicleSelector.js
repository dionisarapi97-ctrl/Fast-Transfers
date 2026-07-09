export function selectVehicle(passengers, luggage) {
  if (passengers >= 5) {
    return {
      type: "choice",
      title: "Choose your best option",
      options: [
        {
          name: "Mercedes-Benz Vito",
          description: "Mercedes Vito Van (Best for groups of 5-8 passengers).",
        },
        {
          name: "2 Electric Taxis",
          description: "Two premium electric vehicles for extra comfort.",
        },
      ],
    };
  }

  return {
    type: "single",
    name: "Toyota bZ4X",
    description: "Recommended premium electric transfer.",
  };
}