export function selectVehicle(passengers, luggage) {
  if (passengers >= 8) {
    return {
      type: "choice",
      title: "Choose your best option",
      options: [
        {
          name: "Mercedes-Benz Vito",
          description: "Best for large groups with luggage.",
        },
        {
          name: "2 Electric Taxis",
          description: "Two premium electric vehicles for extra comfort.",
        },
      ],
    };
  }

  if (passengers >= 5 || luggage >= 4) {
    return {
      type: "single",
      name: "Volkswagen ID.6 or BYD Tang",
      description: "Recommended for families and medium groups.",
    };
  }

  return {
    type: "single",
    name: "Toyota bZ4X",
    description: "Recommended premium electric transfer.",
  };
}