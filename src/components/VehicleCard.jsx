export default function VehicleCard({ vehicle, price }) {
  if (!vehicle) return null;

  return (
    <div className="mt-6 rounded-2xl border border-emerald-200 bg-white p-5 shadow-lg">

      <div className="flex items-center gap-4">

        <img
          src={vehicle.image}
          alt={vehicle.name}
          className="h-28 w-44 rounded-xl object-cover"
        />

        <div className="flex-1">

          <h3 className="text-xl font-bold">
            {vehicle.name}
          </h3>

          <p className="text-sm text-gray-500">
            ⭐ Recommended for your trip
          </p>

          <div className="mt-3 flex flex-wrap gap-2">

            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm">
              👤 {vehicle.passengers} Passengers
            </span>

            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm">
              🧳 {vehicle.luggage} Luggage
            </span>

            <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm">
              ⚡ Electric
            </span>

          </div>

        </div>

        <div className="text-right">

          <p className="text-sm text-gray-500">
            Total Price
          </p>

          <h2 className="text-3xl font-bold text-emerald-700">
            €{price}
          </h2>

        </div>

      </div>

    </div>
  );
}